"use client";

import { useState } from "react";
import { Eye, EyeOff, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { esCorreoAdmin } from "@/lib/admin-emails";
import { AibeLogo } from "@/components/ui/AibeLogo";

// Un único formulario de login sirve para las dos audiencias del sistema
// (equipo interno y clientes): Supabase Auth decide a dónde redirigir según
// el rol del usuario que ha iniciado sesión (ver lib/supabase y la tabla
// `clientes.auth_user_id` en supabase/schema.sql).
//
// El registro solo crea la cuenta de Supabase Auth (email + contraseña) —
// no crea ninguna fila en `clientes` ni la vincula a ningún negocio. Hasta
// que el equipo de AIBE enlace esa cuenta a un cliente (auth_user_id) desde
// el panel interno, quien se registre solo verá los datos de ejemplo al
// entrar, nunca los de otro negocio real, gracias a RLS.
export default function LoginPage() {
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function cambiarModo(nuevo: "login" | "registro") {
    setModo(nuevo);
    setError(null);
    setAviso(null);
    setPassword("");
    setConfirmarPassword("");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (authError) {
      setError("Correo o contraseña incorrectos.");
      return;
    }
    // Las cuentas del equipo de Aibe Technologies entran directamente a la
    // cartera de clientes; el resto, a su propio panel.
    window.location.href = esCorreoAdmin(email) ? "/admin" : "/dashboard";
  }

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAviso(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (authError) {
      setError(
        authError.message.toLowerCase().includes("already registered") ||
          authError.message.toLowerCase().includes("already exists")
          ? "Ya existe una cuenta con este correo. Prueba a iniciar sesión."
          : `No se pudo crear la cuenta: ${authError.message}`
      );
      return;
    }

    if (data.session) {
      // La confirmación por correo está desactivada en este proyecto de
      // Supabase (o no hace falta) — ya hay sesión, se entra directamente.
      window.location.href = "/dashboard";
      return;
    }

    // Confirmación por correo activada: hay cuenta pero todavía no sesión.
    setAviso(
      "Cuenta creada. Revisa tu correo para confirmar la cuenta y, después, inicia sesión. Hasta que el equipo de AIBE Technologies vincule tu cuenta a tu negocio, no verás tus datos reales en el panel."
    );
    cambiarModo("login");
    setPassword("");
  }

  const esLogin = modo === "login";

  return (
    <main className="flex min-h-screen">
      {/* Zona de marca — oculta en móvil, 55% en escritorio */}
      <div className="relative hidden overflow-hidden bg-ink lg:flex lg:w-[55%] lg:flex-col lg:justify-between lg:px-14 lg:py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-accent/25 blur-3xl"
          aria-hidden
        />

        <AibeLogo size={24} dark />

        <div className="relative max-w-md">
          <h1 className="text-[2.15rem] font-semibold leading-[1.15] text-white text-balance">
            Tu posicionamiento en Google, claro y bajo control.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/60">
            Consulta la evolución de tus palabras clave, competidores y acciones SEO desde un único lugar.
          </p>

          {/* Visualización abstracta de evolución/ranking */}
          <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.04] p-5">
            <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-white/50">
              <TrendingUp size={13} />
              Evolución de posicionamiento
            </div>
            <svg viewBox="0 0 260 80" className="w-full">
              <polyline
                points="0,64 40,52 80,58 120,36 160,40 200,18 260,10"
                fill="none"
                stroke="#124FC4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {[
                [0, 64],
                [40, 52],
                [80, 58],
                [120, 36],
                [160, 40],
                [200, 18],
                [260, 10],
              ].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={2.5} fill="#124FC4" />
              ))}
            </svg>
          </div>
        </div>

        <p className="relative text-xs text-white/30">© {new Date().getFullYear()} Aibe Technologies</p>
      </div>

      {/* Zona de acceso */}
      <div className="flex flex-1 flex-col items-center justify-center bg-paper px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <AibeLogo size={22} />
          </div>

          <div className="rounded-aibe border border-ink/10 bg-white p-7 shadow-aibe-md sm:p-8">
            <h2 className="mb-1 text-lg font-semibold text-ink">
              {esLogin ? "Accede a tu panel" : "Crear una cuenta"}
            </h2>
            <p className="mb-6 text-sm text-ink/50">
              {esLogin
                ? "Introduce tus datos para ver tu posicionamiento."
                : "El equipo de Aibe Technologies vinculará tu cuenta a tu negocio."}
            </p>

            {aviso && (
              <div className="mb-5 rounded-md border border-accent/25 bg-accent/[0.06] px-3.5 py-2.5 text-sm text-accent">
                {aviso}
              </div>
            )}

            <form onSubmit={esLogin ? handleLogin : handleRegistro} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/70" htmlFor="email">
                  Correo
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-ink/15 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/70" htmlFor="password">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={verPassword ? "text" : "password"}
                    required
                    autoComplete={esLogin ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border border-ink/15 px-3.5 py-2.5 pr-10 text-sm text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                  />
                  <button
                    type="button"
                    onClick={() => setVerPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/35 hover:text-ink/60"
                    aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    tabIndex={-1}
                  >
                    {verPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {!esLogin && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink/70" htmlFor="confirmarPassword">
                    Confirmar contraseña
                  </label>
                  <input
                    id="confirmarPassword"
                    type={verPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    className="w-full rounded-md border border-ink/15 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                  />
                </div>
              )}

              {error && (
                <p className="rounded-md bg-danger/[0.06] px-3 py-2 text-sm text-danger">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-accent px-3 py-2.5 text-sm font-medium text-white shadow-aibe transition-colors hover:bg-accent/90 disabled:opacity-60"
              >
                {loading
                  ? esLogin
                    ? "Entrando…"
                    : "Creando cuenta…"
                  : esLogin
                    ? "Entrar"
                    : "Registrarse"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-ink/45">
              {esLogin ? (
                <>
                  ¿No tienes cuenta?{" "}
                  <button type="button" onClick={() => cambiarModo("registro")} className="font-medium text-accent hover:underline">
                    Regístrate
                  </button>
                </>
              ) : (
                <>
                  ¿Ya tienes cuenta?{" "}
                  <button type="button" onClick={() => cambiarModo("login")} className="font-medium text-accent hover:underline">
                    Inicia sesión
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
