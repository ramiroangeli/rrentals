export const metadata = {
  title: "Política de privacidad — Rrentals",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {children}
      </div>
    </section>
  );
}

export default function PrivacidadPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 pb-14 pt-10">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Política de privacidad
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Rrentals — última actualización septiembre de 2026
        </p>
      </div>

      <Section title="Quiénes somos">
        <p>
          Rrentals es un servicio de alquiler de autos que opera en Australia. Esta página
          explica qué datos pedimos cuando completás el formulario de solicitud de alquiler en{" "}
          <span className="font-mono text-xs">rrentals.vercel.app/nuevo-alquiler</span>, para qué
          los usamos y cómo los guardamos.
        </p>
      </Section>

      <Section title="Qué datos pedimos">
        <p>Cuando completás el formulario de solicitud de alquiler te pedimos:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Nombre completo, fecha de nacimiento y nacionalidad</li>
          <li>Domicilio en Australia y teléfono de contacto (incluido WhatsApp, si aplica)</li>
          <li>
            Datos de tu licencia de conducir (número, país emisor, vencimiento) y foto de ambos
            lados
          </li>
          <li>
            Número de pasaporte, si aplica, y tu Customer Reference Number (CRN) de Queensland
            Transport
          </li>
        </ul>
      </Section>

      <Section title="Para qué los usamos">
        <p>
          Usamos estos datos únicamente para evaluar y gestionar tu solicitud de alquiler: crear
          tu perfil de inquilino, armar el contrato correspondiente y, si tu solicitud es
          aprobada, generar el documento que vas a firmar. No los usamos con fines de marketing ni
          los vendemos ni compartimos con terceros, salvo lo necesario para operar el servicio
          (por ejemplo, el almacenamiento descrito abajo).
        </p>
      </Section>

      <Section title="Dónde se guardan">
        <p>
          Los datos del formulario se guardan en Airtable (base de datos donde administramos
          inquilinos y contratos) y las fotos de tu licencia se guardan en una carpeta de Google
          Drive dedicada a tu solicitud, con acceso restringido al equipo de Rrentals.
        </p>
      </Section>

      <Section title="Cuánto tiempo los conservamos">
        <p>
          Conservamos estos datos mientras dure tu relación como inquilino y por el tiempo
          adicional que exija la normativa australiana en materia de alquiler de vehículos y
          registros impositivos.
        </p>
      </Section>

      <Section title="Tus derechos">
        <p>
          Podés pedirnos en cualquier momento que te mostremos, corrijamos o eliminemos los datos
          que tenemos sobre vos, escribiendo a{" "}
          <a
            href="mailto:ramiromangeli@gmail.com"
            className="text-teal-700 underline dark:text-teal-400"
          >
            ramiromangeli@gmail.com
          </a>
          .
        </p>
      </Section>
    </div>
  );
}
