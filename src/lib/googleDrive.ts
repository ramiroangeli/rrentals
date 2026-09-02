import "server-only";
import { Readable } from "stream";
import { google } from "googleapis";
import { formatDateShort } from "@/lib/format";

// "Nissan Tiida | Marta Llacer Navarro | 31-07-26" - la fecha es la de inicio
// de alquiler (con la que se genera el contrato), fija desde el intake.
export function renterFolderName(carLabel: string, fullName: string, dateIso: string): string {
  return `${carLabel} | ${fullName} | ${formatDateShort(dateIso)}`;
}

function getDriveClient() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Faltan GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / GOOGLE_OAUTH_REFRESH_TOKEN"
    );
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });

  return google.drive({ version: "v3", auth });
}

function getRootFolderId(): string {
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) throw new Error("Falta GOOGLE_DRIVE_ROOT_FOLDER_ID");
  return rootId;
}

async function findSubfolder(
  drive: ReturnType<typeof getDriveClient>,
  name: string
): Promise<string | null> {
  const rootId = getRootFolderId();
  const escapedName = name.replace(/'/g, "\\'");

  const existing = await drive.files.list({
    q: `'${rootId}' in parents and name = '${escapedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name)",
  });

  return existing.data.files?.[0]?.id ?? null;
}

// Busca una subcarpeta por nombre dentro de la carpeta raíz compartida (una por
// inquilino, ej. "Nissan Tiida - Marta Llacer Navarro - 31-07-26") y la crea
// si todavía no existe.
async function findOrCreateSubfolder(
  drive: ReturnType<typeof getDriveClient>,
  name: string
): Promise<string> {
  const found = await findSubfolder(drive, name);
  if (found) return found;

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [getRootFolderId()],
    },
    fields: "id",
  });

  const id = created.data.id;
  if (!id) throw new Error("No se pudo crear la subcarpeta en Drive");
  return id;
}

export type DriveUploadResult = {
  fileId: string;
  fileViewLink: string;
  folderId: string;
  folderLink: string;
};

export type DriveFolder = { folderId: string; folderLink: string };

// Resuelve (o crea) la subcarpeta del inquilino una sola vez. Separado de
// uploadFileToFolder para que quien suba varios archivos (ej. el intake, con
// hasta 3 fotos) no tenga que buscar/crear la misma carpeta una vez por
// archivo - cada búsqueda es un round-trip a Drive, y sumados podían acercar
// el envío al límite de tiempo de la función serverless en Vercel.
export async function resolveRenterFolder(subfolderName: string): Promise<DriveFolder> {
  const drive = getDriveClient();
  const folderId = await findOrCreateSubfolder(drive, subfolderName);
  return { folderId, folderLink: `https://drive.google.com/drive/folders/${folderId}` };
}

export async function uploadFileToFolder(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  folderId: string
): Promise<{ fileId: string; fileViewLink: string }> {
  const drive = getDriveClient();
  const upload = await drive.files.create({
    requestBody: { name: filename, parents: [folderId] },
    media: { mimeType, body: Readable.from(buffer) },
    fields: "id, webViewLink",
  });

  if (!upload.data.id) throw new Error("No se pudo subir el archivo a Drive");

  return { fileId: upload.data.id, fileViewLink: upload.data.webViewLink ?? "" };
}

// Atajo para cuando solo hay un archivo (ej. el contrato firmado en sign.ts) -
// resuelve la carpeta y sube el archivo en un solo llamado.
export async function uploadToDrive(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  subfolderName: string
): Promise<DriveUploadResult> {
  const { folderId, folderLink } = await resolveRenterFolder(subfolderName);
  const { fileId, fileViewLink } = await uploadFileToFolder(buffer, filename, mimeType, folderId);
  return { fileId, fileViewLink, folderId, folderLink };
}
