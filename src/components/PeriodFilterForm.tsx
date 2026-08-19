import Link from "next/link";

export function PeriodFilterForm({
  resetHref,
  from,
  to,
}: {
  resetHref: string;
  from?: string;
  to?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <form className="flex items-end gap-2" method="get">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-zinc-500">Desde</label>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="w-full rounded-lg border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-zinc-500">Hasta</label>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="w-full rounded-lg border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white dark:bg-teal-500 dark:text-teal-950"
        >
          Aplicar
        </button>
      </form>
      {(from || to) && (
        <Link
          href={resetHref}
          className="mt-2 inline-block text-xs text-teal-700 underline dark:text-teal-400"
        >
          Ver todo el historial
        </Link>
      )}
    </div>
  );
}
