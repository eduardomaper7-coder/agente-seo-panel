"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

const TIPOS_PERMITIDOS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
const TAMANO_MAXIMO = 2 * 1024 * 1024; // 2 MB — de sobra para un logo

// Sube el logo de un negocio de la cartera (bucket público "logos-clientes")
// y guarda la URL en clientes.logo_url — desde ahí lo recoge
// lib/informes-datos.ts para incluirlo en la portada de su informe SEO
// mensual en PDF. Server Action independiente de la página que la llama, así
// que se comprueba aquí también que quien la invoca es un administrador
// (el layout de /admin protege la página, pero no llamadas directas a esto).
export async function subirLogoCliente(formData: FormData) {
  await requireAdmin();

  const clienteId = String(formData.get("clienteId") ?? "").trim();
  const archivo = formData.get("logo");

  if (!clienteId) throw new Error("Falta el cliente.");
  if (!(archivo instanceof File) || archivo.size === 0) {
    throw new Error("Selecciona un archivo de imagen para el logo.");
  }
  const extension = TIPOS_PERMITIDOS[archivo.type];
  if (!extension) {
    throw new Error("Formato no admitido — usa PNG, JPG o WebP.");
  }
  if (archivo.size > TAMANO_MAXIMO) {
    throw new Error("El archivo pesa demasiado — el logo no debería superar 2 MB.");
  }

  const supabase = createServiceClient();
  const ruta = `${clienteId}/logo.${extension}`;
  const bytes = Buffer.from(await archivo.arrayBuffer());

  const { error: errorSubida } = await supabase.storage
    .from("logos-clientes")
    .upload(ruta, bytes, { contentType: archivo.type, upsert: true });
  if (errorSubida) {
    throw new Error(`No se pudo subir el logo: ${errorSubida.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from("logos-clientes").getPublicUrl(ruta);
  // Cache-buster: la ruta es siempre la misma para un cliente (se
  // sobrescribe al volver a subir), así que sin esto un logo actualizado
  // podría seguir sirviéndose desde caché con la imagen anterior.
  const logoUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  const { error: errorGuardado } = await supabase
    .from("clientes")
    .update({ logo_url: logoUrl })
    .eq("id", clienteId);
  if (errorGuardado) {
    throw new Error(`No se pudo guardar el logo en el cliente: ${errorGuardado.message}`);
  }

  revalidatePath("/admin");
  redirect("/admin");
}
