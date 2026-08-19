export function Stat({
  label,
  value,
  tone,
  breakdown,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
  breakdown?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
      <div
        className={`text-xl font-bold tabular-nums ${
          tone === "positive"
            ? "text-emerald-600 dark:text-emerald-400"
            : tone === "negative"
              ? "text-red-600 dark:text-red-400"
              : "text-zinc-900 dark:text-zinc-50"
        }`}
      >
        {value}
      </div>
      {breakdown}
    </div>
  );
}
