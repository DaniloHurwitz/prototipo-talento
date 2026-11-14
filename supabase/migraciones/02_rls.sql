-- 02_rls.sql · Cursada
-- Quién puede ver y tocar qué. Regla general: nadie tiene acceso salvo lo que se habilita acá.

-- A. Funciones de ayuda (en "privado": las usan las políticas, no se pueden llamar desde la app)
--    SECURITY DEFINER evita que las políticas se llamen entre sí en bucle.
create function privado.es_admin() returns boolean
language sql stable set search_path = '' as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

create function privado.mi_estudiante_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.estudiantes where user_id = auth.uid()
$$;

create function privado.mi_empresa_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.empresas where user_id = auth.uid()
$$;

create function privado.soy_empresa_aprobada() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.empresas where user_id = auth.uid() and estado = 'aprobado')
$$;

create function privado.empresa_aprobada(p_empresa uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.empresas where id = p_empresa and estado = 'aprobado')
$$;

create function privado.estudiante_aprobado(p_estudiante uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.estudiantes where id = p_estudiante and estado = 'aprobado')
$$;

create function privado.oferta_es_mia(p_oferta uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.ofertas o join public.empresas e on e.id = o.empresa_id
    where o.id = p_oferta and e.user_id = auth.uid()
  )
$$;

create function privado.me_postule(p_oferta uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.postulaciones p join public.estudiantes s on s.id = p.estudiante_id
    where p.oferta_id = p_oferta and s.user_id = auth.uid()
  )
$$;

revoke all on all functions in schema privado from public;
grant usage on schema privado to anon, authenticated;
grant execute on function privado.es_admin(), privado.mi_estudiante_id(), privado.mi_empresa_id(),
  privado.soy_empresa_aprobada(), privado.empresa_aprobada(uuid), privado.estudiante_aprobado(uuid),
  privado.oferta_es_mia(uuid), privado.me_postule(uuid) to anon, authenticated;

-- B. Sacar los permisos que Supabase da por defecto y dar solo los necesarios
revoke all on all tables in schema public from anon, authenticated;

-- Estudiantes: leer (filtrado por política) y editar SOLO columnas del perfil
grant select on public.estudiantes to authenticated;
grant update (nombre, universidad, carrera, anio, area, idiomas, habilidades, horas_semana, tarifa_usd, bio)
  on public.estudiantes to authenticated;

-- Empresas: idem. Visitantes sin cuenta ven solo nombre y país (para la landing)
grant select on public.empresas to authenticated;
grant update (nombre, pais, sitio_web, descripcion) on public.empresas to authenticated;
grant select (id, nombre, pais) on public.empresas to anon;

-- Ofertas: la empresa crea y edita; visitantes sin cuenta ven las publicadas (landing)
grant select on public.ofertas to anon, authenticated;
grant insert (empresa_id, titulo, descripcion, area, idiomas, horas_semana, tarifa_usd, estado)
  on public.ofertas to authenticated;
grant update (titulo, descripcion, area, idiomas, horas_semana, tarifa_usd, estado)
  on public.ofertas to authenticated;

-- Postulaciones, movimientos y pagos: solo lectura (se escriben con funciones)
grant select on public.postulaciones, public.connects_transacciones, public.pagos to authenticated;

-- Contratos: lectura; el admin carga horas y estado
grant select on public.contratos to authenticated;
grant update (horas_mes, estado) on public.contratos to authenticated;

-- Configuración y paquetes: lectura; el admin edita
grant select on public.configuracion, public.paquetes_connects to authenticated;
grant update (comision_pct, connects_iniciales, costo_postulacion, costo_postulacion_alta, umbral_tarifa_alta_usd)
  on public.configuracion to authenticated;
grant update (precio_ars, activo) on public.paquetes_connects to authenticated;

-- C. Activar RLS en todas las tablas
alter table public.configuracion          enable row level security;
alter table public.estudiantes            enable row level security;
alter table public.empresas               enable row level security;
alter table public.ofertas                enable row level security;
alter table public.postulaciones          enable row level security;
alter table public.contratos              enable row level security;
alter table public.connects_transacciones enable row level security;
alter table public.paquetes_connects      enable row level security;
alter table public.pagos                  enable row level security;

-- D. Políticas

-- Estudiantes
create policy est_ver on public.estudiantes for select to authenticated using (
  user_id = (select auth.uid())
  or (select privado.es_admin())
  or (estado = 'aprobado' and (select privado.soy_empresa_aprobada()))
);
create policy est_editar on public.estudiantes for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Empresas
create policy emp_ver on public.empresas for select to authenticated using (
  user_id = (select auth.uid())
  or (select privado.es_admin())
  or (estado = 'aprobado' and (select privado.mi_estudiante_id()) is not null)
);
create policy emp_ver_publico on public.empresas for select to anon using (estado = 'aprobado');
create policy emp_editar on public.empresas for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Ofertas
create policy of_ver on public.ofertas for select to authenticated using (
  (select privado.es_admin())
  or empresa_id = (select privado.mi_empresa_id())
  or (
    (select privado.mi_estudiante_id()) is not null
    and (
      (estado = 'publicada' and privado.empresa_aprobada(empresa_id))
      or privado.me_postule(id)
    )
  )
);
create policy of_ver_publico on public.ofertas for select to anon
  using (estado = 'publicada' and privado.empresa_aprobada(empresa_id));
create policy of_crear on public.ofertas for insert to authenticated
  with check ((select auth.uid()) is not null and empresa_id = (select privado.mi_empresa_id()));
create policy of_editar on public.ofertas for update to authenticated
  using (empresa_id = (select privado.mi_empresa_id()))
  with check (empresa_id = (select privado.mi_empresa_id()));

-- Postulaciones
create policy pos_ver on public.postulaciones for select to authenticated using (
  (select privado.es_admin())
  or estudiante_id = (select privado.mi_estudiante_id())
  or (privado.oferta_es_mia(oferta_id) and privado.estudiante_aprobado(estudiante_id))
);

-- Contratos
create policy con_ver on public.contratos for select to authenticated using (
  (select privado.es_admin())
  or estudiante_id = (select privado.mi_estudiante_id())
  or empresa_id = (select privado.mi_empresa_id())
);
create policy con_admin_editar on public.contratos for update to authenticated
  using ((select privado.es_admin()))
  with check ((select privado.es_admin()));

-- Movimientos de Connects
create policy ct_ver on public.connects_transacciones for select to authenticated using (
  (select privado.es_admin()) or estudiante_id = (select privado.mi_estudiante_id())
);

-- Pagos
create policy pag_ver on public.pagos for select to authenticated using (
  (select privado.es_admin())
  or estudiante_id = (select privado.mi_estudiante_id())
  or empresa_id = (select privado.mi_empresa_id())
);

-- Configuración
create policy cfg_ver on public.configuracion for select to authenticated using ((select auth.uid()) is not null);
create policy cfg_admin on public.configuracion for update to authenticated
  using ((select privado.es_admin()))
  with check ((select privado.es_admin()));

-- Paquetes
create policy paq_ver on public.paquetes_connects for select to authenticated
  using ((select auth.uid()) is not null and (activo or (select privado.es_admin())));
create policy paq_admin on public.paquetes_connects for update to authenticated
  using ((select privado.es_admin()))
  with check ((select privado.es_admin()));
