import type { ReactNode } from "react";
import { formatDateAU } from "@/lib/format";

type Tone = "default" | "muted" | "pending";

const CARD_TONE: Record<Tone, string> = {
  default: "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950",
  muted: "border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/60",
  pending: "border-2 border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/40",
};

const BADGE_TONE: Record<Tone, string> = {
  default: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  muted: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  pending: "bg-amber-500 text-white",
};

const TITLE_TONE: Record<Tone, string> = {
  default: "text-zinc-900 dark:text-zinc-50",
  muted: "text-zinc-500 dark:text-zinc-400",
  pending: "text-zinc-900 dark:text-zinc-50",
};

const SUBTITLE_TONE: Record<Tone, string> = {
  default: "text-zinc-600 dark:text-zinc-300",
  muted: "text-zinc-400 dark:text-zinc-500",
  pending: "text-zinc-600 dark:text-zinc-400",
};

function Chevron() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180"
      aria-hidden="true"
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// <details>/<summary> en vez de un div + estado en cliente: el toggle
// (click, teclado, aria-expanded) lo maneja el navegador solo, sin JS ni
// "use client" - y el estado inicial (abierto/cerrado) se resuelve en el
// servidor vía el atributo `open`.
export function CollapsibleContract({
  defaultOpen,
  tone = "default",
  contractId,
  renterName,
  carLabel,
  startDate,
  endDate,
  status,
  children,
}: {
  defaultOpen: boolean;
  tone?: Tone;
  contractId: string;
  renterName: string;
  carLabel: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className={`group rounded-2xl shadow-sm ${CARD_TONE[tone]}`}>
      <summary className="flex min-h-[3.25rem] cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className={`font-semibold ${TITLE_TONE[tone]}`}>{contractId}</span>
            <span className={`truncate text-sm ${SUBTITLE_TONE[tone]}`}>{renterName}</span>
          </div>
          <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-500">
            {carLabel} · {startDate ? formatDateAU(startDate) : "-"}
            {endDate ? ` – ${formatDateAU(endDate)}` : ""}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${BADGE_TONE[tone]}`}>
          {status}
        </span>
        <Chevron />
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}
