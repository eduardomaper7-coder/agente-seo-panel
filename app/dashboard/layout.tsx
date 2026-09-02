// Panel del cliente — lo que ve cada negocio con su propio usuario y
// contraseña. Row Level Security en supabase/schema.sql garantiza que solo
// puede ver sus propios datos, nunca los de otro cliente.
import { getDashboardData } from "@/lib/dashboard-datos";
import { AppShell } from "@/components/dashboard/AppShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { demo, cliente, email } = await getDashboardData();

  return (
    <AppShell nombreNegocio={cliente.nombreNegocio} email={email} demo={demo}>
      {children}
    </AppShell>
  );
}
