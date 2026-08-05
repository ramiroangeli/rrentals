import { verifySession } from "@/lib/dal";
import { listContractViews } from "@/lib/contracts";
import { logout } from "@/app/actions/auth";
import { AppNav } from "@/components/AppNav";
import { ContractCard } from "@/components/ContractCard";

export default async function ContratosPage() {
  await verifySession();
  const contracts = await listContractViews();

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
        {contracts.length === 0 ? (
          <p className="text-sm text-zinc-400">Todavía no hay contratos cargados.</p>
        ) : (
          contracts.map((contract) => <ContractCard key={contract.id} contract={contract} />)
        )}
      </div>
    </div>
  );
}
