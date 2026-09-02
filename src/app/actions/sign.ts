"use server";

import { revalidatePath } from "next/cache";
import { signContract, getContract, getRenter, listCarsFull } from "@/lib/airtable";
import { buildContractHtml, type ContractTemplateInput, type LicenceType } from "@/lib/contractTemplate";
import { buildContractPdf } from "@/lib/contractPdf";
import { resolveRenterFolder, uploadFileToFolder, renterFolderName } from "@/lib/googleDrive";

export type SignFormState = { error?: string } | undefined;

export async function submitSignature(
  _state: SignFormState,
  formData: FormData
): Promise<SignFormState> {
  const contractId = formData.get("contractId");
  const name = formData.get("signedName");
  const agreed = formData.get("agree");

  if (typeof contractId !== "string" || !contractId) return { error: "Missing contract." };
  if (typeof name !== "string" || !name.trim()) return { error: "Enter your full name to sign." };
  if (!agreed) return { error: "You must confirm you've read and accept the agreement." };

  const signedName = name.trim();
  const signedAt = new Date().toISOString();
  await signContract(contractId, signedName, signedAt);

  // Guardar una copia (HTML + PDF) del contrato firmado en la carpeta de
  // Drive del inquilino. Best-effort: si Drive falla acá, la firma ya quedó
  // grabada en Airtable, no tiene sentido bloquear al inquilino por esto.
  try {
    const contract = await getContract(contractId);
    const renterId = contract?.renterIds[0];
    const carId = contract?.carIds[0];

    if (contract && renterId && carId && contract.startDate) {
      const [renter, cars] = await Promise.all([getRenter(renterId), listCarsFull()]);
      const car = cars.find((c) => c.id === carId);

      if (renter && car) {
        const licenceType: LicenceType =
          renter.licenceIssuingCountry.trim().toLowerCase() === "australia"
            ? "Australiana"
            : "Extranjera";

        const templateInput: ContractTemplateInput = {
          agreementDate: signedAt.slice(0, 10),
          rentalStartDate: contract.startDate,
          weeklyRate: contract.weeklyRate,
          bond: contract.bond,
          car: {
            year: car.year ?? "-",
            make: car.make,
            model: car.model,
            rego: car.rego,
            vin: car.vin ?? "-",
          },
          renter: {
            fullName: renter.name,
            address: renter.address,
            dateOfBirth: renter.dateOfBirth ?? "",
            phone: renter.phone,
            licenceType,
            licenceNumber: renter.licenceNumber,
            licenceIssuingCountry: renter.licenceIssuingCountry,
            licenceExpiry: renter.licenceExpiry ?? "",
            passportNumber: renter.passportNumber,
            qldCrn: renter.qldCrn,
          },
          signature: { name: signedName, signedAt },
        };

        const html = buildContractHtml(templateInput);
        const pdf = await buildContractPdf({ ...templateInput, contractId: contract.contractId });

        const subfolderName = renterFolderName(
          `${car.make} ${car.model}`,
          renter.name,
          contract.startDate
        );
        const folder = await resolveRenterFolder(subfolderName);
        await Promise.all([
          uploadFileToFolder(Buffer.from(html, "utf-8"), "signed-contract.html", "text/html", folder.folderId),
          uploadFileToFolder(pdf, "signed-contract.pdf", "application/pdf", folder.folderId),
        ]);
      }
    }
  } catch {
    // No bloquea la firma si falla el archivo en Drive.
  }

  revalidatePath(`/firmar/${contractId}`);
}
