-- ============================================================================
-- Agente SEO autónomo — esquema de base de datos (Supabase / Postgres)
-- Fase 0 · v1 · 23 agosto 2026
--
-- Cómo usarlo: pega este archivo entero en Supabase → SQL Editor → Run,
-- una vez tengas el proyecto creado. Crea tablas, relaciones, y activa
-- Row Level Security (RLS) para que cada cliente solo vea sus propios datos
-- cuando entre en el panel con su usuario y contraseña.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- CLIENTES
-- Cada fila es un negocio de la cartera (ej. Clínica Dalí Dent).
-- ---------------------------------------------------------------------------
create table clientes (
  id uuid primary key default gen_random_uuid(),
  nombre_negocio text not null,
  sector text,
  ubicacion text,
  contacto_nombre text,
  contacto_email text,
  -- vincula este cliente con su usuario de Supabase Auth para el login del panel
  auth_user_id uuid references auth.users(id),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- SITIOS WEB
-- Un cliente podría tener más de una web en el futuro, así que va aparte.
-- ---------------------------------------------------------------------------
create table sitios_web (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  dominio text not null,                          -- ej. dalident.es
  repo_url text,                                  -- ej. https://github.com/eduardomaper7-coder/clinicadali
  stack text,                                      -- 'nextjs' | 'html-estatico' | otros
  vercel_project text,
  gsc_property text,                              -- ej. sc-domain:dalident.es
  -- ID del contador de Yandex Metrika ya instalado en la web (mapas de
  -- calor, webvisor, clickmap) — gratis e ilimitado. Se usa para pedir
  -- tráfico/heatmaps reales vía su API en el informe mensual.
  yandex_metrika_counter_id integer,
  creado_en timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- KEYWORDS (Paso 1)
-- ---------------------------------------------------------------------------
create table keywords (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  termino text not null,
  volumen_busqueda integer,
  intencion text,                                 -- 'transaccional' | 'informacional' | 'local'
  relevancia_negocio smallint check (relevancia_negocio between 1 and 5),
  dificultad_estimada smallint check (dificultad_estimada between 1 and 5),
  prioridad numeric,                              -- puntuación calculada, se recalcula cada mes
  posicion_actual integer,                        -- último dato conocido de Search Console
  actualizado_en timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- COMPETIDORES (Paso 2)
-- ---------------------------------------------------------------------------
create table competidores (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  keyword_id uuid references keywords(id) on delete set null,
  dominio text not null,
  motivo_posicion text,                           -- por qué gana: contenido / enlaces / técnico / velocidad...
  huecos_detectados text,                         -- oportunidad concreta para superarlo
  ultima_revision timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- OBJETIVOS (motor de objetivos, sección 05)
-- ---------------------------------------------------------------------------
create table objetivos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  keyword_id uuid references keywords(id) on delete set null,
  pilar text not null check (pilar in ('contenido', 'menciones', 'tecnico')),
  descripcion text not null,
  posicion_objetivo integer,
  plazo date,
  estado text not null default 'activo' check (estado in ('activo', 'cumplido', 'revisado', 'pausado')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- TAREAS (ejecución semanal, Paso 3)
-- ---------------------------------------------------------------------------
create table tareas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  objetivo_id uuid references objetivos(id) on delete set null,
  pilar text not null check (pilar in ('contenido', 'menciones', 'tecnico')),
  descripcion text not null,
  resultado text,
  evidencia_url text,                             -- enlace al PR, captura, o mención publicada
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_progreso', 'completada', 'bloqueada')),
  semana date,                                     -- lunes de la semana a la que pertenece
  creado_en timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- POSICIONES_HISTORIAL
-- Un punto por keyword cada vez que corre el endpoint de Search Console —
-- permite dibujar la evolución real en el informe mensual, en vez de solo
-- la última foto fija que guarda keywords.posicion_actual.
-- ---------------------------------------------------------------------------
create table posiciones_historial (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  keyword_id uuid not null references keywords(id) on delete cascade,
  posicion integer,
  clics integer,
  impresiones integer,
  registrado_en timestamptz not null default now()
);

create index posiciones_historial_keyword_fecha
  on posiciones_historial (keyword_id, registrado_en desc);

-- ---------------------------------------------------------------------------
-- CONFIGURACIÓN
-- Ajustes globales del panel interno, clave-valor. Hoy solo guarda el
-- interruptor "Envío automático de contenido" de la sección 09, pero sirve
-- para cualquier ajuste futuro sin tener que migrar el esquema cada vez.
-- ---------------------------------------------------------------------------
create table configuracion (
  clave text primary key,
  valor jsonb not null,
  actualizado_en timestamptz not null default now()
);

insert into configuracion (clave, valor) values ('envio_automatico_prensa', 'false');

-- ---------------------------------------------------------------------------
-- CUENTAS REMITENTE (correo de outreach de prensa, sección 09)
-- ---------------------------------------------------------------------------
create table cuentas_remitente (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,                     -- ej. contenidos.locales10@gmail.com
  limite_diario integer not null default 5,
  activa boolean not null default true,
  creado_en timestamptz not null default now()
);

insert into cuentas_remitente (email, limite_diario) values ('contenidos.locales10@gmail.com', 5);

-- ---------------------------------------------------------------------------
-- BLOGS (artículos redactados para proponer a prensa, vía 3 de menciones)
-- ---------------------------------------------------------------------------
create table blogs (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  titulo text not null,
  contenido text not null,
  archivo_url text,                               -- PDF/Word descargable desde el panel
  estado text not null default 'borrador' check (estado in ('borrador', 'listo', 'enviado')),
  creado_en timestamptz not null default now()
);

-- Direcciones de contacto de prensa asociadas a un blog concreto
create table blog_destinatarios (
  id uuid primary key default gen_random_uuid(),
  blog_id uuid not null references blogs(id) on delete cascade,
  email text not null,
  medio text,                                     -- nombre del periódico/medio
  angulo_propuesto text,                          -- por qué le interesaría a este medio en concreto
  creado_en timestamptz not null default now()
);

-- Registro de cada envío real (manual o automático) — es lo que alimenta
-- el contador diario de la sección 09 y evita pasarse del límite.
create table blog_envios (
  id uuid primary key default gen_random_uuid(),
  blog_destinatario_id uuid not null references blog_destinatarios(id) on delete cascade,
  cuenta_remitente_id uuid not null references cuentas_remitente(id),
  modo text not null check (modo in ('manual', 'automatico')),
  enviado_en timestamptz not null default now(),
  resultado text default 'enviado' check (resultado in ('enviado', 'rebotado', 'error'))
);

-- ---------------------------------------------------------------------------
-- MENCIONES (vías 1, 2 y 4 de la sección 07 — red propia, directorios, otras)
-- ---------------------------------------------------------------------------
create table menciones (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  origen text not null check (origen in ('red_propia', 'directorio', 'prensa', 'otra')),
  descripcion text,
  url_publicada text,
  estado text not null default 'propuesta' check (estado in ('propuesta', 'en_progreso', 'publicada', 'descartada')),
  creado_en timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- INFORMES (Paso 4, mensual)
-- ---------------------------------------------------------------------------
create table informes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  mes date not null,                              -- primer día del mes que cubre
  pdf_url text,
  resumen_metricas jsonb,                          -- snapshot: posiciones, clics, impresiones, CWV
  resumen_trabajo jsonb,                           -- lista de tareas/menciones completadas ese mes
  creado_en timestamptz not null default now(),
  unique (cliente_id, mes)
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- Cada cliente, autenticado con su usuario de Supabase, solo ve sus propias
-- filas. El equipo de la agencia usa un rol de servicio (service_role) que
-- se salta RLS por completo — así el agente y el panel interno ven todo.
-- ============================================================================

alter table clientes enable row level security;
alter table sitios_web enable row level security;
alter table keywords enable row level security;
alter table competidores enable row level security;
alter table objetivos enable row level security;
alter table tareas enable row level security;
alter table menciones enable row level security;
alter table informes enable row level security;
alter table posiciones_historial enable row level security;

create policy "cliente ve su propia ficha"
  on clientes for select
  using (auth_user_id = auth.uid());

create policy "cliente ve sus sitios"
  on sitios_web for select
  using (cliente_id in (select id from clientes where auth_user_id = auth.uid()));

create policy "cliente ve sus keywords"
  on keywords for select
  using (cliente_id in (select id from clientes where auth_user_id = auth.uid()));

create policy "cliente ve sus competidores"
  on competidores for select
  using (cliente_id in (select id from clientes where auth_user_id = auth.uid()));

create policy "cliente ve sus objetivos"
  on objetivos for select
  using (cliente_id in (select id from clientes where auth_user_id = auth.uid()));

create policy "cliente ve sus tareas"
  on tareas for select
  using (cliente_id in (select id from clientes where auth_user_id = auth.uid()));

create policy "cliente ve sus menciones"
  on menciones for select
  using (cliente_id in (select id from clientes where auth_user_id = auth.uid()));

create policy "cliente ve sus informes"
  on informes for select
  using (cliente_id in (select id from clientes where auth_user_id = auth.uid()));

create policy "cliente ve su propio historial de posiciones"
  on posiciones_historial for select
  using (cliente_id in (select id from clientes where auth_user_id = auth.uid()));

-- blogs, blog_destinatarios, blog_envios y cuentas_remitente NO llevan RLS de
-- cliente a propósito: son control interno de la agencia (sección 09), nunca
-- visibles en el panel del cliente. Solo se leen con el rol de servicio.

-- ---------------------------------------------------------------------------
-- STORAGE
-- Bucket público para los PDF de los informes mensuales (lectura pública
-- directa por URL; solo el rol de servicio puede subir archivos).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('informes', 'informes', true)
on conflict (id) do nothing;

-- Bucket público para los borradores de contenido que redacta el agente de
-- forma autónoma (Routine semanal, pilar "contenido") — Eduardo los revisa
-- aquí antes de que se conviertan en una página real de la web del cliente.
insert into storage.buckets (id, name, public)
values ('borradores', 'borradores', true)
on conflict (id) do nothing;
