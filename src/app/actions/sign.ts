"use server";

import { revalidatePath } from "next/cache";
import { signContract, updateContractDocumentsUrl, appendContractNote } from "@/lib/airtable";
import { buildContractHtml } from "@/lib/contractTemplate";
import { buildContractPdf } from "@/lib/contractPdf";
import { buildSignedContractInput } from "@/lib/contractDocuments";
import { contractDocsPrefix, uploadPrivateDocument, documentsPageUrl } from "@/lib/documents";

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export type SignFormState = { error?: string } | undefined;

export async function submitSignature(
  _state: SignFormState,
  formData: FormData
): Promise<SignFormState> {
  const contractId = formData.get("contractId");
  const name = formData.get("signedName");
  const agreed = formData.get("agree");

  if (typeof contractId !== "string" || !contractId) return { error: "Missing contract." };
  if (typeof name !== "string" || !name.trim()) return { error: "Enter your full name to sign." };
  if (!agreed) return { error: "You must confirm you've read and accept the agreement." };

  const signedName = name.trim();
  const signedAt = new Date().toISOString();
  await signContract(contractId, signedName, signedAt);

  // Guardar una copia (HTML + PDF) del contrato firmado en Blob. Best-effort:
  // si esto falla, la firma ya quedó grabada en Airtable, no tiene sentido
  // bloquear al inquilino por esto - pero a diferencia de antes, el error
  // queda anotado en el contrato en vez de perderse en silencio.
  try {
    const input = await buildSignedContractInput(contractId);
    if (input) {
      const html = buildContractHtml(input);
      const pdf = await buildContractPdf(input);
      const prefix = contractDocsPrefix(input.contractId);

      await Promise.all([
        uploadPrivateDocument(`${prefix}contrato-firmado.html`, Buffer.from(html, "utf-8"), "text/html"),
        uploadPrivateDocument(`${prefix}contrato-firmado.pdf`, pdf, "application/pdf"),
      ]);
      await updateContractDocumentsUrl(contractId, documentsPageUrl(input.contractId));
    }
  } catch (e) {
    try {
      await appendContractNote(
        contractId,
        `Documentos: no se pudo guardar la copia firmada - ${errorMessage(e)}`
      );
    } catch {
      // Si ni siquiera se puede anotar el error, no hay más red de contención.
    }
  }

  revalidatePath(`/firmar/${contractId}`);
}
