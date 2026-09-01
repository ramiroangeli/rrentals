"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { createRenter, createContract, listCarsFull, type CarFull } from "@/lib/airtable";
import { uploadToDrive, renterFolderName } from "@/lib/googleDrive";
import { todayISOBrisbane } from "@/lib/format";

export type IntakeFormState = { error?: string; success?: boolean } | undefined;

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// Nombre de archivo estable para un backup: mismo prefijo en intake-backups/
// e intake-needs-review/, así los dos son fáciles de emparejar a mano.
function backupFileName(fullName: string, submittedAt: string): string {
  const slug = fullName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${submittedAt.replace(/[:.]/g, "-")}-${slug || "solicitud"}.json`;
}

export async function submitIntake(
  _state: IntakeFormState,
  formData: FormData
): Promise<IntakeFormState> {
  const firstName = getString(formData, "firstName");
  const lastName = getString(formData, "lastName");
  const dateOfBirth = getString(formData, "dateOfBirth");
  const address = getString(formData, "address");
  const nationality = getString(formData, "nationality");
  const phoneLocal = getString(formData, "phoneLocal");
  const whatsapp = getString(formData, "whatsapp");
  const carId = getString(formData, "carId");
  const rentalStartDate = getString(formData, "rentalStartDate");
  const licenceNumber = getString(formData, "licenceNumber");
  const licenceIssuingCountry = getString(formData, "licenceIssuingCountry");
  const licenceExpiry = getString(formData, "licenceExpiry");
  const passportNumber = getString(formData, "passportNumber");
  const qldCrn = getString(formData, "qldCrn");

  if (!firstName || !lastName) return { error: "Enter first and last name." };
  if (!dateOfBirth) return { error: "Enter your date of birth." };
  if (!address) return { error: "Enter your Australian address." };
  if (!nationality) return { error: "Enter your nationality." };
  if (!phoneLocal) return { error: "Enter your phone number." };
  if (!carId) return { error: "Select a vehicle." };
  if (!rentalStartDate) return { error: "Enter the rental start date." };
  if (rentalStartDate < todayISOBrisbane()) {
    return { error: "The rental start date can't be in the past." };
  }
  if (!licenceNumber) return { error: "Enter your driver's licence number." };
  if (!licenceIssuingCountry) return { error: "Enter your driver's licence issuing country." };
  if (!/^\d{9}$/.test(qldCrn)) return { error: "The Queensland CRN must be exactly 9 digits." };

  const licenceType = getString(formData, "licenceType");
  const auLicenceFrontPhoto = getFile(formData, "auLicenceFrontPhoto");
  const auLicenceBackPhoto = getFile(formData, "auLicenceBackPhoto");
  const intlLicenceFrontPhoto = getFile(formData, "intlLicenceFrontPhoto");
  const intlLicenceBackPhoto = getFile(formData, "intlLicenceBackPhoto");
  const crnPhoto = getFile(formData, "crnPhoto");

  // Licencia australiana: frente + dorso alcanzan (el CRN ya está impreso en
  // la tarjeta). Licencia internacional: frente + dorso + foto del CRN aparte.
  if (licenceType === "Australian") {
    if (!auLicenceFrontPhoto || !auLicenceBackPhoto) {
      return { error: "Attach both the front and back of your Australian licence." };
    }
  } else if (licenceType === "International") {
    if (!intlLicenceFrontPhoto || !intlLicenceBackPhoto || !crnPhoto) {
      return {
        error: "Attach the front and back of your international licence, plus your CRN photo.",
      };
    }
  } else {
    return { error: "Select your licence type." };
  }

  const fullName = `${firstName} ${lastName}`;
  const submittedAt = new Date().toISOString();

  // Backup crudo de todo lo que mandó el cliente (menos las fotos), guardado
  // ANTES de tocar Drive/Airtable - si cualquiera de los dos falla más abajo
  // (como pasó hoy con Drive), el cliente no pierde sus datos ni tiene que
  // completar el formulario de nuevo. Se recupera a mano desde el dashboard
  // de Vercel Blob; ver intake-needs-review/ para los casos que sí fallaron.
  const submissionData = {
    submittedAt,
    firstName,
    lastName,
    dateOfBirth,
    address,
    nationality,
    phone: `+61 ${phoneLocal}`,
    whatsapp: whatsapp || null,
    carId,
    rentalStartDate,
    licenceType,
    licenceNumber,
    licenceIssuingCountry,
    licenceExpiry: licenceExpiry || null,
    passportNumber: passportNumber || null,
    qldCrn,
  };

  const backupName = backupFileName(fullName, submittedAt);
  let backupSaved = false;
  try {
    await put(`intake-backups/${backupName}`, JSON.stringify(submissionData, null, 2), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
    });
    backupSaved = true;
  } catch {
    // Sin red de contención para este envío puntual - seguimos con el flujo
    // normal de todos modos, es la única chance que le queda.
  }

  let pipelineError: string | null = null;
  let car: CarFull | undefined;
  let cars: CarFull[] | null = null;

  try {
    cars = await listCarsFull();
  } catch (e) {
    pipelineError = `No pudimos leer los autos de Airtable: ${errorMessage(e)}`;
  }

  if (cars) {
    car = cars.find((c) => c.id === carId);
    if (!car) {
      // Airtable respondió bien - si el auto no existe de verdad (se borró
      // justo después de cargar el form), es un error real del cliente, no
      // algo para reintentar a mano. El backup en intake-backups/ ya quedó
      // guardado igual, sin usarse.
      return { error: "Invalid vehicle." };
    }
  }

  let driveFolderLink: string | null = null;
  let renterId: string | null = null;

  if (car) {
    const subfolderName = renterFolderName(`${car.make} ${car.model}`, fullName, rentalStartDate);
    const filesToUpload: { file: File; label: string }[] = [
      ...(auLicenceFrontPhoto ? [{ file: auLicenceFrontPhoto, label: "australian-licence-front" }] : []),
      ...(auLicenceBackPhoto ? [{ file: auLicenceBackPhoto, label: "australian-licence-back" }] : []),
      ...(intlLicenceFrontPhoto
        ? [{ file: intlLicenceFrontPhoto, label: "international-licence-front" }]
        : []),
      ...(intlLicenceBackPhoto
        ? [{ file: intlLicenceBackPhoto, label: "international-licence-back" }]
        : []),
      ...(crnPhoto ? [{ file: crnPhoto, label: "crn" }] : []),
    ];

    try {
      for (const { file, label } of filesToUpload) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
        const result = await uploadToDrive(
          buffer,
          `${label}.${ext}`,
          file.type || "application/octet-stream",
          subfolderName
        );
        driveFolderLink = result.folderLink;
      }
    } catch (e) {
      pipelineError = `Drive: ${errorMessage(e)}`;
    }

    try {
      renterId = await createRenter({
        name: fullName,
        address,
        nationality,
        phone: `+61 ${phoneLocal}`,
        whatsapp: whatsapp || null,
        passportNumber: passportNumber || null,
        licenceNumber,
        licenceIssuingCountry,
        licenceExpiry: licenceExpiry || null,
        qldCrn,
        dateOfBirth,
        driveFolderUrl: driveFolderLink,
      });

      await createContract({
        renterId,
        carId,
        startDate: rentalStartDate,
        weeklyRate: car.weeklyRate,
        bond: 0,
        status: "Pendiente",
      });
    } catch (e) {
      pipelineError = (pipelineError ? `${pipelineError} | ` : "") + `Airtable: ${errorMessage(e)}`;
    }
  }

  if (pipelineError) {
    if (!backupSaved) {
      // Nada quedó guardado en ningún lado - a diferencia de los casos de
      // arriba, acá no podemos prometerle nada al cliente.
      return {
        error: "We couldn't process your application right now. Please try again in a few minutes.",
      };
    }

    try {
      await put(
        `intake-needs-review/${backupName}`,
        JSON.stringify({ ...submissionData, driveFolderLink, renterId, error: pipelineError }, null, 2),
        { access: "private", contentType: "application/json", addRandomSuffix: false }
      );
    } catch {
      // El backup original en intake-backups/ ya está guardado - sigue siendo
      // recuperable a mano aunque esta segunda copia no se pudiera escribir.
    }
  }

  revalidatePath("/contratos");
  return { success: true };
}
