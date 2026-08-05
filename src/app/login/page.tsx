"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-teal-50 to-white p-6 dark:from-zinc-950 dark:to-black">
      <form action={action} className="w-full max-w-sm space-y-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-700 to-teal-900 text-2xl font-bold text-white shadow-md">
            R
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Rrentals</h1>
            <p className="text-sm text-zinc-500">Ingresá la contraseña para continuar.</p>
          </div>
        </div>
        <input
          type="password"
          name="password"
          autoFocus
          placeholder="Contraseña"
          className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
        />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-teal-700 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-50 dark:bg-teal-500 dark:text-teal-950 dark:hover:bg-teal-400"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
