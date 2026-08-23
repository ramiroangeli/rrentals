"use client";

import { useActionState, useRef, useState } from "react";
import { submitIntake } from "@/app/actions/intake";
import type { Car } from "@/lib/airtable";
import { FileInput } from "@/components/FileInput";

const inputClass =
  "w-full rounded-xl border border-[#E8DFD0] bg-white px-3.5 py-3 text-base text-[#1E3A4C] placeholder:text-[#B9AC98] transition-colors focus:border-[#FF6F4C] focus:outline-none focus:ring-2 focus:ring-[#FF6F4C]/30";
const labelClass = "mb-1.5 block text-sm font-semibold text-[#3E5566]";

function Field({
  label,
  children,
  optional = false,
}: {
  label: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {optional && <span className="font-normal text-[#9C8D78]"> (optional)</span>}
      </label>
      {children}
    </div>
  );
}

function Section({
  number,
  badge,
  title,
  subtitle,
  children,
}: {
  number: number;
  badge: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[#E8DFD0] bg-[#FFFDF9] p-5 shadow-[0_2px_10px_rgba(30,58,76,0.06)]">
      <div className="mb-4 flex items-center gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-[#1E3A4C]"
          style={{ backgroundColor: badge }}
        >
          {number}
        </span>
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#1E3A4C]">
            {title}
          </h2>
          {subtitle && <p className="text-xs text-[#9C8D78]">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function IntakeForm({ cars, minStartDate }: { cars: Car[]; minStartDate: string }) {
  const [state, action, pending] = useActionState(submitIntake, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [licenceType, setLicenceType] = useState<"Australian" | "International">("Australian");

  if (state?.success) {
    return (
      <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFDF9] p-8 text-center shadow-[0_2px_10px_rgba(30,58,76,0.06)]">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#DCEEE7] text-2xl">
          🌴
        </div>
        <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#1E3A4C]">
          Application received!
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[#6B5D4F]">
          We&apos;ll review your details and send you the rental agreement to sign shortly.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <Section number={1} badge="#DCEEE7" title="Personal details">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name(s)">
            <input type="text" name="firstName" required className={inputClass} />
          </Field>
          <Field label="Last name(s)">
            <input type="text" name="lastName" required className={inputClass} />
          </Field>
        </div>
        <Field label="Date of birth">
          <input
            type="date"
            name="dateOfBirth"
            required
            lang="en-AU"
            className={inputClass}
          />
        </Field>
        <Field label="Nationality">
          <input type="text" name="nationality" required className={inputClass} />
        </Field>
        <Field label="Phone number">
          <div className="flex items-stretch gap-2">
            <span className="flex shrink-0 items-center rounded-xl border border-[#E8DFD0] bg-[#F3ECDD] px-3.5 text-base font-semibold text-[#6B5D4F]">
              +61
            </span>
            <input
              type="tel"
              name="phoneLocal"
              required
              placeholder="412 345 678"
              className={inputClass}
            />
          </div>
        </Field>
        <Field label="WhatsApp number" optional>
          <input
            type="tel"
            name="whatsapp"
            placeholder="Include country code if different from above"
            className={inputClass}
          />
        </Field>
        <Field label="Australian address">
          <input type="text" name="address" required className={inputClass} />
        </Field>
      </Section>

      <Section number={2} badge="#FBE4D8" title="Rental">
        <Field label="Vehicle">
          <select name="carId" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Select a vehicle
            </option>
            {cars.map((car) => (
              <option key={car.id} value={car.id}>
                {car.rego} - {car.make} {car.model}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Rental start date">
          <input
            type="date"
            name="rentalStartDate"
            required
            min={minStartDate}
            lang="en-AU"
            className={inputClass}
          />
        </Field>
      </Section>

      <Section number={3} badge="#DCEBF5" title="Licence & ID">
        <Field label="Driver's licence number">
          <input type="text" name="licenceNumber" required className={inputClass} />
        </Field>
        <Field label="Licence issuing country">
          <input
            type="text"
            name="licenceIssuingCountry"
            required
            placeholder="e.g. Australia, Spain, Argentina"
            className={inputClass}
          />
        </Field>
        <Field label="Licence expiry date" optional>
          <input type="date" name="licenceExpiry" lang="en-AU" className={inputClass} />
        </Field>
        <Field label="Passport number" optional>
          <input type="text" name="passportNumber" className={inputClass} />
        </Field>
        <Field label="Queensland CRN">
          <input
            type="text"
            name="qldCrn"
            required
            inputMode="numeric"
            pattern="[0-9]{9}"
            maxLength={9}
            title="9 digits"
            placeholder="9-digit number"
            className={inputClass}
          />
        </Field>
      </Section>

      <Section
        number={4}
        badge="#FDF0D5"
        title="Documents"
        subtitle="Australian licence: front + back. International licence: front + back + CRN photo."
      >
        <Field label="Licence type">
          <select
            name="licenceType"
            value={licenceType}
            onChange={(e) => setLicenceType(e.target.value as "Australian" | "International")}
            className={inputClass}
          >
            <option value="Australian">Australian driver&apos;s licence</option>
            <option value="International">International driver&apos;s licence</option>
          </select>
        </Field>

        {licenceType === "Australian" ? (
          <>
            <FileInput name="auLicenceFrontPhoto" label="Australian licence - front" />
            <FileInput name="auLicenceBackPhoto" label="Australian licence - back" />
          </>
        ) : (
          <>
            <FileInput name="intlLicenceFrontPhoto" label="International licence - front" />
            <FileInput name="intlLicenceBackPhoto" label="International licence - back" />
            <FileInput name="crnPhoto" label="Queensland CRN photo" />
          </>
        )}
      </Section>

      {state?.error && (
        <p className="rounded-xl bg-[#FBE4D8] px-4 py-2.5 text-sm font-medium text-[#B94B2A]">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-[#FF6F4C] px-4 py-4 text-base font-bold text-white shadow-[0_4px_14px_rgba(255,111,76,0.35)] transition-all hover:bg-[#F0603D] hover:shadow-[0_6px_18px_rgba(255,111,76,0.45)] disabled:opacity-50"
      >
        {pending ? "Submitting..." : "Submit application"}
      </button>
    </form>
  );
}
