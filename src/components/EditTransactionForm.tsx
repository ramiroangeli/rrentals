"use client";

import { useActionState, useState } from "react";
import { updateTransactionAction } from "@/app/actions/transactions";
import {
  CATEGORIES,
  EXPENSE_CATEGORY_GROUPS,
  type TransactionFull,
  type Car,
  type TransactionType,
} from "@/lib/airtable";

export function EditTransactionForm({
  transaction,
  cars,
}: {
  transaction: TransactionFull;
  cars: Car[];
}) {
  const [state, action, pending] = useActionState(updateTransactionAction, undefined);
  const [type, setType] = useState<TransactionType>(transaction.type);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={transaction.id} />

      <div className="grid grid-cols-2 gap-2">
        {(["Expense", "Income"] as TransactionType[]).map((t) => (
          <label
            key={t}
            className={`flex items-center justify-center rounded-lg border py-3 text-sm font-medium transition-colors ${
              type === t
                ? t === "Income"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950"
                  : "border-red-600 bg-red-50 text-red-700 dark:bg-red-950"
                : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
            }`}
          >
            <input
              type="radio"
              name="type"
              value={t}
              checked={type === t}
              onChange={() => setType(t)}
              className="sr-only"
            />
            {t === "Income" ? "Ingreso" : "Gasto"}
          </label>
        ))}
      </div>

      <div>
        <label className="mb-1 block text-sm text-zinc-500">Auto</label>
        <select
          name="carId"
          required
          defaultValue={transaction.carId}
          className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="" disabled>
            Elegí un auto
          </option>
          {cars.map((car) => (
            <option key={car.id} value={car.id}>
              {car.rego} — {car.make} {car.model}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm text-zinc-500">Categoría</label>
        <select
          key={type}
          name="category"
          required
          defaultValue={transaction.category}
          className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="" disabled>
            Elegí una categoría
          </option>
          {type === "Expense"
            ? EXPENSE_CATEGORY_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </optgroup>
              ))
            : CATEGORIES[type].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-zinc-500">Monto (AUD)</label>
          <input
            type="number"
            name="amount"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
            defaultValue={transaction.amount}
            className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-500">Fecha</label>
          <input
            type="date"
            name="date"
            required
            defaultValue={transaction.date}
            className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-zinc-500">Nota (opcional)</label>
        <input
          type="text"
          name="notes"
          defaultValue={transaction.notes}
          placeholder="Ej: cambio de aceite"
          className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-teal-700 px-4 py-4 text-base font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-50 dark:bg-teal-500 dark:text-teal-950 dark:hover:bg-teal-400"
      >
        {pending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
