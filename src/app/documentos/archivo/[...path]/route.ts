import { verifySession } from "@/lib/dal";
import { getPrivateDocument } from "@/lib/documents";

// Único punto de lectura de los documentos privados en Blob - exige sesión
// igual que el resto de la app y solo sirve lo que vive bajo renters/ o
// contracts/ (nunca los backups de intake-backups/, que llevan datos del
// cliente sin filtrar).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  await verifySession();

  const { path } = await params;
  const pathname = path.join("/");

  if (!pathname.startsWith("renters/") && !pathname.startsWith("contracts/")) {
    return new Response("Not found", { status: 404 });
  }

  const result = await getPrivateDocument(pathname);
  if (!result || result.statusCode !== 200) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "Content-Disposition": `inline; filename="${pathname.split("/").pop()}"`,
    },
  });
}
