import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { getTransaction, listCars } from "@/lib/airtable";
import { AppHeader } from "@/components/AppHeader";
import { EditTransactionForm } from "@/components/EditTransactionForm";
import { DeleteTransactionButton } from "@/components/DeleteTransactionButton";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await verifySession();
  const { id } = await params;
  const [transaction, cars] = await Promise.all([getTransaction(id), listCars()]);

  if (!transaction) notFound();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-10 pt-6">
      <AppHeader />

      <Link href="/historial" className="mb-4 inline-block text-sm text-teal-700 dark:text-teal-400">
        ← Volver al historial
      </Link>

      <EditTransactionForm transaction={transaction} cars={cars} />

      <div className="mt-4">
        <DeleteTransactionButton id={transaction.id} />
      </div>
    </div>
  );
}
