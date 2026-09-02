"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Alta de nuevo cliente (sección 09): en cuanto se guarda, el agente arranca
// el Paso 1 para este cliente en el siguiente ciclo programado — no requiere
// ninguna acción adicional del equipo.
export async function crearCliente(formData: FormData) {
  const supabase = createServiceClient();

  const nombre_negocio = String(formData.get("nombre_negocio") ?? "").trim();
  const sector = String(formData.get("sector") ?? "").trim();
  const ubicacion = String(formData.get("ubicacion") ?? "").trim();
  const dominio = String(formData.get("dominio") ?? "").trim();
  const repo_url = String(formData.get("repo_url") ?? "").trim();
  const gsc_property = String(formData.get("gsc_property") ?? "").trim();

  const { data: cliente, error } = await supabase
    .from("clientes")
    .insert({ nombre_negocio, sector, ubicacion })
    .select()
    .single();

  if (error) {
    throw new Error(`No se pudo crear el cliente: ${error.message}`);
  }

  if (dominio) {
    await supabase.from("sitios_web").insert({
      cliente_id: cliente.id,
      dominio,
      repo_url: repo_url || null,
      gsc_property: gsc_property || null,
    });
  }

  redirect("/admin");
}
