import ReactPDF, { StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { buildContractText, formatLongDate, LESSOR, type ContractTemplateInput } from "@/lib/contractTemplate";

const { Document, Page, Text, View } = ReactPDF;

const styles = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 10.5,
    lineHeight: 1.4,
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 54,
    color: "#1a1a1a",
  },
  title: {
    fontFamily: "Times-Bold",
    fontSize: 16,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: "Times-Italic",
    fontSize: 9,
    textAlign: "center",
    marginTop: 2,
    color: "#555555",
  },
  refLine: {
    fontSize: 8.5,
    textAlign: "center",
    marginTop: 6,
    color: "#555555",
  },
  rule: {
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    marginTop: 12,
    marginBottom: 14,
  },
  intro: {
    marginBottom: 12,
    textAlign: "justify",
  },
  clauseBlock: {
    marginBottom: 2,
  },
  heading: {
    fontFamily: "Times-Bold",
    fontSize: 10.5,
    marginTop: 8,
    marginBottom: 3,
  },
  paragraph: {
    marginBottom: 4,
    textAlign: "justify",
  },
  executionTitle: {
    fontFamily: "Times-Bold",
    fontSize: 11,
    marginTop: 18,
    marginBottom: 10,
    textTransform: "uppercase",
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    paddingTop: 10,
  },
  partyBlock: { marginBottom: 10 },
  partyLabel: { fontFamily: "Times-Bold", fontSize: 9.5, marginBottom: 2 },
  signatureBox: {
    marginTop: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  signatureName: {
    fontFamily: "Times-Bold",
    fontSize: 12,
    marginBottom: 4,
  },
  signatureMeta: {
    fontSize: 8.5,
    color: "#333333",
    marginBottom: 5,
  },
  signatureNote: {
    fontSize: 8.5,
    color: "#333333",
    lineHeight: 1.4,
    textAlign: "justify",
  },
  notSigned: {
    marginTop: 8,
    fontFamily: "Times-Italic",
    fontSize: 9.5,
    color: "#555555",
  },
  footer: {
    position: "absolute",
    bottom: 26,
    left: 54,
    right: 54,
    fontSize: 7.5,
    color: "#777777",
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#cccccc",
    paddingTop: 6,
  },
});

export type ContractPdfInput = ContractTemplateInput & { contractId?: string };

// PDF limpio para archivar/enviar al inquilino como copia del contrato ya
// firmado (a diferencia de buildContractHtml, pensado para verse bien
// impreso o adjunto a un mail, no para mostrarse dentro de la app). Usa
// @react-pdf/renderer en vez de convertir HTML con un navegador headless -
// Next.js ya lo tiene en su lista de paquetes probados para funciones
// serverless, evita el peso y la fragilidad de levantar Chrome en Vercel.
export async function buildContractPdf(input: ContractPdfInput): Promise<Buffer> {
  const { intro, clauses } = buildContractText(input);
  const { renter, signature } = input;

  const signedDate = signature ? formatLongDate(signature.signedAt.slice(0, 10)) : null;
  const signedTime = signature
    ? new Date(signature.signedAt).toLocaleTimeString("en-AU", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Australia/Brisbane",
      })
    : null;

  const doc = (
    <Document title={`Vehicle Rental Agreement - ${renter.fullName}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Vehicle Rental Agreement</Text>
        <Text style={styles.subtitle}>Private Use Only</Text>
        {input.contractId ? (
          <Text style={styles.refLine}>
            Agreement Reference: {input.contractId} · Dated {formatLongDate(input.agreementDate)}
          </Text>
        ) : null}
        <View style={styles.rule} />

        <Text style={styles.intro}>{intro}</Text>

        {clauses.map((clause) => (
          <View key={clause.heading} style={styles.clauseBlock} wrap={false}>
            <Text style={styles.heading}>{clause.heading}</Text>
            {clause.body.map((paragraph, i) => (
              <Text key={i} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}

        <Text style={styles.executionTitle}>Execution</Text>

        <View style={styles.partyBlock}>
          <Text style={styles.partyLabel}>Lessor (Owner)</Text>
          <Text>{LESSOR.name}</Text>
          <Text>{LESSOR.address}</Text>
        </View>

        <View style={styles.partyBlock}>
          <Text style={styles.partyLabel}>Lessee</Text>
          <Text>{renter.fullName}</Text>
        </View>

        {signature && signedDate && signedTime ? (
          <View style={styles.signatureBox}>
            <Text style={styles.signatureName}>Electronically Signed: {signature.name}</Text>
            <Text style={styles.signatureMeta}>
              Signed on {signedDate} at {signedTime} (Australia/Brisbane time)
            </Text>
            <Text style={styles.signatureNote}>
              This Agreement was executed electronically. The Lessee accepted and signed this
              Agreement online via the Lessor&apos;s digital signing system by entering their full
              legal name and affirmatively confirming acceptance of all terms set out above. This
              electronic signature is intended to have the same legal effect as a handwritten
              signature, in accordance with the Electronic Transactions (Queensland) Act 2001.
            </Text>
          </View>
        ) : (
          <Text style={styles.notSigned}>Not signed yet.</Text>
        )}

        <Text style={styles.footer} fixed>
          Rrentals — Vehicle Rental Agreement
          {input.contractId ? ` · ${input.contractId}` : ""}
        </Text>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
