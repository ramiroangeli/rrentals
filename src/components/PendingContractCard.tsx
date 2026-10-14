import type { CarFull, ContractRecord, RenterFull } from "@/lib/airtable";
import { formatCurrency, formatDateAU } from "@/lib/format";
import { approveContract, rejectContract } from "@/app/actions/contracts";

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-zinc-900 dark:text-zinc-50">{value}</div>
    </div>
  );
}

export function PendingContractCard({
  contract,
  renter,
  car,
}: {
  contract: ContractRecord;
  renter: RenterFull | undefined;
  car: CarFull | undefined;
}) {
  return (
    <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/40">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {renter?.name ?? "-"}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {car ? `${car.rego} - ${car.make} ${car.model}` : "-"}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white">
          Pendiente
        </span>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3 text-sm">
        <Detail label="Nacionalidad" value={renter?.nationality || "-"} />
        <Detail
          label="Fecha de nacimiento"
          value={renter?.dateOfBirth ? formatDateAU(renter.dateOfBirth) : "-"}
        />
        <Detail label="Teléfono" value={renter?.phone || "-"} />
        <Detail label="CRN" value={renter?.qldCrn || "-"} />
        <div className="col-span-2">
          <Detail label="Dirección" value={renter?.address || "-"} />
        </div>
        <div className="col-span-2">
          <Detail
            label="Licencia"
            value={
              renter
                ? `${renter.licenceNumber} - ${renter.licenceIssuingCountry}` +
                  (renter.licenceExpiry ? ` (vence ${formatDateAU(renter.licenceExpiry)})` : "")
                : "-"
            }
          />
        </div>
        {renter?.passportNumber && <Detail label="Pasaporte" value={renter.passportNumber} />}
        <Detail
          label="Inicio de alquiler"
          value={contract.startDate ? formatDateAU(contract.startDate) : "-"}
        />
        <Detail label="Semanal" value={formatCurrency(contract.weeklyRate)} />
      </div>

      {(contract.documentsUrl ?? renter?.driveFolderUrl) && (
        <a
          href={contract.documentsUrl ?? renter?.driveFolderUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-3 block text-sm font-medium text-teal-700 underline dark:text-teal-400"
        >
          Ver documentos adjuntos →
        </a>
      )}

      <form action={approveContract} className="flex items-end gap-2">
        <input type="hidden" name="id" value={contract.id} />
        <div className="flex-1">
          <label className="mb-1 block text-xs text-zinc-500">Bond (AUD)</label>
          <input
            type="number"
            name="bond"
            step="0.01"
            min="0"
            defaultValue={contract.weeklyRate || undefined}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Aprobar
        </button>
      </form>
      <form action={rejectContract} className="mt-2">
        <input type="hidden" name="id" value={contract.id} />
        <button type="submit" className="text-xs text-red-600 underline">
          Rechazar
        </button>
      </form>
    </div>
  );
}
