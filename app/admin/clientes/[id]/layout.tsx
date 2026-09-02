import { notFound } from "next/navigation";
import { getDashboardDataById } from "@/lib/dashboard-datos";
import { AdminClientShell } from "@/components/dashboard/AdminClientShell";

// app/admin/layout.tsx ya exige sesión de administrador para todo lo que
// cuelgue de /admin, así que aquí solo hace falta resolver el cliente por
// id (con la clave de servicio, saltándose RLS) y pintar el mismo tipo de
// panel que ve el cliente, pero con la navegación de /admin/clientes/[id].
export default async function AdminClienteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const datos = await getDashboardDataById(params.id);
  if (!datos) notFound();

  return (
    <AdminClientShell nombreNegocio={datos.cliente.nombreNegocio} clienteId={params.id}>
      {children}
    </AdminClientShell>
  );
}
