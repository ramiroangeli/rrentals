import { listContracts, listRenters, listCarsFull } from "@/lib/airtable";

export type ContractView = {
  id: string;
  contractId: string;
  renterName: string;
  renterDocsUrl: string | null;
  carLabel: string;
  startDate: string | null;
  endDate: string | null;
  weeklyRate: number;
  bond: number;
  status: string;
  contractDocsUrl: string | null;
};

export async function listContractViews(): Promise<ContractView[]> {
  const [contracts, renters, cars] = await Promise.all([
    listContracts(),
    listRenters(),
    listCarsFull(),
  ]);

  const renterById = new Map(renters.map((r) => [r.id, r]));
  const carById = new Map(cars.map((c) => [c.id, c]));

  return contracts.map((contract) => {
    const renter = contract.renterIds[0] ? renterById.get(contract.renterIds[0]) : undefined;
    const car = contract.carIds[0] ? carById.get(contract.carIds[0]) : undefined;

    return {
      id: contract.id,
      contractId: contract.contractId,
      renterName: renter?.name ?? "—",
      renterDocsUrl: renter?.driveFolderUrl ?? null,
      carLabel: car ? `${car.rego} — ${car.make} ${car.model}` : "—",
      startDate: contract.startDate,
      endDate: contract.endDate,
      weeklyRate: contract.weeklyRate,
      bond: contract.bond,
      status: contract.status,
      contractDocsUrl: contract.driveFolderUrl,
    };
  });
}
