import { headers } from "next/headers";
import { verifySession } from "@/lib/dal";
import { listContractViews } from "@/lib/contracts";
import { listContracts, listRentersFull, listCarsFull } from "@/lib/airtable";
import { logout } from "@/app/actions/auth";
import { AppNav } from "@/components/AppNav";
import { ContractCard } from "@/components/ContractCard";
import { PendingContractCard } from "@/components/PendingContractCard";

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

  const pending = contracts.filter((c) => c.status === "Pendiente");
  const others = contractViews.filter((c) => c.status !== "Pendiente");

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
        {pending.length > 0 && (
          <div className="space-y-4">
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

        {others.length === 0 && pending.length === 0 ? (
          <p className="text-sm text-zinc-400">Todavía no hay contratos cargados.</p>
        ) : (
          others.map((contract) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              signUrl={`${baseUrl}/firmar/${contract.id}`}
            />
          ))
        )}
      </div>
    </div>
  );
}
