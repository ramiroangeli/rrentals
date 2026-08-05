"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  parseTransactionFormData,
} from "@/lib/airtable";

export type TransactionFormState = { error?: string; success?: boolean } | undefined;

export async function submitTransaction(
  _state: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  await verifySession();

  const parsed = parseTransactionFormData(formData);
  if ("error" in parsed) return { error: parsed.error };

  await createTransaction(parsed.data);

  revalidatePath("/");
  revalidatePath("/historial");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateTransactionAction(
  _state: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  await verifySession();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Falta el ID del movimiento." };

  const parsed = parseTransactionFormData(formData);
  if ("error" in parsed) return { error: parsed.error };

  await updateTransaction(id, parsed.data);

  revalidatePath("/historial");
  revalidatePath("/dashboard");
  redirect("/historial");
}

export async function deleteTransactionAction(id: string): Promise<void> {
  await verifySession();
  await deleteTransaction(id);
  revalidatePath("/historial");
  revalidatePath("/dashboard");
}
