import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";

// Tipografía propia de esta página pública, distinta del resto de la app
// (que usa Geist) - es la cara visible para el inquilino, así que tiene su
// propia identidad de marca.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
});

export default function NuevoAlquilerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${fraunces.variable} ${jakarta.variable} font-[family-name:var(--font-body)]`}>
      {children}
    </div>
  );
}
