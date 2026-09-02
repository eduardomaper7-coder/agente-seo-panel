"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Cierre de sesión con el método estándar de Supabase Auth — no toca la
// lógica de autenticación existente, solo añade el botón que faltaba.
export function SignOutButton({ className = "" }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className={`inline-flex items-center gap-2 text-sm text-ink/50 transition-colors hover:text-danger disabled:opacity-50 ${className}`}
    >
      <LogOut size={15} strokeWidth={2} />
      {loading ? "Saliendo…" : "Cerrar sesión"}
    </button>
  );
}
