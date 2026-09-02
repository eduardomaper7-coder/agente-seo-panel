# Agente SEO — panel (Fase 0)

Scaffold inicial del panel descrito en el documento de estrategia
("Agente SEO Autónomo"). Cubre el modelo de datos, el login, el panel
interno de la agencia (alta de clientes y control de envío de contenido a
prensa) y el panel del cliente. Construido con Next.js 14 (App Router),
Tailwind y Supabase (Postgres + Auth).

Es un punto de partida real, no una maqueta: las páginas leen y escriben en
Supabase de verdad en cuanto conectes las claves. Mientras tanto, cada
página muestra datos de ejemplo (Clínica Dalí Dent) para que puedas revisar
el diseño sin tener el proyecto de base de datos creado todavía.

## Estructura

```
supabase/schema.sql        → todo el modelo de datos + seguridad por fila (RLS)
app/login/                 → login único para agencia y clientes
app/admin/                 → panel interno (solo agencia)
  ├─ page.tsx                  listado de clientes
  ├─ clientes/nuevo/            alta de cliente nuevo
  └─ envio-prensa/               interruptor + blogs + tope diario de correos
app/dashboard/              → panel del cliente (protegido por RLS)
lib/supabase/                → clientes de Supabase (navegador, servidor, servicio)
```

## Cómo probarlo en local

```bash
npm install
cp .env.example .env.local   # y rellena las claves, ver checklist abajo
npm run dev
```

## Checklist — lo que necesito de ti para conectar todo esto a datos reales

Ahora mismo el código funciona con datos de ejemplo. Para que sea el
sistema real hace falta lo siguiente, en este orden:

### 1. Proyecto de Supabase
Crea un proyecto en [supabase.com](https://supabase.com) (capa gratuita).
Dentro del proyecto: **SQL Editor** → pega el contenido de
`supabase/schema.sql` → Run. Eso crea todas las tablas.
Luego, en **Project Settings → API**, copia estos tres valores a tu
`.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (la clave de servicio — no la compartas fuera del `.env.local`)

*Alternativa más cómoda:* si conectas el conector de Supabase en los
ajustes de Claude, puedo crear el proyecto y ejecutar el esquema yo mismo
sin que tengas que copiar y pegar nada.

### 2. Alta del primer usuario cliente (Dalí Dent)
En Supabase → **Authentication → Users → Add user**, crea un usuario con el
correo de contacto de la clínica y una contraseña provisional. Copia el
`user_id` generado y pégalo en la fila de `clientes.auth_user_id` para
Clínica Dalí Dent (o dímelo y lo hago yo con la clave de servicio).

### 3. Search Console API (lectura automática de posiciones) ✅ hecho
Ya está implementado (`lib/google-search-console.ts` + endpoint
`GET /api/gsc/actualizar-posiciones?secret=...`). Actualiza
`keywords.posicion_actual` con datos reales de Search Console para todos
los clientes con `sitios_web.gsc_property` configurada, comparando cada
keyword propia con las queries reales que devuelve Google. Requiere en
Vercel:
- `GOOGLE_SEARCH_CONSOLE_CLIENT_ID` / `GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET` — credenciales OAuth (Google Cloud Console → APIs y servicios → Credenciales, tipo "Aplicación web", con `https://developers.google.com/oauthplayground` como URI de redirección).
- `GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN` — generado una única vez en [OAuth Playground](https://developers.google.com/oauthplayground/) con el scope `https://www.googleapis.com/auth/webmasters.readonly`.
- `INTERNAL_CRON_SECRET` — string propio (ej. `openssl rand -hex 24`) para proteger el endpoint.

Para disparar la actualización a mano: visita
`https://agente-seo-panel.vercel.app/api/gsc/actualizar-posiciones?secret=TU_SECRETO`.
Cuando existan las Routines (punto pendiente más abajo), esta misma URL es
la que se llamará automáticamente cada semana.

### 4. Clave de PageSpeed Insights API
Desde el mismo proyecto de Google Cloud del punto 3: activar "PageSpeed
Insights API" → crear una clave de API → `GOOGLE_PAGESPEED_API_KEY`. Se usa
tanto para el objetivo técnico de Core Web Vitals como en el informe
mensual (punto 8).

### 5. Envío de correo desde contenidos.locales10@gmail.com
El código ya envía correo real por SMTP (`nodemailer`, en
`app/admin/envio-prensa/actions.ts`) — solo falta la credencial. Para que
el botón "Enviar" (y el modo automático) funcionen de verdad: activa la
verificación en dos pasos en esa cuenta de Gmail y genera una
**contraseña de aplicación** (Google Account → Seguridad → Contraseñas de
aplicaciones) → `GMAIL_OUTREACH_APP_PASSWORD`. Hasta entonces, al pulsar
"Enviar" verás un aviso claro pidiendo esa contraseña, en vez de un fallo
silencioso. El conteo del tope diario (`blog_envios`) ya funciona desde
ya, incluso antes de tener la contraseña.

### 6. Acceso al repositorio de Clínica Dalí Dent
Repo: `https://github.com/eduardomaper7-coder/clinicadali`. Genera un
**token de acceso de grano fino** (GitHub → Settings → Developer settings →
Fine-grained tokens) limitado únicamente a ese repositorio, con permisos
"Contents" y "Pull requests" en lectura/escritura → `GITHUB_TOKEN`. No hace
falta crear un repositorio nuevo, ya existe.

### 7. Informe mensual en PDF (Paso 4) ✅ hecho
Ya está implementado (`lib/informes-pdf.ts` + `lib/informes-datos.ts` +
endpoint `GET /api/informes/generar?secret=...`). Genera un PDF con marca de
Aibe Technologies (logo, `aibetech.es`, `info@aibetech.es`, `699 30 18 19`)
por cada cliente activo: evolución de posiciones (a partir de la nueva
tabla `posiciones_historial`, que el endpoint de Search Console rellena en
cada ejecución), competidores actuales por keyword, rendimiento técnico
(PageSpeed), tráfico real y enlace a mapas de calor (Yandex Metrika),
objetivos y tareas completadas ese mes. Sube el PDF al bucket público
`informes` de Supabase Storage y guarda la fila en la tabla `informes` (con
upsert, así se puede regenerar el mismo mes sin duplicar).

Parámetros opcionales en la URL: `?mes=2026-08` (por defecto el mes en
curso) y `?clienteId=<uuid>` (por defecto, todos los clientes activos).
Para disparar la generación a mano:
`https://agente-seo-panel.vercel.app/api/informes/generar?secret=TU_SECRETO`.

**Nota sobre mapas de calor:** la web ya tenía instalado Yandex Metrika
(gratis e ilimitado, con clickmap y grabación de sesiones activados) —no
hizo falta tocar el código de la web. El informe puede traer sus datos
automáticamente si añades `YANDEX_METRIKA_TOKEN` (ver `.env.example`);
mientras tanto, enlaza directamente al panel de Yandex.

### 8. Despliegue
Con todo lo anterior en marcha, el panel se despliega en Vercel (capa
gratuita) apuntando a un repositorio de GitHub que contenga este código —
necesitarás crear ese repo (distinto del de Dalí Dent: este es el del
sistema, no el de un cliente) y conectarlo en vercel.com. Si conectas el
conector de Vercel en Claude, puedo gestionar el despliegue directamente.

## Lo que este scaffold todavía NO hace (siguiente iteración)

- El envío de correo ya está implementado por SMTP (`nodemailer`); solo
  falta que `GMAIL_OUTREACH_APP_PASSWORD` esté configurada en Vercel para
  que salga de verdad (ver punto 5 del checklist).
- No hay tareas programadas (cron) conectadas al ciclo semanal/mensual del
  agente — se añaden como Routines una vez la base de datos esté viva. Los
  dos endpoints ya están listos para que una Routine los llame solos:
  `/api/gsc/actualizar-posiciones` (semanal) y `/api/informes/generar`
  (mensual).
- La sección "Trabajo realizado" del panel de cliente sigue vacía porque
  todavía no se ha ejecutado de verdad ninguna tarea de las ya definidas en
  Objetivos (contenido, técnico, menciones) — son planes, no trabajo hecho.
- El login no distingue todavía el rol "agencia" vs "cliente" a nivel de
  middleware (hoy cualquiera que inicie sesión puede visitar `/admin`); hay
  que añadir esa comprobación antes de dar acceso a un cliente real. (Nota:
  aceptado como riesgo temporal por decisión explícita, pendiente de
  revisar antes de dar de alta un segundo cliente real.)
