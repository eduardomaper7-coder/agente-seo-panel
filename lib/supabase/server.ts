// Cliente de Supabase para Server Components y rutas del panel interno.
// Usa la clave anónima + la sesión del usuario que ha iniciado sesión;
// respeta las políticas de RLS definidas en supabase/schema.sql.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

// Cliente con la clave de servicio: se salta RLS. Solo se usa en rutas
// internas de la agencia (panel interno, tareas del agente) y NUNCA se
// expone al navegador ni al panel del cliente.
export function createServiceClient() {
  const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
