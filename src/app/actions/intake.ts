"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import {
  createRenter,
  createContract,
  listCarsFull,
  updateContractDocumentsUrl,
  appendContractNote,
  type CarFull,
} from "@/lib/airtable";
import { renterDocsPrefix, uploadPrivateDocument, documentsPageUrl } from "@/lib/documents";
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
  // ANTES de tocar Airtable/Blob - si algo falla más abajo, el cliente no
  // pierde sus datos ni tiene que completar el formulario de nuevo. Se
  // recupera a mano desde el dashboard de Vercel Blob; ver
  // intake-needs-review/ para los casos que sí fallaron.
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
  } catch (e) {
    // Sin red de contención para este envío puntual - seguimos con el flujo
    // normal de todos modos, es la única chance que le queda. Se loguea para
    // poder ver en los runtime logs de Vercel si esto está fallando siempre
    // (ej. BLOB_READ_WRITE_TOKEN mal configurado) en vez de fallar mudo.
    console.error("[intake] no se pudo guardar el backup en Blob:", errorMessage(e));
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

  let renterId: string | null = null;

  if (car) {
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

    let contractRecordId: string | null = null;
    let contractIdStr: string | null = null;

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
        driveFolderUrl: null,
      });

      const contract = await createContract({
        renterId,
        carId,
        startDate: rentalStartDate,
        weeklyRate: car.weeklyRate,
        bond: 0,
        status: "Pendiente",
      });
      contractRecordId = contract.id;
      contractIdStr = contract.contractId;
    } catch (e) {
      pipelineError = `Airtable: ${errorMessage(e)}`;
    }

    // Subimos las fotos recién acá, una vez que el inquilino ya existe (el
    // path en Blob usa su recordId para no pisarse con un tocayo). Cada
    // archivo se sube por separado - si uno falla no se cae el resto, a
    // diferencia de Drive antes, donde un solo error (ej. token vencido)
    // tiraba abajo la subida entera sin haber guardado ni una foto.
    if (renterId && contractRecordId && contractIdStr) {
      const prefix = renterDocsPrefix(renterId, fullName);
      const uploadErrors: string[] = [];

      await Promise.all(
        filesToUpload.map(async ({ file, label }) => {
          try {
            const buffer = Buffer.from(await file.arrayBuffer());
            const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
            await uploadPrivateDocument(
              `${prefix}${label}.${ext}`,
              buffer,
              file.type || "application/octet-stream"
            );
          } catch (e) {
            uploadErrors.push(`${label}: ${errorMessage(e)}`);
          }
        })
      );

      const documentsUrl = documentsPageUrl(contractIdStr);
      try {
        await updateContractDocumentsUrl(contractRecordId, documentsUrl);
      } catch (e) {
        console.error("[intake] no se pudo guardar documents_url:", errorMessage(e));
      }

      if (uploadErrors.length > 0) {
        const note = `Documentos: fallaron ${uploadErrors.length}/${filesToUpload.length} archivo(s) al subir - ${uploadErrors.join("; ")}`;
        pipelineError = (pipelineError ? `${pipelineError} | ` : "") + note;
        try {
          await appendContractNote(contractRecordId, note);
        } catch (e) {
          console.error("[intake] no se pudo registrar el error en notes:", errorMessage(e));
        }
      }
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
        JSON.stringify({ ...submissionData, renterId, error: pipelineError }, null, 2),
        { access: "private", contentType: "application/json", addRandomSuffix: false }
      );
    } catch (e) {
      // El backup original en intake-backups/ ya está guardado - sigue siendo
      // recuperable a mano aunque esta segunda copia no se pudiera escribir.
      console.error("[intake] no se pudo guardar intake-needs-review:", errorMessage(e));
    }
  }

  revalidatePath("/contratos");
  return { success: true };
}
