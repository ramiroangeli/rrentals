const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatDateAU(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// DD-MM-YY, para nombres de carpeta en Drive (ej. "31-07-26").
export function formatDateShort(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y.slice(2)}`;
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

// "Hoy" en horario de Queensland, no en el del servidor (Vercel corre en UTC,
// que puede ir un día adelante/atrás de QLD según la hora) - importa para
// validar fechas como "no puede ser en el pasado".
export function todayISOBrisbane(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Brisbane" }).format(new Date());
}
