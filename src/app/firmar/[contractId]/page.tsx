import { notFound } from "next/navigation";
import { getContract, getRenter, listCarsFull } from "@/lib/airtable";
import { buildContractText, type LicenceType } from "@/lib/contractTemplate";
import { SignatureForm } from "@/components/SignatureForm";
import { formatDateAU } from "@/lib/format";

export const dynamic = "force-dynamic";

function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export default async function SignContractPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const { contractId } = await params;

  const contract = await getContract(contractId);
  if (!contract) notFound();

  const renterId = contract.renterIds[0];
  const carId = contract.carIds[0];
  if (!renterId || !carId) notFound();

  const [renter, cars] = await Promise.all([getRenter(renterId), listCarsFull()]);
  const car = cars.find((c) => c.id === carId);
  if (!renter || !car) notFound();

  const licenceType: LicenceType =
    renter.licenceIssuingCountry.trim().toLowerCase() === "australia" ? "Australiana" : "Extranjera";

  const { intro, clauses } = buildContractText({
    agreementDate: contract.signedAt ? contract.signedAt.slice(0, 10) : todayISO(),
    rentalStartDate: contract.startDate ?? todayISO(),
    weeklyRate: contract.weeklyRate,
    bond: contract.bond,
    car: {
      year: car.year ?? "-",
      make: car.make,
      model: car.model,
      rego: car.rego,
      vin: car.vin ?? "-",
    },
    renter: {
      fullName: renter.name,
      address: renter.address,
      dateOfBirth: renter.dateOfBirth ?? "",
      phone: renter.phone,
      licenceType,
      licenceNumber: renter.licenceNumber,
      licenceIssuingCountry: renter.licenceIssuingCountry,
      licenceExpiry: renter.licenceExpiry ?? "",
      passportNumber: renter.passportNumber,
      qldCrn: renter.qldCrn,
    },
    signature:
      contract.signedName && contract.signedAt
        ? { name: contract.signedName, signedAt: contract.signedAt }
        : null,
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-10 pt-6">
      <h1 className="mb-1 text-center text-lg font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
        Vehicle Rental Agreement
      </h1>
      <p className="mb-6 text-center text-sm italic text-zinc-500">Private Use Only</p>

      <p className="mb-6 whitespace-pre-line text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
        {intro}
      </p>

      <div className="space-y-5">
        {clauses.map((clause) => (
          <section key={clause.heading}>
            <h2 className="mb-1 text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {clause.heading}
            </h2>
            {clause.body.map((paragraph, i) => (
              <p
                key={i}
                className="mb-1 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200"
              >
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>

      <div className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
          Execution
        </h2>
        <div className="mb-4 text-sm text-zinc-800 dark:text-zinc-200">
          <p className="font-semibold">Lessor (Owner)</p>
          <p>Name: Ramiro Martin Angeli</p>
        </div>

        {contract.signedName && contract.signedAt ? (
          <div className="rounded-lg bg-emerald-50 p-4 text-sm dark:bg-emerald-950">
            <p className="font-semibold text-emerald-700 dark:text-emerald-300">Signed ✓</p>
            <p className="mt-1 text-emerald-700/80 dark:text-emerald-300/80">
              {contract.signedName} - {formatDateAU(contract.signedAt.slice(0, 10))}
            </p>
          </div>
        ) : (
          <SignatureForm contractId={contract.id} suggestedName={renter.name} />
        )}
      </div>
    </div>
  );
}
