import { verifySession } from "@/lib/dal";
import { listCars } from "@/lib/airtable";
import { TransactionForm } from "@/components/TransactionForm";
import { AppHeader } from "@/components/AppHeader";

export default async function Home() {
  await verifySession();
  const cars = await listCars();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-10 pt-6">
      <AppHeader />
      <TransactionForm cars={cars} />
    </div>
  );
}
