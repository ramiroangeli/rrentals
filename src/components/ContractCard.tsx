import type { ContractView } from "@/lib/contracts";
import { formatCurrency, formatDateAU } from "@/lib/format";

function DocsButton({
  href,
  label,
  variant = "primary",
}: {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex-1 rounded-lg px-3 py-2.5 text-center text-sm font-medium transition-colors ${
        variant === "primary"
          ? "bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-500 dark:text-teal-950 dark:hover:bg-teal-400"
          : "border border-teal-700 text-teal-700 hover:bg-teal-50 dark:border-teal-500 dark:text-teal-400 dark:hover:bg-teal-950"
      }`}
    >
      {label}
    </a>
  );
}

export function ContractCard({ contract }: { contract: ContractView }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {contract.contractId}
          </h2>
          <p className="text-sm text-zinc-500">{contract.carLabel}</p>
        </div>
        <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 dark:bg-teal-950 dark:text-teal-300">
          {contract.status}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-zinc-500">Inquilino</div>
          <div className="font-medium text-zinc-900 dark:text-zinc-50">{contract.renterName}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Semanal / bond</div>
          <div className="font-medium text-zinc-900 dark:text-zinc-50">
            {formatCurrency(contract.weeklyRate)} / {formatCurrency(contract.bond)}
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Desde</div>
          <div className="font-medium text-zinc-900 dark:text-zinc-50">
            {contract.startDate ? formatDateAU(contract.startDate) : "—"}
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Hasta (estimado)</div>
          <div className="font-medium text-zinc-900 dark:text-zinc-50">
            {contract.endDate ? formatDateAU(contract.endDate) : "—"}
          </div>
        </div>
      </div>

      {(contract.contractDocsUrl || contract.renterDocsUrl) && (
        <div className="flex gap-2">
          {contract.renterDocsUrl && (
            <DocsButton href={contract.renterDocsUrl} label="Ver documentos" />
          )}
          {contract.contractDocsUrl && (
            <DocsButton href={contract.contractDocsUrl} label="Ver contrato" variant="secondary" />
          )}
        </div>
      )}
    </div>
  );
}
