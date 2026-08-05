import Link from "next/link";
import type { TransactionView } from "@/lib/transactions";
import { formatCurrency, formatDateAU } from "@/lib/format";

export function TransactionRow({ tx }: { tx: TransactionView }) {
  const isIncome = tx.type === "Income";

  return (
    <Link
      href={`/historial/${tx.id}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 transition-colors hover:border-teal-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-teal-700"
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {tx.category}
        </div>
        <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {formatDateAU(tx.date)} · {tx.carLabel}
        </div>
      </div>
      <div
        className={`shrink-0 text-sm font-bold tabular-nums ${
          isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
        }`}
      >
        {isIncome ? "+" : "-"}
        {formatCurrency(tx.amount)}
      </div>
    </Link>
  );
}
