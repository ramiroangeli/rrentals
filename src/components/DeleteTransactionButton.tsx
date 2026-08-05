"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTransactionAction } from "@/app/actions/transactions";

export function DeleteTransactionButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!confirm("¿Borrar este movimiento? No se puede deshacer.")) return;
    startTransition(async () => {
      await deleteTransactionAction(id);
      router.push("/historial");
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="w-full rounded-lg border border-red-300 px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
    >
      {pending ? "Borrando..." : "Borrar movimiento"}
    </button>
  );
}
