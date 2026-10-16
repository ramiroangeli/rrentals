import type { ContractView } from "@/lib/contracts";
import { computeKmUsage } from "@/lib/contracts";
import { formatCurrency, formatDateAU, todayISOBrisbane } from "@/lib/format";
import { setKmStart, returnContract } from "@/app/actions/contracts";
import { CollapsibleContract } from "@/components/ContractSummaryRow";

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

function KmSection({ contract }: { contract: ContractView }) {
  // Se muestra en cuanto están los 3 datos cargados, sin importar el estado
  // del contrato - así funciona igual si lo cargás con el botón de la app o
  // a mano en Airtable (y ahí capaz te olvidás de tocar contract_status).
  if (contract.kmStart !== null && contract.kmEnd !== null && contract.returnDate) {
    const usage = computeKmUsage(
      contract.startDate ?? contract.returnDate,
      contract.returnDate,
      contract.kmStart,
      contract.kmEnd
    );
    return (
      <div
        className={`rounded-lg p-3 text-xs ${
          usage.withinLimit
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
        }`}
      >
        <p className="font-semibold">
          {usage.kmDriven.toLocaleString("en-AU")} km recorridos en {usage.daysRented} días
          {usage.withinLimit ? " - dentro del límite" : " - superó el límite"}
        </p>
        <p className="mt-0.5">Límite proporcional: {usage.kmLimit.toLocaleString("en-AU")} km</p>
      </div>
    );
  }

  if (contract.status !== "Active") return null;

  if (contract.kmStart === null) {
    return (
      <form action={setKmStart} className="flex items-end gap-2">
        <input type="hidden" name="id" value={contract.id} />
        <div className="flex-1">
          <label className="mb-1 block text-xs text-zinc-500">Km al entregar el auto</label>
          <input
            type="number"
            name="kmStart"
            min="0"
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800 dark:bg-teal-500 dark:text-teal-950"
        >
          Guardar
        </button>
      </form>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <p className="mb-2 text-xs text-zinc-500">
        Entregado con {contract.kmStart.toLocaleString("en-AU")} km
      </p>
      <form action={returnContract} className="space-y-2">
        <input type="hidden" name="id" value={contract.id} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Km al devolver</label>
            <input
              type="number"
              name="kmEnd"
              min={contract.kmStart}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Fecha de devolución</label>
            <input
              type="date"
              name="returnDate"
              required
              defaultValue={todayISOBrisbane()}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
        >
          Marcar devuelto
        </button>
      </form>
    </div>
  );
}

export function ContractCard({
  contract,
  signUrl,
  defaultOpen,
}: {
  contract: ContractView;
  signUrl: string;
  defaultOpen: boolean;
}) {
  const finalized = contract.status === "Finalizado";
  const tone = finalized ? "muted" : contract.status === "Active" ? "active" : "default";

  return (
    <CollapsibleContract
      defaultOpen={defaultOpen}
      tone={tone}
      contractId={contract.contractId}
      renterName={contract.renterName}
      carLabel={contract.carLabel}
      startDate={contract.startDate}
      endDate={contract.returnDate ?? contract.endDate}
      status={contract.status}
    >
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
            {contract.startDate ? formatDateAU(contract.startDate) : "-"}
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">
            {contract.returnDate ? "Devuelto" : "Hasta (estimado)"}
          </div>
          <div className="font-medium text-zinc-900 dark:text-zinc-50">
            {contract.returnDate
              ? formatDateAU(contract.returnDate)
              : contract.endDate
                ? formatDateAU(contract.endDate)
                : "-"}
          </div>
        </div>
      </div>

      {contract.documentsUrl && (
        <div className="mb-3 flex gap-2">
          <DocsButton href={contract.documentsUrl} label="Ver documentos" />
        </div>
      )}

      {contract.signedName ? (
        <p className="mb-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          Firmado por {contract.signedName}
          {contract.signedAt ? ` el ${formatDateAU(contract.signedAt.slice(0, 10))}` : ""}
        </p>
      ) : (
        contract.status === "Active" && (
          <div className="mb-3 rounded-lg bg-teal-50 p-3 dark:bg-teal-950">
            <p className="mb-1 text-xs font-medium text-teal-700 dark:text-teal-300">
              Link para que firme el inquilino (toca y mantené presionado para copiar):
            </p>
            <input
              readOnly
              value={signUrl}
              className="w-full rounded border border-teal-200 bg-white px-2 py-1.5 text-xs text-zinc-700 dark:border-teal-800 dark:bg-zinc-900 dark:text-zinc-300"
            />
          </div>
        )
      )}

      <KmSection contract={contract} />
    </CollapsibleContract>
  );
}
