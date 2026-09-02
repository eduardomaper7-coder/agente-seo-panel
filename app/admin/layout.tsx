import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { SignOutButton } from "@/components/dashboard/SignOutButton";

// Panel interno — solo para el equipo de la agencia (sección 09 del
// documento de estrategia). Nunca es lo que ve un cliente. requireAdmin()
// protege esta ruta y todo lo que cuelga de ella (incluido el panel de
// cualquier cliente visto en /admin/clientes/[id]): sin sesión de una
// cuenta de administrador, no se llega a renderizar nada de lo de abajo.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  const nav = [
    { href: "/admin", label: "Clientes" },
    { href: "/admin/informes", label: "Informes" },
    { href: "/admin/clientes/nuevo", label: "Alta de cliente" },
    { href: "/admin/envio-prensa", label: "Envío de prensa" },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-ink/10 bg-white p-5">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wide text-ink/40">Panel interno</p>
          <p className="text-sm font-medium text-ink">AIBE Technologies</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
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
        <div className="border-t border-ink/10 pt-3">
          <p className="truncate text-xs text-ink/40">{admin.email}</p>
          <SignOutButton className="mt-2" />
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
