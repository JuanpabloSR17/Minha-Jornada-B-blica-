-- Vestiário de skins: cada jogador escolhe a skin que veste e um dos 3 estilos dela.
-- Aditiva: o avatar salvo (aparência e peças) e o inventário de peças continuam intactos; a
-- interface passa a desenhar o viajante pela skin escolhida. Sem escolha, vale a skin inicial
-- "Peregrino do Êxodo", estilo 1.

create table public.user_skin_selection (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  skin_id text not null references public.skins (id),
  style smallint not null check (style between 1 and 3),
  updated_at timestamptz not null default now()
);
alter table public.user_skin_selection enable row level security;
create policy "user_skin_selection: ler a própria" on public.user_skin_selection
  for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.user_skin_selection from anon;
revoke insert, update, delete on public.user_skin_selection from authenticated;
grant select on public.user_skin_selection to authenticated;

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

-- Skins do jogador (as iniciais contam como suas) e a escolhida.
create or replace function public.get_my_skins()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  return jsonb_build_object(
    'selected', private.skin_selection(v_uid),
    'owned', coalesce((
      select jsonb_agg(jsonb_build_object('skinId', s.id, 'acquiredAt', u.acquired_at) order by s.sort_order)
        from public.skins s
        left join public.user_skins u on u.skin_id = s.id and u.user_id = v_uid
       where s.is_active and (u.user_id is not null or s.origin = 'inicio')
    ), '[]'::jsonb)
  );
end;
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

-- O cartão público passa a trazer a skin vestida (mesmas regras de privacidade de antes).
create or replace function public.get_public_avatar(p_username text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_target public.profiles;
  v_state jsonb;
begin
  select * into v_target from public.profiles p where p.username = lower(btrim(coalesce(p_username, '')));
  if v_target.id is null then
    return null;
  end if;
  if v_target.id <> v_uid and v_target.privacy_mode <> 'public' then
    return jsonb_build_object('username', v_target.username, 'visible', false);
  end if;
  v_state := private.avatar_state(v_target.id);
  return jsonb_build_object(
    'username', v_target.username,
    'displayName', v_target.display_name,
    'visible', true,
    'isSelf', v_target.id = v_uid,
    'appearance', v_state -> 'appearance',
    'equipment', v_state -> 'equipment',
    'skin', private.skin_selection(v_target.id)
  );
end;
$$;

revoke all on function private.skin_selection(uuid) from public, anon, authenticated;
revoke all on function public.get_my_skins() from public, anon;
revoke all on function public.equip_skin(text, int) from public, anon;
grant execute on function public.get_my_skins() to authenticated;
grant execute on function public.equip_skin(text, int) to authenticated;
