import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { getCarFinancials, getPeriodMetrics } from "@/lib/financials";
import { listTransactionViews } from "@/lib/transactions";
import { logout } from "@/app/actions/auth";
import { AppNav } from "@/components/AppNav";
import { Stat } from "@/components/Stat";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { PeriodFilterForm } from "@/components/PeriodFilterForm";
import { TransactionRow } from "@/components/TransactionRow";
import { formatCurrency, formatDateAU, formatPercent } from "@/lib/format";

export default async function CarDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await verifySession();
  const { id } = await params;
  const { from, to } = await searchParams;

  const [cars, allTransactions] = await Promise.all([getCarFinancials(), listTransactionViews()]);
  const car = cars.find((c) => c.id === id);
  if (!car) notFound();

  const carTransactions = allTransactions
    .filter((tx) => tx.carId === id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const period = getPeriodMetrics(carTransactions, { from, to });

  const periodTransactions = carTransactions.filter(
    (tx) => (!from || tx.date >= from) && (!to || tx.date <= to)
  );

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

      <Link
        href="/dashboard"
        className="mb-4 inline-block text-sm text-teal-700 dark:text-teal-400"
      >
        ← Volver al dashboard
      </Link>

      <h1 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {car.rego} — {car.make} {car.model}
      </h1>

      <section className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Indicadores acumulados desde la compra
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Stat
            label="Invertido"
            value={formatCurrency(car.totalInvested)}
            breakdown={
              car.setupCost > 0 ? (
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Compra {formatCurrency(car.basePrice)} + costos iniciales{" "}
                  {formatCurrency(car.setupCost)}
                </div>
              ) : undefined
            }
          />
          <Stat
            label="Neto acumulado"
            value={formatCurrency(car.net)}
            tone={car.net >= 0 ? "positive" : "negative"}
          />
          <Stat
            label="ROI acumulado"
            value={car.totalInvested > 0 ? formatPercent(car.breakevenProgress) : "—"}
            tone={car.breakevenProgress >= 0 ? "positive" : "negative"}
          />
          <Stat
            label="ROI anualizado"
            value={car.roiAnnualized !== null ? formatPercent(car.roiAnnualized) : "—"}
            tone={car.roiAnnualized !== null && car.roiAnnualized >= 0 ? "positive" : "negative"}
          />
        </div>
        <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          {car.purchaseDate
            ? `Comprado el ${formatDateAU(car.purchaseDate)}`
            : "Falta cargar la fecha de compra en Airtable (purchase_date) para calcular el ROI anualizado."}
          {car.breakevenReached && car.breakevenDate && (
            <> · Breakeven alcanzado el {formatDateAU(car.breakevenDate)}</>
          )}
        </div>
      </section>

      <div className="mb-4">
        <PeriodFilterForm resetHref={`/dashboard/${car.id}`} from={from} to={to} />
      </div>

      <section className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {from || to
            ? `Período: ${period.from ? formatDateAU(period.from) : "—"} al ${
                period.to ? formatDateAU(period.to) : "—"
              }`
            : "Indicadores de todo el historial"}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Stat
            label="Ingresos"
            value={formatCurrency(period.income)}
            breakdown={<CategoryBreakdown items={period.incomeBreakdown} />}
          />
          <Stat
            label="Gastos"
            value={formatCurrency(period.expense)}
            breakdown={<CategoryBreakdown items={period.expenseBreakdown} />}
          />
          <Stat
            label="Cash flow neto"
            value={formatCurrency(period.net)}
            tone={period.net >= 0 ? "positive" : "negative"}
          />
          <Stat
            label="Margen operativo"
            value={period.operatingMargin !== null ? formatPercent(period.operatingMargin) : "—"}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4 border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <div>
            Promedio semanal de ingreso:{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {formatCurrency(period.avgWeeklyIncome)}
            </span>
          </div>
          <div>
            Promedio semanal de gasto:{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {formatCurrency(period.avgWeeklyExpense)}
            </span>
          </div>
        </div>
      </section>

      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Transacciones ({periodTransactions.length})
      </h2>
      <div className="space-y-2">
        {periodTransactions.length === 0 ? (
          <p className="text-sm text-zinc-400">No hay movimientos en este período.</p>
        ) : (
          periodTransactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
        )}
      </div>
    </div>
  );
}
