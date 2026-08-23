"use client";

import { useId, useState } from "react";

export function FileInput({ name, label }: { name: string; label: string }) {
  const [fileName, setFileName] = useState<string | null>(null);
  const inputId = useId();

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-[#3E5566]">
        {label}
      </label>
      <label
        htmlFor={inputId}
        className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3.5 py-3 text-base transition-colors ${
          fileName
            ? "border-[#9FCBB8] bg-[#DCEEE7]"
            : "border-dashed border-[#D8CBB4] bg-white hover:border-[#FF6F4C]/50"
        }`}
      >
        <span className={`truncate ${fileName ? "text-[#1E3A4C]" : "text-[#B9AC98]"}`}>
          {fileName ? `📎 ${fileName}` : "Tap to attach photo"}
        </span>
        <span className="shrink-0 rounded-full bg-[#1E3A4C] px-2.5 py-1 text-xs font-semibold text-white">
          {fileName ? "Change" : "Choose"}
        </span>
      </label>
      <input
        id={inputId}
        type="file"
        name={name}
        accept="image/*"
        className="sr-only"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
      />
    </div>
  );
}
