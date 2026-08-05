import Airtable from "airtable";

let cachedBase: Airtable.Base | null = null;

function getBase(): Airtable.Base {
  if (cachedBase) return cachedBase;

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    throw new Error("Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID env vars");
  }

  cachedBase = new Airtable({ apiKey }).base(baseId);
  return cachedBase;
}

export const TABLES = {
  cars: "tblAgoBXaus4WO6HL",
  renters: "tblPjuPXsnyVXGWGv",
  contracts: "tbl0al2m5AAxICkq1",
  fines: "tblV4UHSM4LPhDX2Q",
  transactions: "tbl5F8QIIILh961Tt",
} as const;

export type Car = {
  id: string;
  rego: string;
  make: string;
  model: string;
};

export async function listCars(): Promise<Car[]> {
  const records = await getBase()(TABLES.cars)
    .select({
      fields: ["REGO", "make", "model"],
      sort: [{ field: "REGO", direction: "asc" }],
    })
    .all();

  return records.map((r) => ({
    id: r.id,
    rego: (r.get("REGO") as string) ?? "",
    make: (r.get("make") as string) ?? "",
    model: (r.get("model") as string) ?? "",
  }));
}

export type TransactionType = "Income" | "Expense";

// Costos únicos de puesta en marcha del auto (transferencia, llaves, etc.) — se
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

export const CATEGORIES: Record<TransactionType, string[]> = {
  Income: ["Rental Income", "Bond Received", "Other Income"],
  Expense: [...SETUP_CATEGORIES, ...OPERATING_EXPENSE_CATEGORIES],
};

export type NewTransaction = {
  carId: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
};

export async function createTransaction(input: NewTransaction): Promise<string> {
  const record = await getBase()(TABLES.transactions).create(
    {
      Car: [input.carId],
      Type: input.type,
      Category: input.category,
      Amount: input.amount,
      Date: input.date,
      Notes: input.notes ?? "",
    },
    // typecast crea la opción de Category sola si es una categoría nueva
    // (ej. la primera vez que se usa una de las categorías de costo inicial).
    { typecast: true }
  );
  return record.id;
}

export type CarFull = {
  id: string;
  rego: string;
  make: string;
  model: string;
  regoExpiry: string | null; // YYYY-MM-DD
  totalInvested: number;
};

export async function listCarsFull(): Promise<CarFull[]> {
  const records = await getBase()(TABLES.cars)
    .select({
      fields: ["REGO", "make", "model", "rego_expiry", "total_invested"],
      sort: [{ field: "REGO", direction: "asc" }],
    })
    .all();

  return records.map((r) => ({
    id: r.id,
    rego: (r.get("REGO") as string) ?? "",
    make: (r.get("make") as string) ?? "",
    model: (r.get("model") as string) ?? "",
    regoExpiry: (r.get("rego_expiry") as string) ?? null,
    totalInvested: (r.get("total_invested") as number) ?? 0,
  }));
}

export type TransactionRecord = {
  carIds: string[];
  type: TransactionType;
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
};

export async function listAllTransactions(): Promise<TransactionRecord[]> {
  const records = await getBase()(TABLES.transactions)
    .select({
      fields: ["Car", "Type", "Category", "Amount", "Date"],
      sort: [{ field: "Date", direction: "asc" }],
    })
    .all();

  return records.map((r) => ({
    carIds: (r.get("Car") as string[]) ?? [],
    type: r.get("Type") as TransactionType,
    category: (r.get("Category") as string) ?? "",
    amount: (r.get("Amount") as number) ?? 0,
    date: (r.get("Date") as string) ?? "",
  }));
}

export type RenterRecord = {
  id: string;
  name: string;
  driveFolderUrl: string | null;
};

export async function listRenters(): Promise<RenterRecord[]> {
  const records = await getBase()(TABLES.renters)
    .select({ fields: ["name", "drive_folder_url"] })
    .all();

  return records.map((r) => ({
    id: r.id,
    name: (r.get("name") as string) ?? "",
    driveFolderUrl: (r.get("drive_folder_url") as string) ?? null,
  }));
}

export type ContractRecord = {
  id: string;
  contractId: string;
  renterIds: string[];
  carIds: string[];
  startDate: string | null;
  endDate: string | null;
  weeklyRate: number;
  bond: number;
  status: string;
  driveFolderUrl: string | null;
};

export async function listContracts(): Promise<ContractRecord[]> {
  const records = await getBase()(TABLES.contracts)
    .select({
      fields: [
        "contract_id",
        "Renter",
        "Car",
        "start_date",
        "estimated_end_date",
        "weekly_rate",
        "bond",
        "contract_status",
        "drive_folder_url",
      ],
      sort: [{ field: "start_date", direction: "desc" }],
    })
    .all();

  return records.map((r) => ({
    id: r.id,
    contractId: (r.get("contract_id") as string) ?? "",
    renterIds: (r.get("Renter") as string[]) ?? [],
    carIds: (r.get("Car") as string[]) ?? [],
    startDate: (r.get("start_date") as string) ?? null,
    endDate: (r.get("estimated_end_date") as string) ?? null,
    weeklyRate: (r.get("weekly_rate") as number) ?? 0,
    bond: (r.get("bond") as number) ?? 0,
    status: (r.get("contract_status") as string) ?? "—",
    driveFolderUrl: (r.get("drive_folder_url") as string) ?? null,
  }));
}
