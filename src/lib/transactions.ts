import { listTransactionsFull, listCars, type TransactionFull } from "@/lib/airtable";

export type TransactionView = TransactionFull & { carLabel: string };

export async function listTransactionViews(): Promise<TransactionView[]> {
  const [transactions, cars] = await Promise.all([listTransactionsFull(), listCars()]);
  const carById = new Map(cars.map((c) => [c.id, c]));

  return transactions.map((tx) => {
    const car = carById.get(tx.carId);
    return {
      ...tx,
      carLabel: car ? `${car.rego} — ${car.make} ${car.model}` : "—",
    };
  });
}
