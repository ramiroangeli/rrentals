import {
  listCarsFull,
  listAllTransactions,
  SETUP_CATEGORIES,
  type CarFull,
  type TransactionType,
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
  roiAnnualized: number | null; // breakevenProgress dividido los años desde purchaseDate
};

export type PeriodMetrics = {
  from: string | null; // YYYY-MM-DD, null = desde la primera transacción del set
  to: string | null; // YYYY-MM-DD, null = hasta la última transacción del set
  income: number;
  incomeBreakdown: CategoryAmount[];
  expense: number; // solo gastos operativos, mismo criterio que CarFinancials.totalExpense
  expenseBreakdown: CategoryAmount[];
  net: number;
  operatingMargin: number | null; // net / income, null si income es 0
  weeks: number; // ancho del rango en semanas, mínimo 1
  avgWeeklyIncome: number;
  avgWeeklyExpense: number;
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

function yearsSince(dateIso: string): number {
  return (startOfToday().getTime() - parseISODate(dateIso).getTime()) / (365.25 * 86_400_000);
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

    const years = car.purchaseDate ? yearsSince(car.purchaseDate) : null;
    const roiAnnualized = years !== null && years > 0 ? breakevenProgress / years : null;

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
      roiAnnualized,
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

export type PeriodTransaction = {
  type: TransactionType;
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
};

// Mismo criterio que getCarFinancials: los costos iniciales (SETUP_CATEGORY_SET) no
// cuentan como gasto operativo del período, son capital invertido, no cash flow recurrente.
export function getPeriodMetrics(
  transactions: PeriodTransaction[],
  range: { from?: string | null; to?: string | null }
): PeriodMetrics {
  const filtered = transactions.filter((tx) => {
    if (range.from && tx.date < range.from) return false;
    if (range.to && tx.date > range.to) return false;
    return true;
  });

  const incomeMap = new Map<string, number>();
  const expenseMap = new Map<string, number>();
  let income = 0;
  let expense = 0;

  for (const tx of filtered) {
    if (tx.type === "Income") {
      income += tx.amount;
      addToBreakdown(incomeMap, tx.category || "Sin categoría", tx.amount);
    } else if (!SETUP_CATEGORY_SET.has(tx.category)) {
      expense += tx.amount;
      addToBreakdown(expenseMap, tx.category || "Sin categoría", tx.amount);
    }
  }

  const net = income - expense;
  const operatingMargin = income > 0 ? net / income : null;

  const sortedDates = filtered.map((tx) => tx.date).sort();
  const effectiveFrom = range.from ?? sortedDates[0] ?? null;
  const effectiveTo = range.to ?? sortedDates[sortedDates.length - 1] ?? null;

  const weeks =
    effectiveFrom && effectiveTo
      ? Math.max(
          1,
          (parseISODate(effectiveTo).getTime() - parseISODate(effectiveFrom).getTime()) /
            (7 * 86_400_000)
        )
      : 1;

  return {
    from: effectiveFrom,
    to: effectiveTo,
    income,
    incomeBreakdown: sortedBreakdown(incomeMap),
    expense,
    expenseBreakdown: sortedBreakdown(expenseMap),
    net,
    operatingMargin,
    weeks,
    avgWeeklyIncome: income / weeks,
    avgWeeklyExpense: expense / weeks,
  };
}
