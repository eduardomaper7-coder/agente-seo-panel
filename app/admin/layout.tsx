import Link from "next/link";

// Panel interno — solo para el equipo de la agencia (sección 09 del
// documento de estrategia). Nunca es lo que ve un cliente.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const nav = [
    { href: "/admin", label: "Clientes" },
    { href: "/admin/clientes/nuevo", label: "Alta de cliente" },
    { href: "/admin/envio-prensa", label: "Envío de prensa" },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-ink/10 bg-white p-5">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wide text-ink/40">Panel interno</p>
          <p className="text-sm font-medium text-ink">AIBE Technologies</p>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-ink/70 hover:bg-accent/10 hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
