import { verifySession } from "@/lib/dal";
import { AppHeader } from "@/components/AppHeader";

function LinkRow({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm transition-colors hover:border-teal-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-teal-700"
    >
      <span className="font-medium text-zinc-900 dark:text-zinc-50">{label}</span>
      <span className="shrink-0 text-teal-700 dark:text-teal-400">Abrir →</span>
    </a>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white dark:bg-teal-500 dark:text-teal-950">
        {n}
      </span>
      <span className="pt-0.5 text-sm text-zinc-700 dark:text-zinc-300">{children}</span>
    </li>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      {children}
    </section>
  );
}

export default async function SopPage() {
  await verifySession();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-10 pt-6">
      <AppHeader />

      <div className="space-y-4">
        <Card title="🔗 Links rápidos">
          <div className="space-y-2">
            <LinkRow label="App en producción" href="https://rrentals.vercel.app" />
            <LinkRow
              label="Formulario de nuevo alquiler"
              href="https://rrentals.vercel.app/nuevo-alquiler"
            />
            <LinkRow
              label="Dashboard de Vercel"
              href="https://vercel.com/ramiromangeli-4861s-projects/rrentals"
            />
            <LinkRow
              label="Repositorio en GitHub"
              href="https://github.com/ramiroangeli/rrentals"
            />
            <LinkRow label="Base de Airtable" href="https://airtable.com/appQHr080xm4sCku3" />
          </div>
        </Card>

        <Card title="🚗 Alquilar un auto nuevo">
          <ol className="space-y-3">
            <Step n={1}>Confirmás con el cliente por WhatsApp qué auto y desde cuándo.</Step>
            <Step n={2}>
              En Airtable, tabla <code>cars</code>, marcás ese auto con <code>status</code> ={" "}
              <strong>&quot;Disponible&quot;</strong>.
            </Step>
            <Step n={3}>
              Le mandás el link fijo del formulario:{" "}
              <span className="font-mono text-xs">rrentals.vercel.app/nuevo-alquiler</span>
            </Step>
            <Step n={4}>El cliente completa sus datos, elige el auto y sube sus documentos.</Step>
            <Step n={5}>
              Entrás a <strong>Contratos</strong> en la app, revisás la solicitud (aparece en
              ámbar arriba de todo), ajustás el bond si hace falta, y apretás{" "}
              <strong>Aprobar</strong>.
            </Step>
            <Step n={6}>
              En esa misma tarjeta aparece el link de firma - lo copiás y se lo mandás al cliente.
            </Step>
            <Step n={7}>
              El cliente firma. Queda grabado solo, y una copia del contrato (HTML + PDF) se guarda
              sola en Blob - visible con el botón &quot;Ver documentos&quot; de esa tarjeta.
            </Step>
            <Step n={8}>
              Cuando termine ese alquiler, volvés al paso 2 para dejar el auto disponible para el
              próximo.
            </Step>
          </ol>
        </Card>

        <Card title="🚀 Publicar cambios de código">
          <ol className="space-y-3">
            <Step n={1}>Probar todo en local antes de pasarlo a producción.</Step>
            <Step n={2}>
              Si hay campos nuevos de Airtable, confirmar que ya estén creados en las tablas
              correspondientes.
            </Step>
            <Step n={3}>
              Si hay variables de entorno nuevas, agregarlas en Vercel (⚙️ Project Settings →
              Environment Variables) antes del deploy.
            </Step>
            <Step n={4}>Commit + push a la rama main.</Step>
            <Step n={5}>
              Vercel despliega solo en 1-2 minutos. Confirmás en su dashboard que el último
              deployment dice <strong>&quot;Ready&quot;</strong>.
            </Step>
            <Step n={6}>Probar de nuevo, ya en producción.</Step>
          </ol>
        </Card>

        <Card title="📄 Dónde quedan los documentos">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Las fotos de licencia y la copia firmada del contrato se guardan en Vercel Blob (store
            privado, no en Google Drive). Se ven solo logueado en la app, desde el botón &quot;Ver
            documentos&quot; de cada contrato - no hay link público ni token que pueda vencer.
          </p>
        </Card>
      </div>
    </div>
  );
}
