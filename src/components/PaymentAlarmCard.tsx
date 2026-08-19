import type { CarFinancials, PaymentStatus } from "@/lib/financials";
import { paymentDayLabel } from "@/lib/financials";
import { formatDateAU } from "@/lib/format";

const STATUS_STYLES: Record<PaymentStatus["level"], string> = {
  paid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "due-today": "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  overdue: "bg-red-600 text-white",
};

function statusLabel(status: PaymentStatus): string {
  if (status.level === "paid") return `Al día · próximo ${formatDateAU(status.nextDueDate)}`;
  if (status.level === "due-today") return "Vence hoy";
  return `Atrasado (${status.daysLate} día${status.daysLate === 1 ? "" : "s"})`;
}

export function PaymentAlarmCard({ cars }: { cars: CarFinancials[] }) {
  const tracked = cars.filter(
    (car): car is CarFinancials & { paymentStatus: PaymentStatus; paymentDay: string } =>
      car.paymentStatus !== null
  );
  if (tracked.length === 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Cobro semanal
      </h2>
      <div className="space-y-2">
        {tracked.map((car) => (
          <div key={car.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {car.rego} — {car.make} {car.model}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Cobra los {paymentDayLabel(car.paymentDay)}
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[car.paymentStatus.level]}`}
            >
              {statusLabel(car.paymentStatus)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
