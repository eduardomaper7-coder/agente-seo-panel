import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAILS_POR_DEFECTO } from "@/lib/admin-emails";

// Correos con acceso al panel interno de la agencia (todo lo que cuelga de
// /admin). Se puede ampliar sin tocar código añadiendo más correos,
// separados por comas, en la variable de entorno ADMIN_EMAILS de Vercel.
function listaAdmins(): string[] {
  const desdeEnv = process.env.ADMIN_EMAILS?.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return desdeEnv && desdeEnv.length > 0 ? desdeEnv : ADMIN_EMAILS_POR_DEFECTO;
}

// Protege todo lo que cuelga de /admin (cartera de clientes, alta de
// cliente, envío de prensa, y el panel de cualquier cliente visto como
// administrador). Sin sesión → a iniciar sesión. Con sesión pero sin ser
// una cuenta de administrador → a su propio panel de cliente, nunca a la
// cartera completa de otros negocios.
export async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const email = user.email?.toLowerCase() ?? "";
  if (!listaAdmins().includes(email)) redirect("/dashboard");

  return user;
}
