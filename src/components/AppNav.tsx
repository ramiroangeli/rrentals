"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Cargar" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/contratos", label: "Contratos" },
  { href: "/historial", label: "Historial" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto rounded-full bg-zinc-100 p-1 dark:bg-zinc-900">
      {TABS.map((tab) => {
        const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-violet-700 text-white dark:bg-violet-500 dark:text-violet-950"
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
