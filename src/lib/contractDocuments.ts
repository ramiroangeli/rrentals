import "server-only";
import { getContract, getRenter, listCarsFull } from "@/lib/airtable";
import type { ContractTemplateInput, LicenceType } from "@/lib/contractTemplate";

export type SignedContractInput = ContractTemplateInput & { contractId: string };

// Arma el input para generar el HTML/PDF del contrato firmado a partir de lo
// que ya está en Airtable. Lo usan tanto la firma en vivo (sign.ts) como el
// backfill manual para contratos que se firmaron antes de que esto existiera
// y nunca llegaron a guardar una copia (ver CTR-007).
export async function buildSignedContractInput(
  contractRecordId: string
): Promise<SignedContractInput | null> {
  const contract = await getContract(contractRecordId);
  if (!contract || !contract.signedName || !contract.signedAt || !contract.startDate) return null;

  const renterId = contract.renterIds[0];
  const carId = contract.carIds[0];
  if (!renterId || !carId) return null;

  const [renter, cars] = await Promise.all([getRenter(renterId), listCarsFull()]);
  const car = cars.find((c) => c.id === carId);
  if (!renter || !car) return null;

  const licenceType: LicenceType =
    renter.licenceIssuingCountry.trim().toLowerCase() === "australia" ? "Australiana" : "Extranjera";

  return {
    contractId: contract.contractId,
    agreementDate: contract.signedAt.slice(0, 10),
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
    signature: { name: contract.signedName, signedAt: contract.signedAt },
  };
}
