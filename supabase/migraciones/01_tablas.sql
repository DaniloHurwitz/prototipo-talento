-- 01_tablas.sql · Cursada
-- Crea tipos, tablas, índices y datos iniciales. No da permisos todavía (eso es 02).

-- A. Esquema privado para funciones internas (la API pública no lo expone)
create schema if not exists privado;

-- B. Tipos con los valores permitidos de cada estado
create type public.estado_revision    as enum ('pendiente', 'aprobado', 'rechazado');
create type public.estado_oferta      as enum ('publicada', 'pausada', 'cerrada');
create type public.estado_postulacion as enum ('enviada', 'vista', 'entrevista', 'contratada', 'descartada');
create type public.origen_postulacion as enum ('postulacion', 'invitacion');
create type public.estado_contrato    as enum ('activo', 'finalizado');
create type public.motivo_connects    as enum ('alta', 'postulacion', 'compra', 'ajuste');
create type public.tipo_pago          as enum ('connects', 'comision');
create type public.proveedor_pago     as enum ('mercadopago', 'paypal');
create type public.estado_pago        as enum ('pendiente', 'aprobado', 'rechazado');

-- C. Configuración: una sola fila con los valores que edita el admin
create table public.configuracion (
  id                      boolean primary key default true check (id),
  comision_pct            numeric(5,2) not null default 10  check (comision_pct between 0 and 50),
  connects_iniciales      integer      not null default 20  check (connects_iniciales between 0 and 200),
  costo_postulacion       integer      not null default 2   check (costo_postulacion between 0 and 50),
  costo_postulacion_alta  integer      not null default 4   check (costo_postulacion_alta between 0 and 50),
  umbral_tarifa_alta_usd  numeric(8,2) not null default 13  check (umbral_tarifa_alta_usd > 0),
  updated_at              timestamptz  not null default now()
);
insert into public.configuracion default values;

-- D. Estudiantes: perfil público. Estado y Connects solo cambian por funciones (ver 02 y 03)
create table public.estudiantes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references auth.users(id) on delete cascade,
  nombre          text not null check (char_length(nombre) between 2 and 80),
  universidad     text not null check (char_length(universidad) between 2 and 120),
  carrera         text not null check (char_length(carrera) between 2 and 120),
  anio            smallint not null check (anio between 1 and 8),
  area            text not null check (char_length(area) between 2 and 60),
  idiomas         jsonb not null default '[]'::jsonb check (jsonb_typeof(idiomas) = 'array'),
  habilidades     text[] not null default '{}',
  horas_semana    smallint not null check (horas_semana between 1 and 40),
  tarifa_usd      numeric(6,2) not null check (tarifa_usd > 0 and tarifa_usd <= 200),
  bio             text not null default '' check (char_length(bio) <= 1200),
  estado          public.estado_revision not null default 'pendiente',
  motivo_rechazo  text,
  revisado_at     timestamptz,
  connects        integer not null default 0 check (connects >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on public.estudiantes (estado);

-- E. Empresas: sin datos personales del contacto (el mail queda en auth.users)
create table public.empresas (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references auth.users(id) on delete cascade,
  nombre          text not null check (char_length(nombre) between 2 and 120),
  pais            text not null check (char_length(pais) between 2 and 60),
  sitio_web       text check (sitio_web is null or sitio_web ~* '^https?://'),
  descripcion     text not null default '' check (char_length(descripcion) <= 1500),
  estado          public.estado_revision not null default 'pendiente',
  motivo_rechazo  text,
  revisado_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on public.empresas (estado);

-- F. Ofertas
create table public.ofertas (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references public.empresas(id) on delete cascade,
  titulo        text not null check (char_length(titulo) between 5 and 120),
  descripcion   text not null check (char_length(descripcion) between 20 and 4000),
  area          text not null check (char_length(area) between 2 and 60),
  idiomas       jsonb not null default '[]'::jsonb check (jsonb_typeof(idiomas) = 'array'),
  horas_semana  smallint not null check (horas_semana between 1 and 40),
  tarifa_usd    numeric(6,2) not null check (tarifa_usd > 0 and tarifa_usd <= 200),
  estado        public.estado_oferta not null default 'publicada',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on public.ofertas (empresa_id);
create index on public.ofertas (estado);

-- G. Postulaciones e invitaciones (una por estudiante y oferta)
create table public.postulaciones (
  id                uuid primary key default gen_random_uuid(),
  oferta_id         uuid not null references public.ofertas(id) on delete cascade,
  estudiante_id     uuid not null references public.estudiantes(id) on delete cascade,
  mensaje           text not null default '' check (char_length(mensaje) <= 2000),
  tarifa_propuesta  numeric(6,2) check (tarifa_propuesta is null or (tarifa_propuesta > 0 and tarifa_propuesta <= 200)),
  origen            public.origen_postulacion not null default 'postulacion',
  estado            public.estado_postulacion not null default 'enviada',
  connects_gastados integer not null default 0 check (connects_gastados >= 0),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (oferta_id, estudiante_id)
);
create index on public.postulaciones (estudiante_id);

-- H. Contratos (la comisión se congela al contratar)
create table public.contratos (
  id              uuid primary key default gen_random_uuid(),
  postulacion_id  uuid not null unique references public.postulaciones(id) on delete restrict,
  oferta_id       uuid not null references public.ofertas(id) on delete restrict,
  estudiante_id   uuid not null references public.estudiantes(id) on delete restrict,
  empresa_id      uuid not null references public.empresas(id) on delete restrict,
  tarifa_usd      numeric(6,2) not null check (tarifa_usd > 0),
  horas_mes       integer not null default 0 check (horas_mes between 0 and 200),
  comision_pct    numeric(5,2) not null check (comision_pct between 0 and 50),
  fecha_inicio    date not null default current_date,
  estado          public.estado_contrato not null default 'activo',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on public.contratos (estudiante_id);
create index on public.contratos (empresa_id);

-- I. Movimientos de Connects (registro de cada suma y resta)
create table public.connects_transacciones (
  id             bigint generated always as identity primary key,
  estudiante_id  uuid not null references public.estudiantes(id) on delete cascade,
  cantidad       integer not null check (cantidad <> 0),
  motivo         public.motivo_connects not null,
  referencia     uuid,
  created_at     timestamptz not null default now()
);
create index on public.connects_transacciones (estudiante_id);

-- J. Paquetes de Connects (precios provisorios: USD 1,5 / 4 / 9 a ARS 1.570, redondeados)
create table public.paquetes_connects (
  id          text primary key,
  cantidad    integer not null check (cantidad > 0),
  precio_ars  numeric(12,2) not null check (precio_ars > 0),
  activo      boolean not null default true
);
insert into public.paquetes_connects (id, cantidad, precio_ars) values
  ('p10', 10,  2400),
  ('p30', 30,  6300),
  ('p80', 80, 14000);

-- K. Pagos (Mercado Pago y PayPal). external_id único = un pago no se acredita dos veces
create table public.pagos (
  id              uuid primary key default gen_random_uuid(),
  tipo            public.tipo_pago not null,
  proveedor       public.proveedor_pago not null,
  estudiante_id   uuid references public.estudiantes(id) on delete restrict,
  empresa_id      uuid references public.empresas(id) on delete restrict,
  contrato_id     uuid references public.contratos(id) on delete restrict,
  paquete_id      text references public.paquetes_connects(id),
  monto           numeric(12,2) not null check (monto > 0),
  moneda          text not null check (moneda in ('ARS', 'USD')),
  estado          public.estado_pago not null default 'pendiente',
  preferencia_id  text,
  external_id     text unique,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (
    (tipo = 'connects' and estudiante_id is not null and paquete_id is not null)
    or (tipo = 'comision' and empresa_id is not null and contrato_id is not null)
  )
);
create index on public.pagos (estudiante_id);
create index on public.pagos (empresa_id);

-- L. updated_at automático
create function privado.tocar_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger t_upd before update on public.configuracion for each row execute function privado.tocar_updated_at();
create trigger t_upd before update on public.estudiantes   for each row execute function privado.tocar_updated_at();
create trigger t_upd before update on public.empresas      for each row execute function privado.tocar_updated_at();
create trigger t_upd before update on public.ofertas       for each row execute function privado.tocar_updated_at();
create trigger t_upd before update on public.postulaciones for each row execute function privado.tocar_updated_at();
create trigger t_upd before update on public.contratos     for each row execute function privado.tocar_updated_at();
create trigger t_upd before update on public.pagos         for each row execute function privado.tocar_updated_at();
