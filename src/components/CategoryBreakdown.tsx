import type { CategoryAmount } from "@/lib/financials";
import { formatCurrency } from "@/lib/format";

export function CategoryBreakdown({
  items,
  tone = "muted",
}: {
  items: CategoryAmount[];
  tone?: "muted" | "light";
}) {
  if (items.length === 0) return null;

  return (
    <ul className="mt-1.5 space-y-0.5">
      {items.map((item) => (
        <li
          key={item.category}
          className={`flex items-baseline justify-between gap-2 text-xs ${
            tone === "light" ? "text-teal-100" : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          <span className="truncate">{item.category}</span>
          <span className="shrink-0 tabular-nums">{formatCurrency(item.amount)}</span>
        </li>
      ))}
    </ul>
  );
}
