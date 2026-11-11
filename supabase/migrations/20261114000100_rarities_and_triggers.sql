-- Jornada Bíblica — Sistema de itens e raridades (aditiva; não altera migrações anteriores).
--  * Raridades como tabela de referência (Comum, Raro, Épico, Lendário, Santo)
--  * Slot "relic": artefatos do Santuário das Conquistas (possuídos, NÃO equipáveis)
--  * Campos independentes: raridade × slot × método de obtenção (acquisition) × série
--  * Registro de gatilhos (missões, marcos, mundos) para o futuro Modo Missão
--  * Eventos MISSION_COMPLETED e MILESTONE_REACHED; BOOK_COMPLETED só com todos os capítulos

-- ---------------------------------------------------------------------------
-- Raridades
-- ---------------------------------------------------------------------------

create table if not exists public.rarities (
  id text primary key check (id ~ '^[a-z]{3,20}$'),
  name text not null,
  sort_order int not null,
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  description text,
  is_active boolean not null default true
);

insert into public.rarities (id, name, sort_order, color, description, is_active) values
  ('common', 'Comum', 1, '#8C8273', null, true),
  ('uncommon', 'Incomum', 2, '#4E8A4A', 'Mantida por compatibilidade; não usada no catálogo.', false),
  ('rare', 'Raro', 3, '#2F6FA8', null, true),
  ('epic', 'Épico', 4, '#8A3FA0', null, true),
  ('legendary', 'Lendário', 5, '#C9771A', null, true),
  ('holy', 'Santo', 6, '#B8932F', null, true)
on conflict (id) do nothing;

alter table public.rarities enable row level security;
revoke all on public.rarities from anon, authenticated;
grant select on public.rarities to anon, authenticated;
drop policy if exists "raridades são públicas" on public.rarities;
create policy "raridades são públicas" on public.rarities for select to anon, authenticated using (true);

-- a raridade do item passa a ser validada pela tabela (antes: CHECK fixo)
alter table public.cosmetic_items drop constraint if exists cosmetic_items_rarity_check;
alter table public.cosmetic_items drop constraint if exists cosmetic_items_rarity_fkey;
alter table public.cosmetic_items
  add constraint cosmetic_items_rarity_fkey foreign key (rarity) references public.rarities (id);

-- ---------------------------------------------------------------------------
-- Slot "relic", método de obtenção, série e livro associado
-- ---------------------------------------------------------------------------

alter table public.cosmetic_items drop constraint if exists cosmetic_items_slot_check;
alter table public.cosmetic_items add constraint cosmetic_items_slot_check check (slot in (
  'outfit', 'back', 'feet', 'waist', 'neck', 'head', 'hands', 'background', 'frame', 'relic'
));

alter table public.cosmetic_items
  add column if not exists acquisition text not null default 'reading'
    check (acquisition in ('starter', 'reading', 'collection', 'mission', 'milestone', 'event')),
  add column if not exists series text not null default 'starter',
  add column if not exists book_code text references public.bible_books (code);

comment on column public.cosmetic_items.acquisition is 'Método de obtenção (independente da raridade e do slot).';
comment on column public.cosmetic_items.series is 'Agrupamento de catálogo (ex.: starter, rarities-v1).';
comment on column public.cosmetic_items.book_code is 'Livro associado (lendários: um por livro).';

-- cada livro tem no máximo um lendário
create unique index if not exists cosmetic_items_one_legendary_per_book
  on public.cosmetic_items (book_code) where rarity = 'legendary' and book_code is not null;

-- ---------------------------------------------------------------------------
-- Regras e eventos para missões e marcos
-- ---------------------------------------------------------------------------

alter table public.item_unlock_rules drop constraint if exists item_unlock_rules_rule_type_check;
alter table public.item_unlock_rules add constraint item_unlock_rules_rule_type_check check (rule_type in (
  'starter', 'chapter_completed', 'book_completed', 'chapters_count', 'composite',
  'world_completed', 'reading_streak', 'achievement_unlocked', 'collection_completed',
  'mission_completed', 'milestone_reached'
));

alter table private.domain_events drop constraint if exists domain_events_event_type_check;
alter table private.domain_events add constraint domain_events_event_type_check check (event_type in (
  'CHAPTER_COMPLETED', 'BOOK_COMPLETED', 'WORLD_COMPLETED', 'READING_STREAK_REACHED',
  'ACHIEVEMENT_UNLOCKED', 'COLLECTION_COMPLETED', 'MISSION_COMPLETED', 'MILESTONE_REACHED'
));

/**
 * Registro de gatilhos aceitos pelo motor (missões, marcos especiais e mundos).
 * Vazio de propósito: o Modo Missão cadastrará os seus. Eventos que apontam para
 * gatilhos inexistentes ou inativos são recusados.
 */
create table public.reward_triggers (
  id text primary key check (id ~ '^[a-z0-9-]{3,64}$'),
  kind text not null check (kind in ('mission', 'milestone', 'world')),
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.reward_triggers enable row level security;
revoke all on public.reward_triggers from anon, authenticated;
grant select on public.reward_triggers to authenticated;
create policy "gatilhos ativos visíveis" on public.reward_triggers for select to authenticated using (is_active);

-- ---------------------------------------------------------------------------
-- Funções redefinidas (mesmas assinaturas)
-- ---------------------------------------------------------------------------

create or replace function private.book_chapters_complete(p_user uuid, p_book text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select count(distinct (d.payload ->> 'chapter')::int) from private.domain_events d
    where d.user_id = p_user and d.event_type = 'CHAPTER_COMPLETED' and d.payload ->> 'book' = p_book
  ) >= (select b.chapters from public.bible_books b where b.code = p_book), false);
$$;

create or replace function private.rule_condition_met(p_user uuid, p_rule public.item_unlock_rules)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  p jsonb := p_rule.rule_payload;
  v_req jsonb;
begin
  for v_req in select * from jsonb_array_elements(coalesce(p_rule.requirements, '[]'::jsonb)) loop
    if v_req ->> 'type' = 'item_owned' and not exists (
      select 1 from public.user_items ui where ui.user_id = p_user and ui.item_id = v_req ->> 'item'
    ) then
      return false;
    end if;
  end loop;

  case p_rule.rule_type
    when 'chapter_completed' then
      return exists (
        select 1 from private.domain_events d
        where d.user_id = p_user and d.event_type = 'CHAPTER_COMPLETED'
          and d.payload ->> 'book' = p ->> 'book' and (d.payload ->> 'chapter')::int = (p ->> 'chapter')::int
      );
    when 'book_completed' then
      -- lendários: TODOS os capítulos do livro precisam estar concluídos
      return private.book_chapters_complete(p_user, p ->> 'book');
    when 'chapters_count' then
      return (
        select count(distinct (d.payload ->> 'book', (d.payload ->> 'chapter')::int)) from private.domain_events d
        where d.user_id = p_user and d.event_type = 'CHAPTER_COMPLETED'
          and (p ->> 'book' is null or d.payload ->> 'book' = p ->> 'book')
      ) >= (p ->> 'count')::int;
    when 'world_completed' then
      return exists (select 1 from private.domain_events d where d.user_id = p_user and d.event_type = 'WORLD_COMPLETED' and d.payload ->> 'world' = p ->> 'world');
    when 'mission_completed' then
      return exists (select 1 from private.domain_events d where d.user_id = p_user and d.event_type = 'MISSION_COMPLETED' and d.payload ->> 'mission' = p ->> 'mission');
    when 'milestone_reached' then
      return exists (select 1 from private.domain_events d where d.user_id = p_user and d.event_type = 'MILESTONE_REACHED' and d.payload ->> 'milestone' = p ->> 'milestone');
    when 'reading_streak' then
      return exists (select 1 from private.domain_events d where d.user_id = p_user and d.event_type = 'READING_STREAK_REACHED' and (d.payload ->> 'days')::int >= (p ->> 'days')::int);
    when 'achievement_unlocked' then
      return exists (select 1 from private.domain_events d where d.user_id = p_user and d.event_type = 'ACHIEVEMENT_UNLOCKED' and d.payload ->> 'achievement' = p ->> 'achievement');
    when 'collection_completed' then
      return private.collection_complete(p_user, p ->> 'collection');
    else
      return false;
  end case;
end;
$$;

create or replace function private.require_trigger(p_kind text, p_id text)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if coalesce(p_id, '') = '' or not exists (
    select 1 from public.reward_triggers t where t.id = p_id and t.kind = p_kind and t.is_active
  ) then
    raise exception using errcode = 'P0001', message = 'unknown_trigger', detail = p_kind || ':' || coalesce(p_id, '');
  end if;
end;
$$;

create or replace function private.record_event(p_user uuid, p_type text, p_source text, p_payload jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_book public.bible_books;
  v_granted text[];
begin
  if p_user is null or not exists (select 1 from public.profiles p where p.id = p_user) then
    raise exception using errcode = 'P0001', message = 'profile_required';
  end if;
  if coalesce(btrim(p_source), '') = '' then
    raise exception using errcode = 'P0001', message = 'invalid_event_payload', detail = 'source';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user::text, 42));

  case p_type
    when 'CHAPTER_COMPLETED' then
      select * into v_book from public.bible_books b where b.code = p_payload ->> 'book';
      if v_book.code is null or jsonb_typeof(p_payload -> 'chapter') <> 'number'
         or (p_payload ->> 'chapter')::int not between 1 and v_book.chapters then
        raise exception using errcode = 'P0001', message = 'invalid_event_payload', detail = p_payload::text;
      end if;
    when 'BOOK_COMPLETED' then
      if not exists (select 1 from public.bible_books b where b.code = p_payload ->> 'book') then
        raise exception using errcode = 'P0001', message = 'invalid_event_payload', detail = p_payload::text;
      end if;
      -- o livro só conta como concluído com todos os capítulos registrados
      if not private.book_chapters_complete(p_user, p_payload ->> 'book') then
        raise exception using errcode = 'P0001', message = 'book_incomplete', detail = p_payload ->> 'book';
      end if;
    when 'READING_STREAK_REACHED' then
      if jsonb_typeof(p_payload -> 'days') <> 'number' or (p_payload ->> 'days')::int < 1 then
        raise exception using errcode = 'P0001', message = 'invalid_event_payload', detail = p_payload::text;
      end if;
    when 'WORLD_COMPLETED' then
      perform private.require_trigger('world', p_payload ->> 'world');
    when 'MISSION_COMPLETED' then
      perform private.require_trigger('mission', p_payload ->> 'mission');
    when 'MILESTONE_REACHED' then
      perform private.require_trigger('milestone', p_payload ->> 'milestone');
    when 'ACHIEVEMENT_UNLOCKED' then
      if coalesce(p_payload ->> 'achievement', '') = '' then
        raise exception using errcode = 'P0001', message = 'invalid_event_payload', detail = p_payload::text;
      end if;
    when 'COLLECTION_COMPLETED' then
      if not private.collection_complete(p_user, p_payload ->> 'collection') then
        raise exception using errcode = 'P0001', message = 'collection_incomplete';
      end if;
    else
      raise exception using errcode = 'P0001', message = 'invalid_event_type', detail = p_type;
  end case;

  insert into private.domain_events (user_id, event_type, source_event_id, payload)
  values (p_user, p_type, p_source, p_payload)
  on conflict (user_id, event_type, source_event_id) do nothing
  returning id into v_id;

  if v_id is null then
    return jsonb_build_object('duplicate', true, 'granted', '[]'::jsonb);
  end if;

  v_granted := private.evaluate_rewards(p_user, p_type || ':' || p_source);
  return jsonb_build_object('duplicate', false, 'eventId', v_id, 'granted', to_jsonb(v_granted));
end;
$$;

-- equipamento: relíquias do Santuário nunca podem ser equipadas
create or replace function private.validate_equipment(p_user uuid, p_equipment jsonb, p_body text)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_slot text;
  v_item text;
  v_row record;
  v_allowed constant text[] := array['outfit', 'back', 'feet', 'waist', 'neck', 'head', 'hands', 'background', 'frame'];
begin
  if p_equipment is null or jsonb_typeof(p_equipment) <> 'object' then
    raise exception using errcode = 'P0001', message = 'invalid_equipment';
  end if;
  for v_slot, v_item in select key, value #>> '{}' from jsonb_each(p_equipment) loop
    if not (v_slot = any (v_allowed)) then
      raise exception using errcode = 'P0001', message = 'invalid_slot', detail = v_slot;
    end if;
    if jsonb_typeof(p_equipment -> v_slot) = 'null' then
      continue;
    end if;
    if jsonb_typeof(p_equipment -> v_slot) <> 'string' then
      raise exception using errcode = 'P0001', message = 'invalid_equipment', detail = v_slot;
    end if;
    select i.slot, i.body_compatibility into v_row from public.cosmetic_items i where i.id = v_item and i.is_active;
    if not found then
      raise exception using errcode = 'P0001', message = 'item_not_found', detail = v_item;
    end if;
    if v_row.slot = 'relic' then
      raise exception using errcode = 'P0001', message = 'item_not_equippable', detail = v_item;
    end if;
    if v_row.slot <> v_slot then
      raise exception using errcode = 'P0001', message = 'item_slot_mismatch', detail = v_item;
    end if;
    if not exists (select 1 from public.user_items ui where ui.user_id = p_user and ui.item_id = v_item) then
      raise exception using errcode = 'P0001', message = 'item_not_owned', detail = v_item;
    end if;
    if v_row.body_compatibility is not null and not (p_body = any (v_row.body_compatibility)) then
      raise exception using errcode = 'P0001', message = 'item_incompatible_body', detail = v_item;
    end if;
  end loop;
  if jsonb_typeof(p_equipment -> 'outfit') is distinct from 'string' then
    raise exception using errcode = 'P0001', message = 'outfit_required';
  end if;
end;
$$;

create or replace function public.equip_item(p_loadout_id uuid, p_item_id text, p_expected_version int default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_slot text;
  v_eq jsonb;
begin
  select i.slot into v_slot from public.cosmetic_items i where i.id = p_item_id and i.is_active;
  if v_slot is null then
    raise exception using errcode = 'P0001', message = 'item_not_found', detail = p_item_id;
  end if;
  if v_slot = 'relic' then
    raise exception using errcode = 'P0001', message = 'item_not_equippable', detail = p_item_id;
  end if;
  select coalesce(jsonb_object_agg(e.slot, e.item_id), '{}'::jsonb) into v_eq
  from public.avatar_loadout_equipment e join public.avatar_loadouts l on l.id = e.loadout_id
  where l.id = p_loadout_id and l.user_id = v_uid;
  perform private.write_loadout(v_uid, p_loadout_id, v_eq || jsonb_build_object(v_slot, p_item_id), p_expected_version);
  return private.wardrobe_state(v_uid);
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated;
