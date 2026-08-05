import type { CarFinancials } from "@/lib/financials";
import { formatCurrency, formatDateAU } from "@/lib/format";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";

const ACCENTS = [
  "before:bg-teal-500",
  "before:bg-amber-500",
  "before:bg-sky-500",
  "before:bg-rose-500",
] as const;

function RegoBanner({ car }: { car: CarFinancials }) {
  const { regoStatus, regoExpiry } = car;

  if (regoStatus.level === "ok" || regoStatus.level === "unknown") return null;

  const isExpired = regoStatus.level === "expired";
  const dateLabel = regoExpiry ? formatDateAU(regoExpiry) : "";

  return (
    <div
      className={`mb-4 rounded-lg px-3 py-2 text-sm font-semibold ${
        isExpired
          ? "bg-red-600 text-white"
          : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
      }`}
    >
      {isExpired
        ? `REGO VENCIDA — venció el ${dateLabel} (hace ${regoStatus.daysAgo} días)`
        : `Rego vence el ${dateLabel} (en ${regoStatus.daysLeft} días)`}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  breakdown,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
  breakdown?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
      <div
        className={`text-xl font-bold tabular-nums ${
          tone === "positive"
            ? "text-emerald-600 dark:text-emerald-400"
            : tone === "negative"
              ? "text-red-600 dark:text-red-400"
              : "text-zinc-900 dark:text-zinc-50"
        }`}
      >
        {value}
      </div>
      {breakdown}
    </div>
  );
}

export function CarDashboardCard({
  car,
  accentIndex = 0,
}: {
  car: CarFinancials;
  accentIndex?: number;
}) {
  const hasInvestment = car.totalInvested > 0;
  const progressPct = hasInvestment
    ? Math.min(Math.max(car.breakevenProgress, 0), 1) * 100
    : 0;
  const progressLabel = hasInvestment
    ? `${Math.round(car.breakevenProgress * 100)}%`
    : null;
  const accent = ACCENTS[accentIndex % ACCENTS.length];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 pl-5 shadow-sm before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:content-[''] dark:border-zinc-800 dark:bg-zinc-950 ${accent}`}
    >
      <RegoBanner car={car} />

      <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {car.rego} — {car.make} {car.model}
      </h2>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <Stat
          label="Invertido"
          value={hasInvestment ? formatCurrency(car.totalInvested) : "—"}
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
          label="Neto"
          value={formatCurrency(car.net)}
          tone={car.net >= 0 ? "positive" : "negative"}
        />
        <Stat
          label="Ingresos"
          value={formatCurrency(car.totalIncome)}
          breakdown={<CategoryBreakdown items={car.incomeBreakdown} />}
        />
        <Stat
          label="Gastos"
          value={formatCurrency(car.totalExpense)}
          breakdown={<CategoryBreakdown items={car.expenseBreakdown} />}
        />
      </div>

      {hasInvestment ? (
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Progreso a breakeven</span>
            <span className="font-medium">{progressLabel}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-full rounded-full ${car.breakevenReached ? "bg-emerald-500" : "bg-zinc-900 dark:bg-white"}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {car.breakevenReached && car.breakevenDate && (
            <p className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Breakeven alcanzado el {formatDateAU(car.breakevenDate)}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-zinc-400">
          Cargá el costo de compra (total_invested) en Airtable para ver el progreso a breakeven.
        </p>
      )}
    </div>
  );
}
