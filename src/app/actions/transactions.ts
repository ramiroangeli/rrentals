"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { createTransaction, type TransactionType } from "@/lib/airtable";

export type TransactionFormState = { error?: string; success?: boolean } | undefined;

export async function submitTransaction(
  _state: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  await verifySession();

  const carId = formData.get("carId");
  const type = formData.get("type");
  const category = formData.get("category");
  const amountRaw = formData.get("amount");
  const date = formData.get("date");
  const notes = formData.get("notes");

  if (typeof carId !== "string" || !carId) {
    return { error: "Elegí un auto." };
  }
  if (type !== "Income" && type !== "Expense") {
    return { error: "Elegí el tipo de movimiento." };
  }
  if (typeof category !== "string" || !category) {
    return { error: "Elegí una categoría." };
  }
  if (typeof date !== "string" || !date) {
    return { error: "Elegí una fecha." };
  }

  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Ingresá un monto válido." };
  }

  await createTransaction({
    carId,
    type: type as TransactionType,
    category,
    amount,
    date,
    notes: typeof notes === "string" ? notes : "",
  });

  revalidatePath("/");
  return { success: true };
}
