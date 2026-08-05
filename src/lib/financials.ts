import {
  listCarsFull,
  listAllTransactions,
  SETUP_CATEGORIES,
  type CarFull,
} from "@/lib/airtable";

export type RegoStatus =
  | { level: "ok" }
  | { level: "unknown" }
  | { level: "warning"; daysLeft: number }
  | { level: "expired"; daysAgo: number };

export type CategoryAmount = { category: string; amount: number };

export type CarFinancials = CarFull & {
  basePrice: number; // total_invested cargado a mano en Airtable (compra)
  setupCost: number; // suma de transacciones de "costos iniciales"
  totalInvested: number; // basePrice + setupCost
  setupBreakdown: CategoryAmount[];
  totalIncome: number;
  incomeBreakdown: CategoryAmount[];
  totalExpense: number; // solo gastos operativos (sin costos iniciales)
  expenseBreakdown: CategoryAmount[];
  net: number;
  breakevenProgress: number; // net / totalInvested, puede ser negativo o > 1
  breakevenReached: boolean;
  breakevenDate: string | null; // YYYY-MM-DD, aproximada
  regoStatus: RegoStatus;
};

export type FleetSummary = {
  totalInvested: number;
  totalIncome: number;
  totalExpense: number;
  net: number;
  breakevenProgress: number;
  incomeBreakdown: CategoryAmount[];
  expenseBreakdown: CategoryAmount[];
};

const REGO_WARNING_WINDOW_DAYS = 30;
const SETUP_CATEGORY_SET = new Set<string>(SETUP_CATEGORIES);

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function computeRegoStatus(regoExpiry: string | null): RegoStatus {
  if (!regoExpiry) return { level: "unknown" };

  const diffDays = Math.round(
    (parseISODate(regoExpiry).getTime() - startOfToday().getTime()) / 86_400_000
  );

  if (diffDays < 0) return { level: "expired", daysAgo: Math.abs(diffDays) };
  if (diffDays <= REGO_WARNING_WINDOW_DAYS) return { level: "warning", daysLeft: diffDays };
  return { level: "ok" };
}

function addToBreakdown(map: Map<string, number>, category: string, amount: number) {
  map.set(category, (map.get(category) ?? 0) + amount);
}

function sortedBreakdown(map: Map<string, number>): CategoryAmount[] {
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export async function getCarFinancials(): Promise<CarFinancials[]> {
  const [cars, transactions] = await Promise.all([listCarsFull(), listAllTransactions()]);

  return cars.map((car) => {
    const carTransactions = transactions
      .filter((tx) => tx.carIds.includes(car.id))
      .sort((a, b) => a.date.localeCompare(b.date));

    const incomeMap = new Map<string, number>();
    const expenseMap = new Map<string, number>();
    const setupMap = new Map<string, number>();

    let totalIncome = 0;
    let totalExpense = 0;
    let setupCost = 0;
    let running = 0;
    let breakevenDate: string | null = null;

    for (const tx of carTransactions) {
      if (tx.type === "Income") {
        totalIncome += tx.amount;
        running += tx.amount;
        addToBreakdown(incomeMap, tx.category || "Sin categoría", tx.amount);
      } else if (SETUP_CATEGORY_SET.has(tx.category)) {
        setupCost += tx.amount;
        addToBreakdown(setupMap, tx.category, tx.amount);
      } else {
        totalExpense += tx.amount;
        running -= tx.amount;
        addToBreakdown(expenseMap, tx.category || "Sin categoría", tx.amount);
      }

      const investedSoFar = car.totalInvested + setupCost;
      if (breakevenDate === null && investedSoFar > 0 && running >= investedSoFar) {
        breakevenDate = tx.date;
      }
    }

    const finalTotalInvested = car.totalInvested + setupCost;
    const net = totalIncome - totalExpense;
    const breakevenProgress = finalTotalInvested > 0 ? net / finalTotalInvested : 0;

    return {
      ...car,
      basePrice: car.totalInvested,
      setupCost,
      totalInvested: finalTotalInvested,
      setupBreakdown: sortedBreakdown(setupMap),
      totalIncome,
      incomeBreakdown: sortedBreakdown(incomeMap),
      totalExpense,
      expenseBreakdown: sortedBreakdown(expenseMap),
      net,
      breakevenProgress,
      breakevenReached: breakevenDate !== null,
      breakevenDate,
      regoStatus: computeRegoStatus(car.regoExpiry),
    };
  });
}

export function getFleetSummary(cars: CarFinancials[]): FleetSummary {
  const incomeMap = new Map<string, number>();
  const expenseMap = new Map<string, number>();

  let totalInvested = 0;
  let totalIncome = 0;
  let totalExpense = 0;

  for (const car of cars) {
    totalInvested += car.totalInvested;
    totalIncome += car.totalIncome;
    totalExpense += car.totalExpense;

    for (const { category, amount } of car.incomeBreakdown) {
      addToBreakdown(incomeMap, category, amount);
    }
    for (const { category, amount } of car.expenseBreakdown) {
      addToBreakdown(expenseMap, category, amount);
    }
  }

  const net = totalIncome - totalExpense;

  return {
    totalInvested,
    totalIncome,
    totalExpense,
    net,
    breakevenProgress: totalInvested > 0 ? net / totalInvested : 0,
    incomeBreakdown: sortedBreakdown(incomeMap),
    expenseBreakdown: sortedBreakdown(expenseMap),
  };
}
