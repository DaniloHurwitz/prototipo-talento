-- 03_funciones.sql · Cursada
-- Las acciones que cambian estado, Connects o dinero. Cada una verifica quién la llama.

-- A. Registro de estudiante: perfil pendiente + Connects iniciales + movimiento "alta"
create function public.registrar_estudiante(
  p_nombre text, p_universidad text, p_carrera text, p_anio smallint, p_area text,
  p_idiomas jsonb, p_habilidades text[], p_horas_semana smallint, p_tarifa_usd numeric, p_bio text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_iniciales integer;
begin
  if v_uid is null then raise exception 'Tenés que iniciar sesión.'; end if;
  if exists (select 1 from public.empresas where user_id = v_uid) then
    raise exception 'Esta cuenta ya está registrada como empresa.';
  end if;
  if exists (select 1 from public.estudiantes where user_id = v_uid) then
    raise exception 'Ya tenés un perfil de estudiante.';
  end if;

  select connects_iniciales into v_iniciales from public.configuracion;

  insert into public.estudiantes
    (user_id, nombre, universidad, carrera, anio, area, idiomas, habilidades, horas_semana, tarifa_usd, bio, connects)
  values
    (v_uid, trim(p_nombre), trim(p_universidad), trim(p_carrera), p_anio, p_area,
     coalesce(p_idiomas, '[]'::jsonb), coalesce(p_habilidades, '{}'), p_horas_semana, p_tarifa_usd,
     coalesce(trim(p_bio), ''), v_iniciales)
  returning id into v_id;

  if v_iniciales > 0 then
    insert into public.connects_transacciones (estudiante_id, cantidad, motivo)
    values (v_id, v_iniciales, 'alta');
  end if;
  return v_id;
end $$;

-- B. Registro de empresa: queda pendiente
create function public.registrar_empresa(
  p_nombre text, p_pais text, p_sitio_web text, p_descripcion text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then raise exception 'Tenés que iniciar sesión.'; end if;
  if exists (select 1 from public.estudiantes where user_id = v_uid) then
    raise exception 'Esta cuenta ya está registrada como estudiante.';
  end if;
  if exists (select 1 from public.empresas where user_id = v_uid) then
    raise exception 'Ya tenés un perfil de empresa.';
  end if;

  insert into public.empresas (user_id, nombre, pais, sitio_web, descripcion)
  values (v_uid, trim(p_nombre), trim(p_pais), nullif(trim(p_sitio_web), ''), coalesce(trim(p_descripcion), ''))
  returning id into v_id;
  return v_id;
end $$;

-- C. Descontar Connects (interna: la app no la puede llamar)
--    Un solo UPDATE con la condición de saldo: dos postulaciones simultáneas no pueden dejarlo negativo.
create function privado.descontar_connects(p_estudiante uuid, p_cantidad integer, p_referencia uuid)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_cantidad <= 0 then return; end if;
  update public.estudiantes
     set connects = connects - p_cantidad
   where id = p_estudiante and connects >= p_cantidad;
  if not found then
    raise exception 'No tenés suficientes Connects. Comprá más para postularte.'
      using errcode = 'P0001', hint = 'connects_insuficientes';
  end if;
  insert into public.connects_transacciones (estudiante_id, cantidad, motivo, referencia)
  values (p_estudiante, -p_cantidad, 'postulacion', p_referencia);
end $$;

-- D. Postularse: valida, crea la postulación y cobra Connects en la misma operación
--    Si falta saldo, se deshace todo (no queda postulación a medias).
create function public.postularse(p_oferta uuid, p_mensaje text, p_tarifa_propuesta numeric default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_est public.estudiantes;
  v_of public.ofertas;
  v_cfg public.configuracion;
  v_costo integer;
  v_id uuid;
begin
  select * into v_est from public.estudiantes where user_id = auth.uid();
  if v_est.id is null then raise exception 'Necesitás un perfil de estudiante para postularte.'; end if;
  if v_est.estado = 'rechazado' then raise exception 'Tu perfil fue rechazado; no podés postularte.'; end if;

  select * into v_of from public.ofertas where id = p_oferta;
  if v_of.id is null or v_of.estado <> 'publicada' or not privado.empresa_aprobada(v_of.empresa_id) then
    raise exception 'Esta oferta ya no está disponible.';
  end if;

  if exists (select 1 from public.postulaciones where oferta_id = p_oferta and estudiante_id = v_est.id) then
    raise exception 'Ya te postulaste a esta oferta.';
  end if;

  if char_length(coalesce(trim(p_mensaje), '')) < 20 then
    raise exception 'Escribí un mensaje de al menos 20 caracteres.';
  end if;

  select * into v_cfg from public.configuracion;
  v_costo := case when v_of.tarifa_usd >= v_cfg.umbral_tarifa_alta_usd
                  then v_cfg.costo_postulacion_alta else v_cfg.costo_postulacion end;

  insert into public.postulaciones (oferta_id, estudiante_id, mensaje, tarifa_propuesta, origen, connects_gastados)
  values (p_oferta, v_est.id, trim(p_mensaje), p_tarifa_propuesta, 'postulacion', v_costo)
  returning id into v_id;

  perform privado.descontar_connects(v_est.id, v_costo, v_id);
  return v_id;
end $$;

-- E. Invitar: la empresa (aprobada) invita a un estudiante aprobado a una oferta suya. No cobra Connects.
create function public.invitar(p_estudiante uuid, p_oferta uuid)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_emp uuid;
  v_id uuid;
begin
  select id into v_emp from public.empresas where user_id = auth.uid() and estado = 'aprobado';
  if v_emp is null then raise exception 'Tu empresa tiene que estar aprobada para invitar.'; end if;
  if not exists (select 1 from public.ofertas where id = p_oferta and empresa_id = v_emp and estado = 'publicada') then
    raise exception 'Solo podés invitar a ofertas tuyas que estén publicadas.';
  end if;
  if not privado.estudiante_aprobado(p_estudiante) then
    raise exception 'Ese estudiante no está disponible.';
  end if;
  if exists (select 1 from public.postulaciones where oferta_id = p_oferta and estudiante_id = p_estudiante) then
    raise exception 'Este estudiante ya está postulado o invitado a esa oferta.';
  end if;

  insert into public.postulaciones (oferta_id, estudiante_id, origen, connects_gastados)
  values (p_oferta, p_estudiante, 'invitacion', 0)
  returning id into v_id;
  return v_id;
end $$;

-- F. La empresa cambia el estado de una postulación (vista, entrevista, descartada)
create function public.cambiar_estado_postulacion(p_postulacion uuid, p_estado public.estado_postulacion)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_pos public.postulaciones;
begin
  if p_estado not in ('vista', 'entrevista', 'descartada') then
    raise exception 'Estado no permitido. Para contratar usá "Contratar".';
  end if;
  select * into v_pos from public.postulaciones where id = p_postulacion;
  if v_pos.id is null or not privado.oferta_es_mia(v_pos.oferta_id)
     or not privado.estudiante_aprobado(v_pos.estudiante_id) then
    raise exception 'No encontramos esa postulación.';
  end if;
  if v_pos.estado = 'contratada' then
    raise exception 'Esta postulación ya terminó en contrato.';
  end if;
  update public.postulaciones set estado = p_estado where id = p_postulacion;
end $$;

-- G. Contratar: crea el contrato con la comisión vigente congelada
create function public.contratar(p_postulacion uuid)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_pos public.postulaciones;
  v_of public.ofertas;
  v_id uuid;
begin
  select * into v_pos from public.postulaciones where id = p_postulacion for update;
  if v_pos.id is null or not privado.oferta_es_mia(v_pos.oferta_id)
     or not privado.estudiante_aprobado(v_pos.estudiante_id) then
    raise exception 'No encontramos esa postulación.';
  end if;
  if v_pos.estado = 'contratada' then raise exception 'Ya contrataste a este estudiante para esta oferta.'; end if;
  if v_pos.estado = 'descartada' then raise exception 'Esta postulación está descartada.'; end if;

  select * into v_of from public.ofertas where id = v_pos.oferta_id;

  update public.postulaciones set estado = 'contratada' where id = p_postulacion;

  insert into public.contratos (postulacion_id, oferta_id, estudiante_id, empresa_id, tarifa_usd, comision_pct)
  values (v_pos.id, v_of.id, v_pos.estudiante_id, v_of.empresa_id,
          coalesce(v_pos.tarifa_propuesta, v_of.tarifa_usd),
          (select comision_pct from public.configuracion))
  returning id into v_id;
  return v_id;
end $$;

-- H. Admin: aprobar, rechazar (con motivo) o volver a pendiente a un estudiante o empresa
create function public.admin_revisar(p_tipo text, p_id uuid, p_decision public.estado_revision, p_motivo text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_motivo text := nullif(trim(coalesce(p_motivo, '')), '');
begin
  if not privado.es_admin() then raise exception 'Solo el admin puede revisar perfiles.'; end if;
  if p_decision = 'rechazado' and char_length(coalesce(v_motivo, '')) < 8 then
    raise exception 'El motivo del rechazo tiene que tener al menos 8 caracteres.';
  end if;

  if p_tipo = 'estudiante' then
    update public.estudiantes
       set estado = p_decision,
           motivo_rechazo = case when p_decision = 'rechazado' then v_motivo end,
           revisado_at = case when p_decision = 'pendiente' then null else now() end
     where id = p_id;
  elsif p_tipo = 'empresa' then
    update public.empresas
       set estado = p_decision,
           motivo_rechazo = case when p_decision = 'rechazado' then v_motivo end,
           revisado_at = case when p_decision = 'pendiente' then null else now() end
     where id = p_id;
  else
    raise exception 'Tipo inválido: usá "estudiante" o "empresa".';
  end if;

  if not found then raise exception 'No encontramos ese perfil.'; end if;
end $$;

-- I. Acreditar una compra de Connects. SOLO la llama el webhook de pagos (con la clave de servidor).
--    Si el pago ya estaba aprobado devuelve false y no acredita de nuevo.
create function public.acreditar_compra(p_pago uuid, p_external_id text)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_pago public.pagos;
  v_cantidad integer;
begin
  update public.pagos
     set estado = 'aprobado', external_id = p_external_id
   where id = p_pago and tipo = 'connects' and estado = 'pendiente'
  returning * into v_pago;
  if v_pago.id is null then return false; end if;

  select cantidad into v_cantidad from public.paquetes_connects where id = v_pago.paquete_id;
  update public.estudiantes set connects = connects + v_cantidad where id = v_pago.estudiante_id;
  insert into public.connects_transacciones (estudiante_id, cantidad, motivo, referencia)
  values (v_pago.estudiante_id, v_cantidad, 'compra', v_pago.id);
  return true;
end $$;

-- J. Permisos de ejecución: por defecto Postgres deja ejecutar a todos; lo cerramos
revoke all on function
  public.registrar_estudiante(text, text, text, smallint, text, jsonb, text[], smallint, numeric, text),
  public.registrar_empresa(text, text, text, text),
  public.postularse(uuid, text, numeric),
  public.invitar(uuid, uuid),
  public.cambiar_estado_postulacion(uuid, public.estado_postulacion),
  public.contratar(uuid),
  public.admin_revisar(text, uuid, public.estado_revision, text),
  public.acreditar_compra(uuid, text),
  privado.descontar_connects(uuid, integer, uuid)
from public, anon, authenticated;

grant execute on function
  public.registrar_estudiante(text, text, text, smallint, text, jsonb, text[], smallint, numeric, text),
  public.registrar_empresa(text, text, text, text),
  public.postularse(uuid, text, numeric),
  public.invitar(uuid, uuid),
  public.cambiar_estado_postulacion(uuid, public.estado_postulacion),
  public.contratar(uuid),
  public.admin_revisar(text, uuid, public.estado_revision, text)
to authenticated;

grant execute on function public.acreditar_compra(uuid, text) to service_role;
