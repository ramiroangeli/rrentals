import "server-only";
import { put, get, list, del, type GetBlobResult } from "@vercel/blob";

// URL pública fija de la app - ver /sop. Se usa para armar el link que se
// guarda en Airtable (documents_url), no depende del host de la request.
const SITE_URL = "https://rrentals.vercel.app";

// Quita tildes/ñ y deja un slug corto y legible para usar en paths de Blob.
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// "renters/juan-perez-c1qhx/" - el sufijo del recordId evita que dos
// inquilinos con el mismo nombre pisen la carpeta del otro.
export function renterDocsPrefix(renterId: string, fullName: string): string {
  const slug = slugify(fullName) || "inquilino";
  return `renters/${slug}-${renterId.slice(-6)}/`;
}

// "contracts/CTR-008/" - el contract_id ya es único de por sí.
export function contractDocsPrefix(contractId: string): string {
  return `contracts/${contractId}/`;
}

export function documentsPageUrl(contractId: string): string {
  return `${SITE_URL}/documentos/${contractId}`;
}

// allowOverwrite+addRandomSuffix:false: reenviar el mismo archivo (ej. volver
// a firmar, o reintentar un intake) pisa la copia anterior en vez de
// acumular duplicados con sufijos random.
export async function uploadPrivateDocument(
  pathname: string,
  body: Buffer,
  contentType: string
): Promise<{ pathname: string }> {
  const blob = await put(pathname, body, {
    access: "private",
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return { pathname: blob.pathname };
}

export type DocumentEntry = {
  pathname: string;
  filename: string;
  size: number;
  uploadedAt: Date;
};

// Para listar lo que hay bajo un prefijo (ej. todo lo de un contrato o un
// inquilino) y mostrarlo en /documentos/[contrato].
export async function listPrivateDocuments(prefix: string): Promise<DocumentEntry[]> {
  const { blobs } = await list({ prefix });
  return blobs
    .map((b) => ({
      pathname: b.pathname,
      filename: b.pathname.slice(b.pathname.lastIndexOf("/") + 1),
      size: b.size,
      uploadedAt: b.uploadedAt,
    }))
    .sort((a, b) => a.filename.localeCompare(b.filename));
}

export async function getPrivateDocument(pathname: string): Promise<GetBlobResult | null> {
  return get(pathname, { access: "private" });
}

export async function deletePrivateDocuments(pathnames: string[]): Promise<void> {
  if (pathnames.length === 0) return;
  await del(pathnames);
}
