import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { AppHeader } from "@/components/AppHeader";
import { getContractByContractId, getRenter } from "@/lib/airtable";
import { renterDocsPrefix, contractDocsPrefix, listPrivateDocuments } from "@/lib/documents";

function FileRow({ pathname, filename }: { pathname: string; filename: string }) {
  return (
    <a
      href={`/documentos/archivo/${pathname}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm transition-colors hover:border-teal-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-teal-700"
    >
      <span className="font-medium text-zinc-900 dark:text-zinc-50">{filename}</span>
      <span className="shrink-0 text-teal-700 dark:text-teal-400">Ver/descargar →</span>
    </a>
  );
}

function FileSection({
  title,
  files,
}: {
  title: string;
  files: { pathname: string; filename: string }[];
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      {files.length === 0 ? (
        <p className="text-sm text-zinc-500">Sin documentos guardados.</p>
      ) : (
        <div className="space-y-2">
          {files.map((f) => (
            <FileRow key={f.pathname} pathname={f.pathname} filename={f.filename} />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function DocumentosPage({
  params,
}: {
  params: Promise<{ contrato: string }>;
}) {
  await verifySession();
  const { contrato } = await params;

  const contract = await getContractByContractId(contrato);
  if (!contract) notFound();

  const renterId = contract.renterIds[0];
  const renter = renterId ? await getRenter(renterId) : null;

  const [contractFiles, renterFiles] = await Promise.all([
    listPrivateDocuments(contractDocsPrefix(contract.contractId)),
    renterId && renter ? listPrivateDocuments(renterDocsPrefix(renterId, renter.name)) : [],
  ]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-10 pt-6">
      <AppHeader />
      <div className="space-y-4">
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {contract.contractId}
          </h1>
          <p className="text-sm text-zinc-500">{renter?.name ?? "-"}</p>
        </section>

        <FileSection title="Documentos del inquilino" files={renterFiles} />
        <FileSection title="Contrato firmado" files={contractFiles} />
      </div>
    </div>
  );
}
