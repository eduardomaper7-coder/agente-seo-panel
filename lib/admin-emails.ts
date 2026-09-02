// Lista de correos de administrador compartida entre el guard de servidor
// (lib/admin-auth.ts, lo que de verdad protege /admin) y el formulario de
// login (solo para decidir a qué panel enviar tras entrar — puramente de
// navegación, no es lo que da o quita acceso).
export const ADMIN_EMAILS_POR_DEFECTO = ["aibe.technologies7@gmail.com", "info@aibetech.es"];

export function esCorreoAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS_POR_DEFECTO.includes(email.toLowerCase());
}
