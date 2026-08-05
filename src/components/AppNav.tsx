"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Cargar" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/contratos", label: "Contratos" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-900">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-teal-700 text-white dark:bg-teal-500 dark:text-teal-950"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
