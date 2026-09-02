import { listCarsFull } from "@/lib/airtable";
import { todayISOBrisbane } from "@/lib/format";
import { IntakeForm } from "@/components/IntakeForm";

export const dynamic = "force-dynamic";
// El envío sube hasta 3 fotos a Drive y escribe en Airtable - el default de
// Vercel (10s) se queda corto si Drive anda lento. Ver intake.ts para el
// resto de las mitigaciones (carpeta resuelta una sola vez, subida en
// paralelo, backup a Blob).
export const maxDuration = 60;

const AVAILABLE_STATUS = "Disponible";

function WaveDivider() {
  return (
    <svg
      viewBox="0 0 400 40"
      preserveAspectRatio="none"
      className="block h-8 w-full text-[#FDF6EC]"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M0,20 C50,40 100,0 150,15 C200,30 250,5 300,18 C340,28 370,10 400,20 L400,40 L0,40 Z"
      />
    </svg>
  );
}

export default async function NuevoAlquilerPage() {
  const cars = await listCarsFull();
  const availableCars = cars
    .filter((car) => car.status === AVAILABLE_STATUS)
    .map(({ id, rego, make, model }) => ({ id, rego, make, model }));

  return (
    <div lang="en-AU" className="min-h-full bg-[#FDF6EC]">
      <div className="mx-auto flex w-full max-w-lg flex-col px-5 pb-16">
        <header className="relative overflow-hidden rounded-b-[2.5rem] bg-[#1E3A4C] px-6 pb-10 pt-10 text-center">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#FF6F4C]/20"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-[#FDF0D5]/10"
            aria-hidden="true"
          />
          <p className="relative text-xs font-bold uppercase tracking-[0.3em] text-[#FF9E80]">
            Rrentals
          </p>
          <h1 className="relative mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold italic text-white">
            New Rental Application
          </h1>
          <p className="relative mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#CBDDE5]">
            Fill in your details below and we&apos;ll get your rental agreement ready to sign.
            Takes about five minutes.
          </p>
        </header>
        <WaveDivider />

        <main className="mt-2">
          {availableCars.length === 0 ? (
            <p className="rounded-3xl border border-[#E8DFD0] bg-white p-5 text-center text-sm text-[#6B5D4F] shadow-sm">
              No vehicles are currently available. Please check back later or contact us directly.
            </p>
          ) : (
            <IntakeForm cars={availableCars} minStartDate={todayISOBrisbane()} />
          )}
        </main>
      </div>
    </div>
  );
}
