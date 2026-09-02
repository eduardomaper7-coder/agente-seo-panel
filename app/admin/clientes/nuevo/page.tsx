import { crearCliente } from "./actions";

function Campo({
  label,
  name,
  placeholder,
  required = false,
  hint,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-ink/70" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm outline-accent"
      />
      {hint && <p className="mt-1 text-xs text-ink/40">{hint}</p>}
    </div>
  );
}

export default function NuevoClientePage() {
  return (
    <div className="max-w-xl">
      <h1 className="mb-1 text-2xl font-semibold text-ink">Alta de nuevo cliente</h1>
      <p className="mb-6 text-sm text-ink/60">
        Esto es el "medio disponible 24h" descrito en la sección 09 del documento de estrategia:
        en cuanto guardes, el agente arranca el Paso 1 para este cliente en el siguiente ciclo
        programado.
      </p>

      <form action={crearCliente} className="space-y-5 rounded-lg border border-ink/10 bg-white p-6">
        <Campo label="Nombre del negocio" name="nombre_negocio" placeholder="Clínica Dalí Dent" required />
        <Campo label="Sector" name="sector" placeholder="Clínica dental" />
        <Campo label="Ubicación" name="ubicacion" placeholder="España" />

        <hr className="border-ink/10" />

        <Campo
          label="Dominio de la web"
          name="dominio"
          placeholder="dalident.es"
          hint="Sin https:// ni www — igual que en Search Console."
        />
        <Campo
          label="Repositorio de GitHub"
          name="repo_url"
          placeholder="https://github.com/eduardomaper7-coder/clinicadali"
          hint="El agente abrirá pull requests aquí, nunca escribe directo a producción."
        />
        <Campo
          label="Propiedad de Search Console"
          name="gsc_property"
          placeholder="sc-domain:dalident.es"
          hint="Debe estar verificada con la cuenta administradora (aibe.technologies7@gmail.com) antes de darla de alta."
        />

        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          Guardar y arrancar el agente
        </button>
      </form>
    </div>
  );
}
