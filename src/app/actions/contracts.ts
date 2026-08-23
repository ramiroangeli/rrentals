"use server";

import { revalidatePath } from "next/cache";
import {
  updateContractBond,
  updateContractStatus,
  updateContractKmStart,
  markContractReturned,
} from "@/lib/airtable";

export async function approveContract(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const bond = Number(formData.get("bond"));
  if (Number.isFinite(bond) && bond >= 0) {
    await updateContractBond(id, bond);
  }
  await updateContractStatus(id, "Active");
  revalidatePath("/contratos");
}

export async function rejectContract(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await updateContractStatus(id, "Rechazado");
  revalidatePath("/contratos");
}

export async function setKmStart(formData: FormData): Promise<void> {
  const id = formData.get("id");
  const kmStart = Number(formData.get("kmStart"));
  if (typeof id !== "string" || !id) return;
  if (!Number.isFinite(kmStart) || kmStart < 0) return;

  await updateContractKmStart(id, kmStart);
  revalidatePath("/contratos");
}

export async function returnContract(formData: FormData): Promise<void> {
  const id = formData.get("id");
  const kmEnd = Number(formData.get("kmEnd"));
  const returnDate = formData.get("returnDate");
  if (typeof id !== "string" || !id) return;
  if (!Number.isFinite(kmEnd) || kmEnd < 0) return;
  if (typeof returnDate !== "string" || !returnDate) return;

  await markContractReturned(id, kmEnd, returnDate);
  revalidatePath("/contratos");
}
