import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { getCarFinancials, getFleetSummary, getPeriodMetrics } from "@/lib/financials";
import { listAllTransactions } from "@/lib/airtable";
import { logout } from "@/app/actions/auth";
import { AppNav } from "@/components/AppNav";
import { CarDashboardCard } from "@/components/CarDashboardCard";
import { FleetSummaryCard } from "@/components/FleetSummaryCard";
import { PaymentAlarmCard } from "@/components/PaymentAlarmCard";
import { PeriodFilterForm } from "@/components/PeriodFilterForm";
import { Stat } from "@/components/Stat";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { formatCurrency, formatDateAU, formatPercent } from "@/lib/format";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await verifySession();
  const { from, to } = await searchParams;
  const hasPeriodFilter = Boolean(from || to);

  const [cars, allTransactions] = await Promise.all([getCarFinancials(), listAllTransactions()]);
  const fleetSummary = getFleetSummary(cars);

  const fleetPeriod = hasPeriodFilter ? getPeriodMetrics(allTransactions, { from, to }) : null;

  // Mismos números que arma fleetPeriod, pero recortados por auto para poder
  // comparar los 3 dentro de la misma ventana en cada CarDashboardCard.
  const periodByCarId = hasPeriodFilter
    ? new Map(
        cars.map((car) => {
          const carTransactions = allTransactions.filter((tx) => tx.carIds.includes(car.id));
          const { income, expense, net } = getPeriodMetrics(carTransactions, { from, to });
          return [car.id, { income, expense, net }] as const;
        })
      )
    : null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-10 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <AppNav />
        <form action={logout}>
          <button type="submit" className="text-sm text-zinc-500 underline">
            Salir
          </button>
        </form>
      </header>

      <div className="space-y-4">
        <PaymentAlarmCard cars={cars} />

        <FleetSummaryCard summary={fleetSummary} />

        <PeriodFilterForm resetHref="/dashboard" from={from} to={to} />

        {fleetPeriod && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Período: {fleetPeriod.from ? formatDateAU(fleetPeriod.from) : "—"} al{" "}
              {fleetPeriod.to ? formatDateAU(fleetPeriod.to) : "—"}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Stat
                label="Ingresos"
                value={formatCurrency(fleetPeriod.income)}
                breakdown={<CategoryBreakdown items={fleetPeriod.incomeBreakdown} />}
              />
              <Stat
                label="Gastos"
                value={formatCurrency(fleetPeriod.expense)}
                breakdown={<CategoryBreakdown items={fleetPeriod.expenseBreakdown} />}
              />
              <Stat
                label="Neto del período"
                value={formatCurrency(fleetPeriod.net)}
                tone={fleetPeriod.net >= 0 ? "positive" : "negative"}
              />
              <Stat
                label="Margen operativo"
                value={
                  fleetPeriod.operatingMargin !== null
                    ? formatPercent(fleetPeriod.operatingMargin)
                    : "—"
                }
              />
            </div>
          </section>
        )}

        {cars.map((car, index) => (
          <Link key={car.id} href={`/dashboard/${car.id}`} className="block">
            <CarDashboardCard
              car={car}
              accentIndex={index}
              periodStats={periodByCarId?.get(car.id)}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
