-- Jornada Bíblica — Marco 1: perfis, aparência do avatar, catálogo cosmético,
-- inventário, visual (loadout) ativo e preferências de leitura.
--
-- Regras de segurança:
--  * Todas as tabelas têm RLS. O cliente só LÊ os próprios dados (e o catálogo).
--  * Nenhuma escrita direta do cliente: tudo passa por funções RPC SECURITY DEFINER
--    que validam auth.uid(), posse de itens, slot e opções de aparência.
--  * Funções internas ficam no schema "private" (não exposto pela API).

create schema if not exists private;
revoke all on schema private from public;

-- ---------------------------------------------------------------------------
-- Tipos e utilidades
-- ---------------------------------------------------------------------------

create type public.privacy_mode as enum ('private', 'friends', 'public');

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Perfis
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  display_name text not null,
  privacy_mode public.privacy_mode not null default 'private',
  active_title_id text,
  avatar_onboarding_completed_at timestamptz,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,20}$'),
  constraint profiles_display_name_length check (char_length(btrim(display_name)) between 2 and 40)
);

-- o formato já obriga minúsculas, então o índice único é case-insensitive na prática
create unique index profiles_username_key on public.profiles (username);

create trigger profiles_touch before update on public.profiles
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Catálogo de aparência (corpo, pele, rosto, cabelo)
-- ---------------------------------------------------------------------------

create table public.avatar_appearance_options (
  id text primary key,
  category text not null check (category in (
    'body', 'skin_tone', 'eyes', 'brows', 'expression', 'beard', 'hair_style', 'hair_color'
  )),
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  catalog_version int not null default 1
);

create index avatar_appearance_options_category_idx
  on public.avatar_appearance_options (category, sort_order);

create table public.avatar_appearances (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  body_id text not null references public.avatar_appearance_options (id),
  skin_tone_id text not null references public.avatar_appearance_options (id),
  eyes_id text not null references public.avatar_appearance_options (id),
  brows_id text not null references public.avatar_appearance_options (id),
  expression_id text not null references public.avatar_appearance_options (id),
  beard_id text not null references public.avatar_appearance_options (id),
  hair_style_id text not null references public.avatar_appearance_options (id),
  hair_color_id text not null references public.avatar_appearance_options (id),
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger avatar_appearances_touch before update on public.avatar_appearances
  for each row execute function private.touch_updated_at();

-- Garante que cada coluna aponta para uma opção ativa da categoria certa.
create or replace function private.validate_avatar_appearance()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  pair record;
begin
  for pair in
    select * from (values
      ('body', new.body_id),
      ('skin_tone', new.skin_tone_id),
      ('eyes', new.eyes_id),
      ('brows', new.brows_id),
      ('expression', new.expression_id),
      ('beard', new.beard_id),
      ('hair_style', new.hair_style_id),
      ('hair_color', new.hair_color_id)
    ) as v(category, option_id)
  loop
    if not exists (
      select 1 from public.avatar_appearance_options o
      where o.id = pair.option_id and o.category = pair.category and o.is_active
    ) then
      raise exception using
        errcode = 'P0001',
        message = 'invalid_appearance',
        detail = format('%s=%s', pair.category, pair.option_id);
    end if;
  end loop;
  return new;
end;
$$;

create trigger avatar_appearances_validate
  before insert or update on public.avatar_appearances
  for each row execute function private.validate_avatar_appearance();

-- ---------------------------------------------------------------------------
-- Catálogo cosmético, regras de desbloqueio e inventário
-- ---------------------------------------------------------------------------

create table public.cosmetic_items (
  id text primary key check (id ~ '^[a-z0-9-]{3,64}$'),
  name text not null,
  category text not null,
  slot text not null check (slot in (
    'outfit', 'back', 'feet', 'waist', 'neck', 'head', 'hands', 'background', 'frame'
  )),
  rarity text not null default 'common'
    check (rarity in ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  description text,
  scripture_ref text,
  asset_manifest_key text not null,
  is_active boolean not null default true,
  is_premium_cosmetic boolean not null default false,
  is_starter boolean not null default false,
  catalog_version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cosmetic_items_slot_idx on public.cosmetic_items (slot) where is_active;

create trigger cosmetic_items_touch before update on public.cosmetic_items
  for each row execute function private.touch_updated_at();

create table public.item_unlock_rules (
  id uuid primary key default gen_random_uuid(),
  item_id text not null references public.cosmetic_items (id) on delete cascade,
  rule_type text not null check (rule_type in (
    'starter', 'chapter_completed', 'book_completed', 'chapters_count', 'composite'
  )),
  rule_payload jsonb not null default '{}'::jsonb,
  requirements jsonb not null default '[]'::jsonb,
  revision int not null default 1,
  created_at timestamptz not null default now()
);

create index item_unlock_rules_item_idx on public.item_unlock_rules (item_id);
create unique index item_unlock_rules_starter_key
  on public.item_unlock_rules (item_id) where rule_type = 'starter';

create table public.user_items (
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id text not null references public.cosmetic_items (id),
  unlocked_at timestamptz not null default now(),
  source_event_id text not null,
  primary key (user_id, item_id)
);

-- ---------------------------------------------------------------------------
-- Visuais salvos (loadouts) e equipamento
-- ---------------------------------------------------------------------------

create table public.avatar_loadouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 30),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index avatar_loadouts_user_idx on public.avatar_loadouts (user_id);
create unique index avatar_loadouts_one_active
  on public.avatar_loadouts (user_id) where is_active;

create trigger avatar_loadouts_touch before update on public.avatar_loadouts
  for each row execute function private.touch_updated_at();

create table public.avatar_loadout_equipment (
  loadout_id uuid not null references public.avatar_loadouts (id) on delete cascade,
  slot text not null,
  item_id text not null references public.cosmetic_items (id),
  primary key (loadout_id, slot)
);

-- Integridade de equipamento mesmo para escritas internas:
-- o item precisa pertencer ao dono do visual e ser do slot informado.
create or replace function private.validate_loadout_equipment()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_owner uuid;
  v_slot text;
begin
  select l.user_id into v_owner from public.avatar_loadouts l where l.id = new.loadout_id;
  select i.slot into v_slot from public.cosmetic_items i where i.id = new.item_id;

  if v_slot is null or v_slot <> new.slot then
    raise exception using errcode = 'P0001', message = 'item_slot_mismatch',
      detail = format('%s em %s', new.item_id, new.slot);
  end if;

  if not exists (
    select 1 from public.user_items ui
    where ui.user_id = v_owner and ui.item_id = new.item_id
  ) then
    raise exception using errcode = 'P0001', message = 'item_not_owned', detail = new.item_id;
  end if;

  return new;
end;
$$;

create trigger avatar_loadout_equipment_validate
  before insert or update on public.avatar_loadout_equipment
  for each row execute function private.validate_loadout_equipment();

-- ---------------------------------------------------------------------------
-- Preferências de leitura (ritmo flexível)
-- ---------------------------------------------------------------------------

create table public.reading_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  plan_mode text not null check (plan_mode in ('daily_goal', 'free')),
  target_chapters_per_day int check (target_chapters_per_day between 1 and 50),
  preferred_translation_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reading_preferences_goal_consistency check (
    (plan_mode = 'free' and target_chapters_per_day is null)
    or (plan_mode = 'daily_goal' and target_chapters_per_day is not null)
  )
);

create trigger reading_preferences_touch before update on public.reading_preferences
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS e privilégios
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.avatar_appearance_options enable row level security;
alter table public.avatar_appearances enable row level security;
alter table public.cosmetic_items enable row level security;
alter table public.item_unlock_rules enable row level security;
alter table public.user_items enable row level security;
alter table public.avatar_loadouts enable row level security;
alter table public.avatar_loadout_equipment enable row level security;
alter table public.reading_preferences enable row level security;

-- O Supabase concede ALL por padrão a anon/authenticated em tabelas novas.
-- Retiramos tudo e devolvemos apenas leitura onde faz sentido.
revoke all on
  public.profiles, public.avatar_appearance_options, public.avatar_appearances,
  public.cosmetic_items, public.item_unlock_rules, public.user_items,
  public.avatar_loadouts, public.avatar_loadout_equipment, public.reading_preferences
from anon, authenticated;

grant select on public.avatar_appearance_options, public.cosmetic_items to anon, authenticated;
grant select on
  public.profiles, public.avatar_appearances, public.user_items,
  public.avatar_loadouts, public.avatar_loadout_equipment, public.reading_preferences,
  public.item_unlock_rules
to authenticated;

create policy "catálogo de aparência é público"
  on public.avatar_appearance_options for select
  to anon, authenticated using (is_active);

create policy "catálogo cosmético é público"
  on public.cosmetic_items for select
  to anon, authenticated using (is_active);

create policy "regras de desbloqueio visíveis para usuários autenticados"
  on public.item_unlock_rules for select
  to authenticated using (true);

create policy "usuário lê o próprio perfil"
  on public.profiles for select
  to authenticated using (id = (select auth.uid()));

create policy "usuário lê a própria aparência"
  on public.avatar_appearances for select
  to authenticated using (user_id = (select auth.uid()));

create policy "usuário lê o próprio inventário"
  on public.user_items for select
  to authenticated using (user_id = (select auth.uid()));

create policy "usuário lê os próprios visuais"
  on public.avatar_loadouts for select
  to authenticated using (user_id = (select auth.uid()));

create policy "usuário lê o equipamento dos próprios visuais"
  on public.avatar_loadout_equipment for select
  to authenticated using (
    exists (
      select 1 from public.avatar_loadouts l
      where l.id = loadout_id and l.user_id = (select auth.uid())
    )
  );

create policy "usuário lê as próprias preferências de leitura"
  on public.reading_preferences for select
  to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Funções internas
-- ---------------------------------------------------------------------------

create or replace function private.require_uid()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception using errcode = '28000', message = 'not_authenticated';
  end if;
  return v_uid;
end;
$$;

-- Concede (de forma idempotente) os itens iniciais gratuitos definidos por regras 'starter'.
create or replace function private.grant_starter_items(p_user_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.user_items (user_id, item_id, source_event_id)
  select p_user_id, r.item_id, 'starter:r' || r.revision
  from public.item_unlock_rules r
  join public.cosmetic_items i on i.id = r.item_id and i.is_active
  where r.rule_type = 'starter'
  on conflict (user_id, item_id) do nothing;
$$;

create or replace function private.avatar_state(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'appearance', (
      select jsonb_build_object(
        'bodyId', a.body_id,
        'skinToneId', a.skin_tone_id,
        'eyesId', a.eyes_id,
        'browsId', a.brows_id,
        'expressionId', a.expression_id,
        'beardId', a.beard_id,
        'hairStyleId', a.hair_style_id,
        'hairColorId', a.hair_color_id
      )
      from public.avatar_appearances a where a.user_id = p_user_id
    ),
    'version', (select a.version from public.avatar_appearances a where a.user_id = p_user_id),
    'loadoutId', (
      select l.id from public.avatar_loadouts l where l.user_id = p_user_id and l.is_active
    ),
    'equipment', coalesce((
      select jsonb_object_agg(e.slot, e.item_id)
      from public.avatar_loadout_equipment e
      join public.avatar_loadouts l on l.id = e.loadout_id
      where l.user_id = p_user_id and l.is_active
    ), '{}'::jsonb),
    'updatedAt', (select a.updated_at from public.avatar_appearances a where a.user_id = p_user_id)
  );
$$;

revoke all on all functions in schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPCs públicas (somente usuários autenticados)
-- ---------------------------------------------------------------------------

create or replace function public.is_username_available(p_username text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_username text := lower(btrim(coalesce(p_username, '')));
begin
  if v_username !~ '^[a-z0-9_]{3,20}$' then
    return false;
  end if;
  return not exists (
    select 1 from public.profiles p where p.username = v_username and p.id <> v_uid
  );
end;
$$;

create or replace function public.claim_profile(p_username text, p_display_name text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_username text := lower(btrim(coalesce(p_username, '')));
  v_display text := regexp_replace(btrim(coalesce(p_display_name, '')), '\s+', ' ', 'g');
  v_row public.profiles;
begin
  if v_username !~ '^[a-z0-9_]{3,20}$' then
    raise exception using errcode = 'P0001', message = 'username_invalid';
  end if;
  if v_username = any (array[
    'admin', 'administrador', 'suporte', 'support', 'jornada', 'jornadabiblica',
    'moderador', 'moderacao', 'root', 'sistema', 'system', 'oficial', 'staff'
  ]) then
    raise exception using errcode = 'P0001', message = 'username_reserved';
  end if;
  if char_length(v_display) not between 2 and 40 then
    raise exception using errcode = 'P0001', message = 'display_name_invalid';
  end if;

  begin
    insert into public.profiles (id, username, display_name)
    values (v_uid, v_username, v_display)
    on conflict (id) do update
      set username = excluded.username, display_name = excluded.display_name
    returning * into v_row;
  exception when unique_violation then
    raise exception using errcode = 'P0001', message = 'username_taken';
  end;

  return v_row;
end;
$$;

create or replace function public.get_my_avatar()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  return private.avatar_state(v_uid);
end;
$$;

-- Salva aparência + equipamento do visual ativo numa única transação.
-- p_appearance: { bodyId, skinToneId, eyesId, browsId, expressionId, beardId, hairStyleId, hairColorId }
-- p_equipment:  { "<slot>": "<item_id>", ... }  (slots ausentes = vazios)
-- p_expected_version: versão que o cliente editou; null na criação.
create or replace function public.save_avatar(
  p_appearance jsonb,
  p_equipment jsonb,
  p_expected_version int default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_current_version int;
  v_loadout uuid;
  v_slot text;
  v_item text;
  v_item_slot text;
  v_allowed_slots constant text[] := array[
    'outfit', 'back', 'feet', 'waist', 'neck', 'head', 'hands', 'background', 'frame'
  ];
  v_required_keys constant text[] := array[
    'bodyId', 'skinToneId', 'eyesId', 'browsId', 'expressionId', 'beardId', 'hairStyleId', 'hairColorId'
  ];
  v_key text;
begin
  if not exists (select 1 from public.profiles p where p.id = v_uid) then
    raise exception using errcode = 'P0001', message = 'profile_required';
  end if;

  if p_appearance is null or jsonb_typeof(p_appearance) <> 'object' then
    raise exception using errcode = 'P0001', message = 'invalid_appearance';
  end if;
  foreach v_key in array v_required_keys loop
    if jsonb_typeof(p_appearance -> v_key) is distinct from 'string' then
      raise exception using errcode = 'P0001', message = 'invalid_appearance', detail = v_key;
    end if;
  end loop;

  if p_equipment is null or jsonb_typeof(p_equipment) <> 'object' then
    raise exception using errcode = 'P0001', message = 'invalid_equipment';
  end if;

  -- Itens iniciais gratuitos sempre disponíveis para quem tem perfil.
  perform private.grant_starter_items(v_uid);

  -- Controle de concorrência otimista (edição em dois aparelhos).
  select a.version into v_current_version
  from public.avatar_appearances a where a.user_id = v_uid for update;

  if found and p_expected_version is not null and p_expected_version <> v_current_version then
    raise exception using errcode = 'P0001', message = 'version_conflict';
  end if;

  insert into public.avatar_appearances as a (
    user_id, body_id, skin_tone_id, eyes_id, brows_id, expression_id, beard_id,
    hair_style_id, hair_color_id
  ) values (
    v_uid,
    p_appearance ->> 'bodyId', p_appearance ->> 'skinToneId', p_appearance ->> 'eyesId',
    p_appearance ->> 'browsId', p_appearance ->> 'expressionId', p_appearance ->> 'beardId',
    p_appearance ->> 'hairStyleId', p_appearance ->> 'hairColorId'
  )
  on conflict (user_id) do update set
    body_id = excluded.body_id,
    skin_tone_id = excluded.skin_tone_id,
    eyes_id = excluded.eyes_id,
    brows_id = excluded.brows_id,
    expression_id = excluded.expression_id,
    beard_id = excluded.beard_id,
    hair_style_id = excluded.hair_style_id,
    hair_color_id = excluded.hair_color_id,
    version = a.version + 1;

  -- Visual ativo (criado na primeira vez).
  select l.id into v_loadout from public.avatar_loadouts l
  where l.user_id = v_uid and l.is_active for update;

  if v_loadout is null then
    insert into public.avatar_loadouts (user_id, name, is_active)
    values (v_uid, 'Visual 1', true)
    on conflict (user_id) where is_active do nothing
    returning id into v_loadout;
    if v_loadout is null then
      select l.id into v_loadout from public.avatar_loadouts l
      where l.user_id = v_uid and l.is_active;
    end if;
  end if;

  -- Valida o equipamento antes de alterar qualquer coisa.
  for v_slot, v_item in select key, value #>> '{}' from jsonb_each(p_equipment) loop
    if not (v_slot = any (v_allowed_slots)) then
      raise exception using errcode = 'P0001', message = 'invalid_slot', detail = v_slot;
    end if;
    if jsonb_typeof(p_equipment -> v_slot) = 'null' then
      continue;
    end if;
    if jsonb_typeof(p_equipment -> v_slot) <> 'string' then
      raise exception using errcode = 'P0001', message = 'invalid_equipment', detail = v_slot;
    end if;

    select i.slot into v_item_slot from public.cosmetic_items i
    where i.id = v_item and i.is_active;
    if v_item_slot is null then
      raise exception using errcode = 'P0001', message = 'item_not_found', detail = v_item;
    end if;
    if v_item_slot <> v_slot then
      raise exception using errcode = 'P0001', message = 'item_slot_mismatch', detail = v_item;
    end if;
    if not exists (
      select 1 from public.user_items ui where ui.user_id = v_uid and ui.item_id = v_item
    ) then
      raise exception using errcode = 'P0001', message = 'item_not_owned', detail = v_item;
    end if;
  end loop;

  if jsonb_typeof(p_equipment -> 'outfit') is distinct from 'string' then
    raise exception using errcode = 'P0001', message = 'outfit_required';
  end if;

  delete from public.avatar_loadout_equipment e where e.loadout_id = v_loadout;
  insert into public.avatar_loadout_equipment (loadout_id, slot, item_id)
  select v_loadout, key, value #>> '{}'
  from jsonb_each(p_equipment)
  where jsonb_typeof(value) = 'string';

  update public.profiles p
  set avatar_onboarding_completed_at = coalesce(p.avatar_onboarding_completed_at, now())
  where p.id = v_uid;

  return private.avatar_state(v_uid);
end;
$$;

-- Define o ritmo de leitura. Também conclui o onboarding (se o avatar já existir).
-- p_plan_mode: 'daily_goal' (com p_target 1..50) ou 'free' (sem meta).
create or replace function public.set_reading_preferences(p_plan_mode text, p_target int default null)
returns public.reading_preferences
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_row public.reading_preferences;
begin
  if not exists (select 1 from public.profiles p where p.id = v_uid) then
    raise exception using errcode = 'P0001', message = 'profile_required';
  end if;
  if p_plan_mode = 'free' then
    p_target := null;
  elsif p_plan_mode = 'daily_goal' then
    if p_target is null or p_target not between 1 and 50 then
      raise exception using errcode = 'P0001', message = 'invalid_goal';
    end if;
  else
    raise exception using errcode = 'P0001', message = 'invalid_goal';
  end if;

  insert into public.reading_preferences (user_id, plan_mode, target_chapters_per_day)
  values (v_uid, p_plan_mode, p_target)
  on conflict (user_id) do update
    set plan_mode = excluded.plan_mode,
        target_chapters_per_day = excluded.target_chapters_per_day
  returning * into v_row;

  update public.profiles p
  set onboarding_completed_at = coalesce(p.onboarding_completed_at, now())
  where p.id = v_uid and p.avatar_onboarding_completed_at is not null;

  return v_row;
end;
$$;

revoke all on function
  public.is_username_available(text),
  public.claim_profile(text, text),
  public.get_my_avatar(),
  public.save_avatar(jsonb, jsonb, int),
  public.set_reading_preferences(text, int)
from public, anon;

grant execute on function
  public.is_username_available(text),
  public.claim_profile(text, text),
  public.get_my_avatar(),
  public.save_avatar(jsonb, jsonb, int),
  public.set_reading_preferences(text, int)
to authenticated;
