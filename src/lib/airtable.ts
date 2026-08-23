import Airtable from "airtable";
import { cache } from "react";

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

// Deriva de listCarsFull (más abajo) en vez de pegarle a Airtable de nuevo:
// react cache() memoiza por función, así que dos funciones distintas that
// pidan la tabla cars siempre cuentan como 2 llamadas de red aunque pidan
// los mismos campos - por eso listCars() reusa el resultado de listCarsFull().
export async function listCars(): Promise<Car[]> {
  const cars = await listCarsFull();
  return cars.map(({ id, rego, make, model }) => ({ id, rego, make, model }));
}

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

export type NewTransaction = {
  carId: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
};

// Compartido entre el form de carga y el de edición: valida un FormData y
// devuelve los datos listos para Airtable, o un mensaje de error para mostrar.
export function parseTransactionFormData(
  formData: FormData
): { data: NewTransaction } | { error: string } {
  const carId = formData.get("carId");
  const type = formData.get("type");
  const category = formData.get("category");
  const amountRaw = formData.get("amount");
  const date = formData.get("date");
  const notes = formData.get("notes");

  if (typeof carId !== "string" || !carId) return { error: "Elegí un auto." };
  if (type !== "Income" && type !== "Expense") return { error: "Elegí el tipo de movimiento." };
  if (typeof category !== "string" || !category) return { error: "Elegí una categoría." };
  if (typeof date !== "string" || !date) return { error: "Elegí una fecha." };

  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Ingresá un monto válido." };

  return {
    data: { carId, type, category, amount, date, notes: typeof notes === "string" ? notes : "" },
  };
}

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

export type TransactionFull = {
  id: string;
  carId: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
  notes: string;
};

function toTransactionFull(r: Airtable.Record<Airtable.FieldSet>): TransactionFull {
  return {
    id: r.id,
    carId: ((r.get("Car") as string[]) ?? [])[0] ?? "",
    type: r.get("Type") as TransactionType,
    category: (r.get("Category") as string) ?? "",
    amount: (r.get("Amount") as number) ?? 0,
    date: (r.get("Date") as string) ?? "",
    notes: (r.get("Notes") as string) ?? "",
  };
}

// Única lectura real de la tabla transactions, cacheada por request - tanto
// listTransactionsFull() como listAllTransactions() derivan de acá en vez de
// pedirle lo mismo a Airtable dos veces con distinta forma.
const listTransactionRecords = cache(async () => {
  return getBase()(TABLES.transactions)
    .select({ fields: ["Car", "Type", "Category", "Amount", "Date", "Notes"] })
    .all();
});

export const listTransactionsFull = cache(async (): Promise<TransactionFull[]> => {
  const records = await listTransactionRecords();
  return records.map(toTransactionFull).sort((a, b) => b.date.localeCompare(a.date));
});

export const getTransaction = cache(async (id: string): Promise<TransactionFull | null> => {
  try {
    const record = await getBase()(TABLES.transactions).find(id);
    return toTransactionFull(record);
  } catch {
    return null;
  }
});

export async function updateTransaction(id: string, input: NewTransaction): Promise<void> {
  await getBase()(TABLES.transactions).update(
    id,
    {
      Car: [input.carId],
      Type: input.type,
      Category: input.category,
      Amount: input.amount,
      Date: input.date,
      Notes: input.notes ?? "",
    },
    { typecast: true }
  );
}

export async function deleteTransaction(id: string): Promise<void> {
  await getBase()(TABLES.transactions).destroy(id);
}

export type CarFull = {
  id: string;
  rego: string;
  make: string;
  model: string;
  year: number | null;
  vin: string | null;
  weeklyRate: number;
  regoExpiry: string | null; // YYYY-MM-DD
  totalInvested: number;
  purchaseDate: string | null; // YYYY-MM-DD
  paymentDay: string | null; // "Lunes".."Domingo"
  status: string | null; // "Rented", "Disponible", etc. - se edita a mano en Airtable
};

export const listCarsFull = cache(async (): Promise<CarFull[]> => {
  const records = await getBase()(TABLES.cars)
    .select({
      fields: [
        "REGO",
        "make",
        "model",
        "year",
        "VIN",
        "weekly_rate",
        "rego_expiry",
        "total_invested",
        "purchase_date",
        "payment_day",
        "status",
      ],
      sort: [{ field: "REGO", direction: "asc" }],
    })
    .all();

  return records.map((r) => ({
    id: r.id,
    rego: (r.get("REGO") as string) ?? "",
    make: (r.get("make") as string) ?? "",
    model: (r.get("model") as string) ?? "",
    year: (r.get("year") as number) ?? null,
    vin: (r.get("VIN") as string) ?? null,
    weeklyRate: (r.get("weekly_rate") as number) ?? 0,
    regoExpiry: (r.get("rego_expiry") as string) ?? null,
    totalInvested: (r.get("total_invested") as number) ?? 0,
    purchaseDate: (r.get("purchase_date") as string) ?? null,
    paymentDay: (r.get("payment_day") as string) ?? null,
    status: (r.get("status") as string) ?? null,
  }));
});

export type TransactionRecord = {
  carIds: string[];
  type: TransactionType;
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
};

export const listAllTransactions = cache(async (): Promise<TransactionRecord[]> => {
  const records = await listTransactionRecords();
  return records
    .map((r) => ({
      carIds: (r.get("Car") as string[]) ?? [],
      type: r.get("Type") as TransactionType,
      category: (r.get("Category") as string) ?? "",
      amount: (r.get("Amount") as number) ?? 0,
      date: (r.get("Date") as string) ?? "",
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
});

export type RenterRecord = {
  id: string;
  name: string;
  driveFolderUrl: string | null;
};

export type RenterFull = {
  id: string;
  name: string;
  address: string;
  nationality: string;
  phone: string;
  whatsapp: string | null;
  passportNumber: string | null;
  licenceNumber: string;
  licenceIssuingCountry: string;
  licenceExpiry: string | null; // YYYY-MM-DD
  qldCrn: string;
  dateOfBirth: string | null; // YYYY-MM-DD
  driveFolderUrl: string | null;
};

const RENTER_FIELDS = [
  "name",
  "address",
  "nationality",
  "phone",
  "whatsapp",
  "passport_number",
  "licence_number",
  "licence_issuing_country",
  "licence_expiry",
  "QLD_CRN",
  "date_of_birth",
  "drive_folder_url",
];

// Única lectura real de la tabla renters - listRenters() (vista liviana, usada
// por los selects de auto/contrato) deriva de acá en vez de pedirle a Airtable
// lo mismo dos veces, mismo patrón que cars y transactions.
//
// "whatsapp" es un campo que se agregó después y puede no existir todavía en
// la base (Airtable tira error ante cualquier campo desconocido en el select,
// no lo ignora solo). Si falla por eso puntual, reintenta sin pedirlo, para
// que el resto de la app no se caiga mientras tanto.
export const listRentersFull = cache(async (): Promise<RenterFull[]> => {
  let records;
  try {
    records = await getBase()(TABLES.renters).select({ fields: RENTER_FIELDS }).all();
  } catch (e) {
    if (e instanceof Error && e.message.includes("whatsapp")) {
      records = await getBase()(TABLES.renters)
        .select({ fields: RENTER_FIELDS.filter((f) => f !== "whatsapp") })
        .all();
    } else {
      throw e;
    }
  }

  return records.map((r) => ({
    id: r.id,
    name: (r.get("name") as string) ?? "",
    address: (r.get("address") as string) ?? "",
    nationality: (r.get("nationality") as string) ?? "",
    phone: (r.get("phone") as string) ?? "",
    whatsapp: (r.get("whatsapp") as string) ?? null,
    passportNumber: (r.get("passport_number") as string) ?? null,
    licenceNumber: (r.get("licence_number") as string) ?? "",
    licenceIssuingCountry: (r.get("licence_issuing_country") as string) ?? "",
    licenceExpiry: (r.get("licence_expiry") as string) ?? null,
    qldCrn: r.get("QLD_CRN") != null ? String(r.get("QLD_CRN")) : "",
    dateOfBirth: (r.get("date_of_birth") as string) ?? null,
    driveFolderUrl: (r.get("drive_folder_url") as string) ?? null,
  }));
});

export async function listRenters(): Promise<RenterRecord[]> {
  const renters = await listRentersFull();
  return renters.map(({ id, name, driveFolderUrl }) => ({ id, name, driveFolderUrl }));
}

export const getRenter = cache(async (id: string): Promise<RenterFull | null> => {
  const renters = await listRentersFull();
  return renters.find((r) => r.id === id) ?? null;
});

export type NewRenter = {
  name: string;
  address: string;
  nationality: string;
  phone: string;
  whatsapp: string | null;
  passportNumber: string | null;
  licenceNumber: string;
  licenceIssuingCountry: string;
  licenceExpiry: string | null; // YYYY-MM-DD
  qldCrn: string;
  dateOfBirth: string; // YYYY-MM-DD
  driveFolderUrl: string | null;
};

export async function createRenter(input: NewRenter): Promise<string> {
  const fields: Partial<Airtable.FieldSet> = {
    name: input.name,
    address: input.address,
    nationality: input.nationality,
    phone: input.phone,
    licence_number: input.licenceNumber,
    licence_issuing_country: input.licenceIssuingCountry,
    date_of_birth: input.dateOfBirth,
  };
  if (input.whatsapp) fields.whatsapp = input.whatsapp;
  if (input.passportNumber) fields.passport_number = input.passportNumber;
  if (input.licenceExpiry) fields.licence_expiry = input.licenceExpiry;
  if (input.driveFolderUrl) fields.drive_folder_url = input.driveFolderUrl;
  if (input.qldCrn) fields.QLD_CRN = Number(input.qldCrn);

  try {
    const record = await getBase()(TABLES.renters).create(fields, { typecast: true });
    return record.id;
  } catch (e) {
    // Mismo caso que en listRentersFull: si "whatsapp" todavía no existe como
    // campo, no perdemos el resto de la solicitud del inquilino por eso.
    if (fields.whatsapp && e instanceof Error && e.message.includes("whatsapp")) {
      const { whatsapp: _whatsapp, ...rest } = fields;
      const record = await getBase()(TABLES.renters).create(rest, { typecast: true });
      return record.id;
    }
    throw e;
  }
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
  signedName: string | null;
  signedAt: string | null;
  kmStart: number | null;
  kmEnd: number | null;
  returnDate: string | null; // YYYY-MM-DD, fecha real de devolución
};

export const listContracts = cache(async (): Promise<ContractRecord[]> => {
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
        "signed_name",
        "signed_at",
        "km_start",
        "km_end",
        "return_date",
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
    status: (r.get("contract_status") as string) ?? "-",
    driveFolderUrl: (r.get("drive_folder_url") as string) ?? null,
    signedName: (r.get("signed_name") as string) ?? null,
    signedAt: (r.get("signed_at") as string) ?? null,
    kmStart: (r.get("km_start") as number) ?? null,
    kmEnd: (r.get("km_end") as number) ?? null,
    returnDate: (r.get("return_date") as string) ?? null,
  }));
});

export const getContract = cache(async (id: string): Promise<ContractRecord | null> => {
  const contracts = await listContracts();
  return contracts.find((c) => c.id === id) ?? null;
});

// "CTR-001", "CTR-002"... - sigue la numeración que ya se venía usando a mano.
function nextContractId(existingIds: string[]): string {
  const numbers = existingIds
    .map((id) => /^CTR-(\d+)$/.exec(id))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => Number(m[1]));
  const next = (numbers.length > 0 ? Math.max(...numbers) : 0) + 1;
  return `CTR-${String(next).padStart(3, "0")}`;
}

export type NewContract = {
  renterId: string;
  carId: string;
  startDate: string; // YYYY-MM-DD
  weeklyRate: number;
  bond: number;
  status: string;
};

export async function createContract(
  input: NewContract
): Promise<{ id: string; contractId: string }> {
  const existing = await listContracts();
  const contractId = nextContractId(existing.map((c) => c.contractId));

  const record = await getBase()(TABLES.contracts).create(
    {
      contract_id: contractId,
      Renter: [input.renterId],
      Car: [input.carId],
      start_date: input.startDate,
      weekly_rate: input.weeklyRate,
      bond: input.bond,
      contract_status: input.status,
    },
    // typecast crea el valor "Pendiente" de contract_status la primera vez que se usa.
    { typecast: true }
  );
  return { id: record.id, contractId };
}

export async function updateContractStatus(id: string, status: string): Promise<void> {
  await getBase()(TABLES.contracts).update(id, { contract_status: status }, { typecast: true });
}

export async function updateContractBond(id: string, bond: number): Promise<void> {
  await getBase()(TABLES.contracts).update(id, { bond });
}

export async function signContract(
  id: string,
  signedName: string,
  signedAt: string
): Promise<void> {
  await getBase()(TABLES.contracts).update(id, { signed_name: signedName, signed_at: signedAt });
}

export async function updateContractKmStart(id: string, kmStart: number): Promise<void> {
  await getBase()(TABLES.contracts).update(id, { km_start: kmStart });
}

export async function markContractReturned(
  id: string,
  kmEnd: number,
  returnDate: string
): Promise<void> {
  await getBase()(TABLES.contracts).update(
    id,
    { km_end: kmEnd, return_date: returnDate, contract_status: "Finalizado" },
    // typecast crea el valor "Finalizado" de contract_status la primera vez que se usa.
    { typecast: true }
  );
}
