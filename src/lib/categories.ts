// Constantes de categorías de transacciones - sin dependencias de Airtable ni
// de next/cache a propósito, para que los client components (TransactionForm,
// EditTransactionForm) puedan importarlas sin arrastrar código server-only al
// bundle del browser. airtable.ts las re-exporta para el resto de la app.

export type TransactionType = "Income" | "Expense";

// Costos únicos de puesta en marcha del auto (transferencia, llaves, etc.) - se
// suman al total_invested del auto en vez de restar como gasto operativo del mes.
export const SETUP_CATEGORIES = [
  "Transferencia de dominio",
  "Llave de repuesto",
  "Patentamiento inicial",
  "Otro costo inicial",
] as const;

const OPERATING_EXPENSE_CATEGORIES = [
  "Fuel",
  "Maintenance/Repairs",
  "Insurance",
  "Registration (Rego)",
  "Fines",
  "Cleaning",
  "Bond Refund",
  "Tolls",
  "Other Expense",
] as const;

export const EXPENSE_CATEGORY_GROUPS: { label: string; categories: readonly string[] }[] = [
  { label: "Costos iniciales", categories: SETUP_CATEGORIES },
  { label: "Gastos operativos", categories: OPERATING_EXPENSE_CATEGORIES },
];

export const RENTAL_INCOME_CATEGORY = "Rental Income";

export const CATEGORIES: Record<TransactionType, string[]> = {
  Income: [RENTAL_INCOME_CATEGORY, "Bond Received", "Other Income"],
  Expense: [...SETUP_CATEGORIES, ...OPERATING_EXPENSE_CATEGORIES],
};
