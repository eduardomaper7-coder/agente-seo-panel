"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";

export async function setEnvioAutomatico(activo: boolean) {
  const supabase = createServiceClient();
  await supabase
    .from("configuracion")
    .update({ valor: activo, actualizado_en: new Date().toISOString() })
    .eq("clave", "envio_automatico_prensa");
  revalidatePath("/admin/envio-prensa");
}

// Envío manual de un blog a una dirección concreta (botón "Enviar" cuando el
// interruptor está desactivado). Comprueba el tope diario de la cuenta
// remitente ANTES de enviar — es la misma comprobación que usará el agente
// cuando el envío sea automático, para que el límite se respete siempre.
export async function enviarManual(destinatarioId: string, cuentaRemitenteId: string) {
  const supabase = createServiceClient();

  const { data: cuenta } = await supabase
    .from("cuentas_remitente")
    .select("id, email, limite_diario")
    .eq("id", cuentaRemitenteId)
    .single();

  if (!cuenta) throw new Error("Cuenta remitente no encontrada.");

  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("blog_envios")
    .select("id", { count: "exact", head: true })
    .eq("cuenta_remitente_id", cuentaRemitenteId)
    .gte("enviado_en", inicioHoy.toISOString());

  if ((count ?? 0) >= cuenta.limite_diario) {
    throw new Error(
      `Límite diario alcanzado (${cuenta.limite_diario}/${cuenta.limite_diario}) para ${cuenta.email}. Se podrá enviar de nuevo mañana.`
    );
  }

  const { data: destinatario } = await supabase
    .from("blog_destinatarios")
    .select("id, email, medio, blogs(titulo, contenido)")
    .eq("id", destinatarioId)
    .single();

  if (!destinatario) throw new Error("Destinatario no encontrado.");

  const appPassword = process.env.GMAIL_OUTREACH_APP_PASSWORD;
  if (!appPassword) {
    throw new Error(
      "El envío real de correo todavía no está configurado: falta la contraseña de aplicación de Gmail (GMAIL_OUTREACH_APP_PASSWORD). Pide a Claude que te guíe para generarla en la cuenta contenidos.locales10@gmail.com."
    );
  }

  const blog = Array.isArray(destinatario.blogs) ? destinatario.blogs[0] : destinatario.blogs;
  let resultado: "enviado" | "error" = "enviado";

  try {
    // SMTP de Gmail con contraseña de aplicación — funciona en cuanto la
    // cuenta contenidos.locales10@gmail.com tenga la verificación en dos
    // pasos activada y se genere la contraseña de aplicación (ver README).
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: cuenta.email, pass: appPassword },
    });

    await transporter.sendMail({
      from: cuenta.email,
      to: destinatario.email,
      subject: blog?.titulo ?? "Propuesta de contenido",
      text: blog?.contenido ?? "",
    });
  } catch (err) {
    resultado = "error";
    await supabase.from("blog_envios").insert({
      blog_destinatario_id: destinatarioId,
      cuenta_remitente_id: cuentaRemitenteId,
      modo: "manual",
      resultado,
    });
    revalidatePath("/admin/envio-prensa");
    throw new Error(
      `No se pudo enviar el correo a ${destinatario.email}: ${(err as Error).message}`
    );
  }

  await supabase.from("blog_envios").insert({
    blog_destinatario_id: destinatarioId,
    cuenta_remitente_id: cuentaRemitenteId,
    modo: "manual",
    resultado,
  });

  revalidatePath("/admin/envio-prensa");
}
