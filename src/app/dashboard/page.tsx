import { verifySession } from "@/lib/dal";
import { getCarFinancials, getFleetSummary } from "@/lib/financials";
import { logout } from "@/app/actions/auth";
import { AppNav } from "@/components/AppNav";
import { CarDashboardCard } from "@/components/CarDashboardCard";
import { FleetSummaryCard } from "@/components/FleetSummaryCard";

export default async function DashboardPage() {
  await verifySession();
  const cars = await getCarFinancials();
  const fleetSummary = getFleetSummary(cars);

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
        <FleetSummaryCard summary={fleetSummary} />
        {cars.map((car, index) => (
          <CarDashboardCard key={car.id} car={car} accentIndex={index} />
        ))}
      </div>
    </div>
  );
}
