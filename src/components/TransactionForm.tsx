"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitTransaction } from "@/app/actions/transactions";
import { CATEGORIES, EXPENSE_CATEGORY_GROUPS, type Car, type TransactionType } from "@/lib/airtable";

function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function TransactionForm({ cars }: { cars: Car[] }) {
  const [state, action, pending] = useActionState(submitTransaction, undefined);
  const [type, setType] = useState<TransactionType>("Expense");
  const formRef = useRef<HTMLFormElement>(null);

  // Reset the type selector when a new successful submission comes in, without
  // an effect: derive it during render by tracking the last state we've seen.
  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state?.success) {
      setType("Expense");
    }
  }

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
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
          defaultValue=""
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
          defaultValue=""
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
            placeholder="0.00"
            className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-500">Fecha</label>
          <input
            type="date"
            name="date"
            required
            defaultValue={todayISO()}
            className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-zinc-500">Nota (opcional)</label>
        <input
          type="text"
          name="notes"
          placeholder="Ej: cambio de aceite"
          className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600">Movimiento cargado ✓</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-teal-700 px-4 py-4 text-base font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-50 dark:bg-teal-500 dark:text-teal-950 dark:hover:bg-teal-400"
      >
        {pending ? "Guardando..." : "Guardar movimiento"}
      </button>
    </form>
  );
}
