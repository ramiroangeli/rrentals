import { headers } from "next/headers";
import { verifySession } from "@/lib/dal";
import { listContractViews, type ContractView } from "@/lib/contracts";
import { listContracts, listRentersFull, listCarsFull, type ContractRecord } from "@/lib/airtable";
import { AppHeader } from "@/components/AppHeader";
import { ContractCard } from "@/components/ContractCard";
import { PendingContractCard } from "@/components/PendingContractCard";

// Orden descendente (más reciente primero), ítems sin fecha al final del
// grupo - el string vacío ("") siempre ordena antes que una fecha ISO real.
function sortByDateDesc<T>(items: T[], getDate: (item: T) => string | null): T[] {
  return [...items].sort((a, b) => (getDate(b) ?? "").localeCompare(getDate(a) ?? ""));
}

export default async function ContratosPage() {
  await verifySession();

  const [contracts, renters, cars, contractViews, headersList] = await Promise.all([
    listContracts(),
    listRentersFull(),
    listCarsFull(),
    listContractViews(),
    headers(),
  ]);

  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const renterById = new Map(renters.map((r) => [r.id, r]));
  const carById = new Map(cars.map((c) => [c.id, c]));

  // Arriba: todo lo que no esté Finalizado (Pendiente se muestra aparte con
  // su propia tarjeta/formulario de aprobación; el resto - Active,
  // Rechazado, o cualquier status futuro - cae en "activos"). Al final:
  // Finalizado, comprimido y en gris. Dentro de cada grupo, más reciente
  // primero - los finalizados por fecha real de devolución cuando la hay.
  const pending: ContractRecord[] = sortByDateDesc(
    contracts.filter((c) => c.status === "Pendiente"),
    (c) => c.startDate
  );
  const active: ContractView[] = sortByDateDesc(
    contractViews.filter((c) => c.status !== "Pendiente" && c.status !== "Finalizado"),
    (c) => c.startDate
  );
  const finalized: ContractView[] = sortByDateDesc(
    contractViews.filter((c) => c.status === "Finalizado"),
    (c) => c.returnDate ?? c.endDate ?? c.startDate
  );

  const isEmpty = pending.length === 0 && active.length === 0 && finalized.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-10 pt-6">
      <AppHeader />

      <div className="space-y-4">
        {isEmpty && <p className="text-sm text-zinc-400">Todavía no hay contratos cargados.</p>}

        {pending.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              Pendientes de revisión ({pending.length})
            </h2>
            {pending.map((contract) => (
              <PendingContractCard
                key={contract.id}
                contract={contract}
                renter={contract.renterIds[0] ? renterById.get(contract.renterIds[0]) : undefined}
                car={contract.carIds[0] ? carById.get(contract.carIds[0]) : undefined}
              />
            ))}
          </div>
        )}

        {active.length > 0 && (
          <div className="space-y-3">
            {active.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                signUrl={`${baseUrl}/firmar/${contract.id}`}
                defaultOpen
              />
            ))}
          </div>
        )}

        {finalized.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              Finalizados ({finalized.length})
            </h2>
            {finalized.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                signUrl={`${baseUrl}/firmar/${contract.id}`}
                defaultOpen={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
