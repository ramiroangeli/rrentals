import { formatCurrency } from "@/lib/format";

export type LicenceType = "Australiana" | "Extranjera";

export type ContractTemplateInput = {
  agreementDate: string; // YYYY-MM-DD, fecha de generación
  rentalStartDate: string; // YYYY-MM-DD
  weeklyRate: number;
  bond: number;
  car: {
    year: number | string;
    make: string;
    model: string;
    rego: string;
    vin: string;
  };
  renter: {
    fullName: string;
    address: string;
    dateOfBirth: string; // YYYY-MM-DD
    phone: string;
    licenceType: LicenceType;
    licenceNumber: string;
    licenceIssuingCountry: string; // para Extranjera; ignorado si Australiana
    licenceExpiry: string; // YYYY-MM-DD
    passportNumber: string | null;
    qldCrn: string;
  };
  signature: { name: string; signedAt: string } | null; // null = todavía sin firmar
};

const LESSOR = {
  name: "Ramiro Martin Angeli",
  address: "4 Hawthorn Gr, Marcus Beach QLD 4573",
  phone: "0404 351 013",
};

function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
}

// Cláusula 6(a) y 10 cambian según el tipo de licencia: para Australiana no
// aplica la frase "as a visitor" (el inquilino no está de visita), y el país
// de la licencia deja de mencionarse. Basado en el contrato real Marta/Corolla.
function expirySuffix(licenceExpiry: string): string {
  return licenceExpiry ? ` (expires ${formatLongDate(licenceExpiry)})` : "";
}

function licenceClause(renter: ContractTemplateInput["renter"]): {
  licenceDescription: string;
  authorisationClause: string;
  eligibilityClause: string;
} {
  if (renter.licenceType === "Australiana") {
    return {
      licenceDescription: `Australian Driver's Licence No. ${renter.licenceNumber}${expirySuffix(renter.licenceExpiry)}`,
      authorisationClause:
        "provide the Lessee's personal details, including full name, date of birth, Australian driver's licence number and Queensland CRN, to any relevant authority or infringement body for the purpose of redirecting liability for any infringement issued while the Vehicle was in the Lessee's possession; and",
      eligibilityClause:
        "The Lessee warrants that throughout the rental period they hold a valid Australian driver's licence and that their licence has not been suspended or cancelled.",
    };
  }

  return {
    licenceDescription: `${renter.licenceIssuingCountry} Driver's Licence No. ${renter.licenceNumber}${expirySuffix(renter.licenceExpiry)}`,
    authorisationClause:
      `provide the Lessee's personal details, including full name, date of birth, ${renter.licenceIssuingCountry} driver's licence number and Queensland CRN, to any relevant authority or infringement body for the purpose of redirecting liability for any infringement issued while the Vehicle was in the Lessee's possession; and`,
    eligibilityClause:
      `The Lessee warrants that throughout the rental period they hold a valid ${renter.licenceIssuingCountry} driver's licence, are lawfully permitted to drive in Queensland as a visitor, and that their licence has not been suspended or cancelled.`,
  };
}

export type ContractClause = { heading: string; body: string[] };

export function buildContractText(input: ContractTemplateInput): {
  intro: string;
  clauses: ContractClause[];
} {
  const { renter, car } = input;
  const { licenceDescription, authorisationClause, eligibilityClause } = licenceClause(renter);

  const vehicleDescription = `${car.year} ${car.make} ${car.model}, registration number ${car.rego}, VIN ${car.vin}`;

  const intro =
    `This Agreement is entered into on ${formatLongDate(input.agreementDate)} between the following parties:\n\n` +
    `${LESSOR.name} ("Lessor"), of ${LESSOR.address}, telephone ${LESSOR.phone}; and\n\n` +
    `${renter.fullName} ("Lessee"), of ${renter.address}, date of birth ${formatLongDate(renter.dateOfBirth)}, ` +
    `${licenceDescription}, ` +
    `${renter.passportNumber ? `passport No. ${renter.passportNumber}, ` : ""}` +
    `Queensland CRN ${renter.qldCrn}, telephone ${renter.phone}.`;

  const clauses: ContractClause[] = [
    {
      heading: "1. VEHICLE DETAILS",
      body: [`The vehicle subject to this Agreement is a ${vehicleDescription} ("the Vehicle").`],
    },
    {
      heading: "2. RENTAL PERIOD",
      body: [
        `The rental commences on ${formatLongDate(input.rentalStartDate)} and continues for an indefinite period. ` +
          "The rental continues on a week-by-week basis until terminated in accordance with clause 9 of this Agreement.",
      ],
    },
    {
      heading: "3. RENTAL FEE AND SECURITY DEPOSIT",
      body: [
        `The weekly rental fee is ${formatCurrency(input.weeklyRate)}, payable in advance each week.`,
        `A security deposit (bond) of ${formatCurrency(input.bond)} is payable at or before commencement. ` +
          "The deposit will be refunded within 48 hours of the Vehicle being returned, less any amounts lawfully " +
          "deducted under this Agreement. If the cost of damage, fines, or other charges exceeds the deposit, the " +
          "Lessee agrees to pay the difference within seven days of written notice from the Lessor.",
      ],
    },
    {
      heading: "4. PERMITTED USE",
      body: [
        "The Vehicle may be used for private, personal purposes only within the State of Queensland. The following " +
          "uses are strictly prohibited: rideshare services (including Uber, DiDi, Ola, or similar platforms); " +
          "delivery or courier services (including Uber Eats, DoorDash, Menulog, or similar); subleasing or " +
          "permitting any person other than the Lessee to drive the Vehicle; allowing any person under the age of " +
          "18 to operate the Vehicle; interstate travel without the Lessor's prior written consent.",
      ],
    },
    {
      heading: "5. KILOMETRE LIMIT",
      body: [
        "Use of the Vehicle is subject to a maximum of 25,000 kilometres per year, calculated proportionally for " +
          "the rental period.",
      ],
    },
    {
      heading: "6. FINES, TOLLS AND TRAFFIC OFFENCES",
      body: [
        "The Lessee is solely responsible for all traffic infringements, parking fines, speeding offences, and " +
          "toll charges incurred during the rental period. The Lessee expressly authorises the Lessor to:",
        `(a) ${authorisationClause}`,
        "(b) this transfer of liability may be carried out by the Lessor at any time, using the details already " +
          "provided by the Lessee under this Agreement, without requiring further notice to or confirmation from " +
          "the Lessee; and",
        "(c) charge the Lessee for any administrative or processing costs incurred by the Lessor in managing such " +
          "matters.",
      ],
    },
    {
      heading: "7. INSURANCE AND LIABILITY",
      body: [
        "The Vehicle is covered by a comprehensive motor vehicle insurance policy. The Lessee acknowledges and " +
          "agrees that: (a) coverage is subject to the terms, conditions, exclusions and excess amounts of the " +
          "policy in force at the time of any incident; (b) the applicable standard excess is AUD $700, and " +
          "additional excesses may apply depending on the circumstances of any claim; (c) in the event of any " +
          "accident, damage, or loss during the rental period, the Lessee shall be responsible for payment of the " +
          "applicable excess unless the insurer confirms in writing that no excess is payable; (d) any costs or " +
          "liabilities not covered by the policy, or arising from a breach of this Agreement, remain the full " +
          "responsibility of the Lessee; and (e) the Lessee must promptly notify the Lessor of any accident or " +
          "damage, however minor, and cooperate fully with the Lessor and the insurer in connection with any " +
          "claim or investigation.",
      ],
    },
    {
      heading: "8. VEHICLE CONDITION AND RETURN",
      body: [
        "The Vehicle is provided in good working condition. The Lessee agrees to return the Vehicle in the same " +
          "condition, fair wear and tear excepted, with the same fuel level as at delivery and free of personal " +
          "belongings.",
        "Any damage, cleaning requirements, repairs, or outstanding charges will be deducted from the security " +
          "deposit. If costs exceed the deposit, the Lessee agrees to pay the shortfall within seven days of " +
          "written notice.",
      ],
    },
    {
      heading: "9. TERMINATION AND VEHICLE RECOVERY",
      body: [
        "The Lessor may terminate this Agreement at any time by giving the Lessee 48 hours' written notice " +
          "(including by SMS or email).",
        "The Lessee may terminate this Agreement and return the Vehicle by giving the Lessor at least seven (7) " +
          "days' written notice (including by SMS or email).",
        "Upon termination by either party, the Lessee must return the Vehicle within the applicable notice " +
          "period and the weekly fee will be prorated to the date of return.",
        "If the Lessee fails to return the Vehicle within the time required under a notice of termination, " +
          "abandons the Vehicle, or is unreachable for more than 24 hours after the return deadline, the Lessor " +
          "is entitled to take immediate possession of the Vehicle without further notice and at the Lessee's " +
          "cost.",
        "The Lessor may also terminate this Agreement immediately, without prior notice, in the event of any " +
          "material breach, including use of the Vehicle for a prohibited purpose, failure to pay the rental " +
          "fee, or involvement of the Vehicle in a criminal act.",
      ],
    },
    {
      heading: "10. LESSEE'S LICENCE AND DRIVING ELIGIBILITY",
      body: [
        eligibilityClause +
          " The Lessee must carry their licence and identification at all times when operating the Vehicle and " +
          "must provide a copy of their licence, passport, and Queensland CRN to the Lessor at or before signing. " +
          "Any misrepresentation as to licence validity constitutes a material breach of this Agreement.",
      ],
    },
    {
      heading: "11. GOVERNING LAW",
      body: [
        "This Agreement is governed by the laws of Queensland, Australia. Any dispute arising under it is " +
          "subject to the jurisdiction of the courts of Queensland.",
      ],
    },
    {
      heading: "12. PRIVACY AND DOCUMENT STORAGE",
      body: [
        "Copies of the Lessee's driver's licence, passport, and Queensland CRN provided under this Agreement will " +
          "be retained by the Lessor solely for the purposes of administering this Agreement, including " +
          "insurance, registration, and the management of any traffic infringements or fines arising during the " +
          "rental period. These documents will not be used for any other purpose or disclosed to any third party " +
          "except where required for the purposes described above.",
      ],
    },
  ];

  return { intro, clauses };
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Snapshot autocontenido del contrato para guardar en Drive cuando el
// inquilino firma - mismo contenido que /firmar/[contractId], en un solo
// archivo .html que se puede abrir o imprimir a PDF en cualquier momento.
export function buildContractHtml(input: ContractTemplateInput): string {
  const { intro, clauses } = buildContractText(input);

  const clausesHtml = clauses
    .map(
      (clause) =>
        `<h2>${escapeHtml(clause.heading)}</h2>` +
        clause.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")
    )
    .join("");

  const signatureHtml = input.signature
    ? `<p><strong>Signed:</strong> ${escapeHtml(input.signature.name)} on ${formatLongDate(
        input.signature.signedAt.slice(0, 10)
      )}</p>`
    : "<p><em>Not signed yet.</em></p>";

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Vehicle Rental Agreement - ${escapeHtml(input.renter.fullName)}</title>
<style>
  body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; padding: 0 20px; line-height: 1.5; color: #1a1a1a; }
  h1 { text-align: center; text-transform: uppercase; }
  h2 { font-size: 15px; margin-top: 24px; }
  p { font-size: 14px; white-space: pre-line; }
</style>
</head>
<body>
<h1>Vehicle Rental Agreement</h1>
<p style="text-align:center;font-style:italic;">Private Use Only</p>
<p>${escapeHtml(intro)}</p>
${clausesHtml}
<h2>Execution</h2>
<p><strong>Lessor (Owner)</strong><br/>Name: ${escapeHtml(LESSOR.name)}</p>
${signatureHtml}
</body>
</html>`;
}

export { LESSOR, formatLongDate };
