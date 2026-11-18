-- Reversão manual das apresentações de skin: volta equip_skin e skin_selection às versões
-- anteriores e tira as colunas (a skin vestida e o estilo continuam).
drop function if exists public.equip_skin(text, int, text);
create or replace function private.skin_selection(p_user uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (select jsonb_build_object('skinId', u.skin_id, 'style', u.style)
       from public.user_skin_selection u join public.skins s on s.id = u.skin_id
      where u.user_id = p_user and s.is_active and private.owns_skin(p_user, u.skin_id)),
    jsonb_build_object('skinId', 'comum_peregrino_exodo', 'style', 1))
$$;

create or replace function public.equip_skin(p_skin text, p_style int)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  if not exists (select 1 from public.profiles p where p.id = v_uid) then
    raise exception 'profile_required' using errcode = 'P0001';
  end if;
  if p_style is null or p_style not between 1 and 3 then
    raise exception 'invalid_style' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.skins s where s.id = p_skin and s.is_active) then
    raise exception 'skin_not_found' using errcode = 'P0001';
  end if;
  if not private.owns_skin(v_uid, p_skin) then
    raise exception 'skin_not_owned' using errcode = 'P0001';
  end if;
  insert into public.user_skin_selection (user_id, skin_id, style, updated_at)
  values (v_uid, p_skin, p_style, now())
  on conflict (user_id) do update set skin_id = excluded.skin_id, style = excluded.style, updated_at = now();
  return private.skin_selection(v_uid);
end;
$$;

revoke all on function private.skin_selection(uuid) from public, anon, authenticated;
revoke all on function public.equip_skin(text, int) from public, anon;
grant execute on function public.equip_skin(text, int) to authenticated;
alter table public.user_skin_selection drop column if exists variant;
alter table public.skins drop column if exists variants;
