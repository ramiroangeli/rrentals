"use server";

import { revalidatePath } from "next/cache";
import { createRenter, createContract, listCarsFull } from "@/lib/airtable";
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

  const cars = await listCarsFull();
  const car = cars.find((c) => c.id === carId);
  if (!car) return { error: "Invalid vehicle." };

  const fullName = `${firstName} ${lastName}`;
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

  let folderLink: string | null = null;
  for (const { file, label } of filesToUpload) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const result = await uploadToDrive(
      buffer,
      `${label}.${ext}`,
      file.type || "application/octet-stream",
      subfolderName
    );
    folderLink = result.folderLink;
  }

  const renterId = await createRenter({
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
    driveFolderUrl: folderLink,
  });

  await createContract({
    renterId,
    carId,
    startDate: rentalStartDate,
    weeklyRate: car.weeklyRate,
    bond: 0,
    status: "Pendiente",
  });

  revalidatePath("/contratos");
  return { success: true };
}
