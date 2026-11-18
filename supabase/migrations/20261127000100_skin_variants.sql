-- Apresentação da skin: cada skin pode ter mais de uma apresentação pintada do mesmo traje
-- (hoje "padrao" e "feminino"), cada uma com os mesmos 3 estilos. Aditiva.
-- A escolha fica salva junto da skin vestida; o servidor só aceita apresentações que a skin tem.

alter table public.skins add column variants text[] not null default '{padrao}'
  check (variants <@ array['padrao', 'feminino']::text[] and 'padrao' = any(variants));
update public.skins set variants = '{padrao,feminino}'
 where id in ('comum_peregrino_exodo', 'raro_levita', 'lendario_moises');

alter table public.user_skin_selection add column variant text not null default 'padrao'
  check (variant in ('padrao', 'feminino'));

create or replace function private.skin_selection(p_user uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (select jsonb_build_object('skinId', u.skin_id, 'style', u.style,
              'variant', case when u.variant = any(s.variants) then u.variant else 'padrao' end)
       from public.user_skin_selection u join public.skins s on s.id = u.skin_id
      where u.user_id = p_user and s.is_active and private.owns_skin(p_user, u.skin_id)),
    jsonb_build_object('skinId', 'comum_peregrino_exodo', 'style', 1, 'variant', 'padrao'))
$$;

drop function public.equip_skin(text, int);
create function public.equip_skin(p_skin text, p_style int, p_variant text default 'padrao')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_variants text[];
begin
  if not exists (select 1 from public.profiles p where p.id = v_uid) then
    raise exception 'profile_required' using errcode = 'P0001';
  end if;
  if p_style is null or p_style not between 1 and 3 then
    raise exception 'invalid_style' using errcode = 'P0001';
  end if;
  select s.variants into v_variants from public.skins s where s.id = p_skin and s.is_active;
  if v_variants is null then
    raise exception 'skin_not_found' using errcode = 'P0001';
  end if;
  if not (coalesce(p_variant, 'padrao') = any(v_variants)) then
    raise exception 'invalid_variant' using errcode = 'P0001';
  end if;
  if not private.owns_skin(v_uid, p_skin) then
    raise exception 'skin_not_owned' using errcode = 'P0001';
  end if;
  insert into public.user_skin_selection (user_id, skin_id, style, variant, updated_at)
  values (v_uid, p_skin, p_style, coalesce(p_variant, 'padrao'), now())
  on conflict (user_id) do update set skin_id = excluded.skin_id, style = excluded.style, variant = excluded.variant, updated_at = now();
  return private.skin_selection(v_uid);
end;
$$;

revoke all on function private.skin_selection(uuid) from public, anon, authenticated;
revoke all on function public.equip_skin(text, int, text) from public, anon;
grant execute on function public.equip_skin(text, int, text) to authenticated;
