import type { FleetSummary } from "@/lib/financials";
import { formatCurrency } from "@/lib/format";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";

export function FleetSummaryCard({ summary }: { summary: FleetSummary }) {
  const hasInvestment = summary.totalInvested > 0;
  const progressPct = hasInvestment
    ? Math.min(Math.max(summary.breakevenProgress, 0), 1) * 100
    : 0;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-teal-700 to-teal-900 p-5 text-white shadow-md">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-teal-200">
        Resumen general — 3 autos
      </h2>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-teal-200">Invertido</div>
          <div className="text-2xl font-bold tabular-nums">
            {hasInvestment ? formatCurrency(summary.totalInvested) : "—"}
          </div>
        </div>
        <div>
          <div className="text-xs text-teal-200">Neto</div>
          <div
            className={`text-2xl font-bold tabular-nums ${
              summary.net >= 0 ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {formatCurrency(summary.net)}
          </div>
        </div>
        <div>
          <div className="text-xs text-teal-200">Ingresos</div>
          <div className="text-xl font-bold tabular-nums">{formatCurrency(summary.totalIncome)}</div>
          <CategoryBreakdown items={summary.incomeBreakdown} tone="light" />
        </div>
        <div>
          <div className="text-xs text-teal-200">Gastos</div>
          <div className="text-xl font-bold tabular-nums">{formatCurrency(summary.totalExpense)}</div>
          <CategoryBreakdown items={summary.expenseBreakdown} tone="light" />
        </div>
      </div>

      {hasInvestment && (
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-teal-200">
            <span>Progreso a breakeven de la flota</span>
            <span className="font-medium">{Math.round(summary.breakevenProgress * 100)}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-teal-950/60">
            <div className="h-full rounded-full bg-white" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
