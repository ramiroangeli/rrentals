"use client";

import { useActionState } from "react";
import { submitSignature } from "@/app/actions/sign";

export function SignatureForm({
  contractId,
  suggestedName,
}: {
  contractId: string;
  suggestedName: string;
}) {
  const [state, action, pending] = useActionState(submitSignature, undefined);

  return (
    <form
      action={action}
      className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <input type="hidden" name="contractId" value={contractId} />
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        By typing your full name below and confirming, you agree to be bound by the terms of this
        Agreement, equivalent to a handwritten signature.
      </p>
      <div>
        <label className="mb-1 block text-sm text-zinc-500">Full name (Lessee)</label>
        <input
          type="text"
          name="signedName"
          required
          defaultValue={suggestedName}
          className="w-full rounded-lg border border-zinc-300 px-3 py-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input type="checkbox" name="agree" required className="mt-1" />
        I have read and accept the terms of this Vehicle Rental Agreement.
      </label>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-teal-700 px-4 py-4 text-base font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-50 dark:bg-teal-500 dark:text-teal-950 dark:hover:bg-teal-400"
      >
        {pending ? "Signing..." : "Sign agreement"}
      </button>
    </form>
  );
}
