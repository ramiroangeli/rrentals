import { verifySession } from "@/lib/dal";
import { listTransactionViews } from "@/lib/transactions";
import { logout } from "@/app/actions/auth";
import { AppNav } from "@/components/AppNav";
import { TransactionRow } from "@/components/TransactionRow";

export default async function HistorialPage() {
  await verifySession();
  const transactions = await listTransactionViews();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-10 pt-6">
      <header className="mb-6 flex items-center justify-between gap-2">
        <AppNav />
        <form action={logout}>
          <button type="submit" className="shrink-0 text-sm text-zinc-500 underline">
            Salir
          </button>
        </form>
      </header>

      <div className="space-y-2">
        {transactions.length === 0 ? (
          <p className="text-sm text-zinc-400">Todavía no cargaste movimientos.</p>
        ) : (
          transactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
        )}
      </div>
    </div>
  );
}
