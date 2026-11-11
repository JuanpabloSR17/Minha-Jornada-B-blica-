-- Jornada Bíblica — Marco 2: guarda-roupa, inventário, visuais salvos, coleções,
-- variantes evolutivas, estado de assinatura e motor de recompensas.
--
-- Não altera migrações anteriores. Adiciona colunas com valor padrão (dados existentes
-- preservados) e redefine save_avatar mantendo assinatura e comportamento.
-- Reversão manual: supabase/rollbacks/20261113000100_marco2_wardrobe.down.sql

-- ---------------------------------------------------------------------------
-- Catálogo bíblico canônico (66 livros, 1.189 capítulos) — valida eventos de leitura
-- ---------------------------------------------------------------------------

create table public.bible_books (
  code text primary key check (code ~ '^[1-3A-Z][A-Z0-9]{2}$'),
  name text not null,
  chapters int not null check (chapters between 1 and 150),
  book_order int not null unique,
  testament text not null check (testament in ('AT', 'NT'))
);

insert into public.bible_books (code, name, chapters, book_order, testament) values
  ('GEN', 'Gênesis', 50, 1, 'AT'),
  ('EXO', 'Êxodo', 40, 2, 'AT'),
  ('LEV', 'Levítico', 27, 3, 'AT'),
  ('NUM', 'Números', 36, 4, 'AT'),
  ('DEU', 'Deuteronômio', 34, 5, 'AT'),
  ('JOS', 'Josué', 24, 6, 'AT'),
  ('JDG', 'Juízes', 21, 7, 'AT'),
  ('RUT', 'Rute', 4, 8, 'AT'),
  ('1SA', '1 Samuel', 31, 9, 'AT'),
  ('2SA', '2 Samuel', 24, 10, 'AT'),
  ('1KI', '1 Reis', 22, 11, 'AT'),
  ('2KI', '2 Reis', 25, 12, 'AT'),
  ('1CH', '1 Crônicas', 29, 13, 'AT'),
  ('2CH', '2 Crônicas', 36, 14, 'AT'),
  ('EZR', 'Esdras', 10, 15, 'AT'),
  ('NEH', 'Neemias', 13, 16, 'AT'),
  ('EST', 'Ester', 10, 17, 'AT'),
  ('JOB', 'Jó', 42, 18, 'AT'),
  ('PSA', 'Salmos', 150, 19, 'AT'),
  ('PRO', 'Provérbios', 31, 20, 'AT'),
  ('ECC', 'Eclesiastes', 12, 21, 'AT'),
  ('SNG', 'Cânticos', 8, 22, 'AT'),
  ('ISA', 'Isaías', 66, 23, 'AT'),
  ('JER', 'Jeremias', 52, 24, 'AT'),
  ('LAM', 'Lamentações', 5, 25, 'AT'),
  ('EZK', 'Ezequiel', 48, 26, 'AT'),
  ('DAN', 'Daniel', 12, 27, 'AT'),
  ('HOS', 'Oseias', 14, 28, 'AT'),
  ('JOL', 'Joel', 3, 29, 'AT'),
  ('AMO', 'Amós', 9, 30, 'AT'),
  ('OBA', 'Obadias', 1, 31, 'AT'),
  ('JON', 'Jonas', 4, 32, 'AT'),
  ('MIC', 'Miqueias', 7, 33, 'AT'),
  ('NAM', 'Naum', 3, 34, 'AT'),
  ('HAB', 'Habacuque', 3, 35, 'AT'),
  ('ZEP', 'Sofonias', 3, 36, 'AT'),
  ('HAG', 'Ageu', 2, 37, 'AT'),
  ('ZEC', 'Zacarias', 14, 38, 'AT'),
  ('MAL', 'Malaquias', 4, 39, 'AT'),
  ('MAT', 'Mateus', 28, 40, 'NT'),
  ('MRK', 'Marcos', 16, 41, 'NT'),
  ('LUK', 'Lucas', 24, 42, 'NT'),
  ('JHN', 'João', 21, 43, 'NT'),
  ('ACT', 'Atos', 28, 44, 'NT'),
  ('ROM', 'Romanos', 16, 45, 'NT'),
  ('1CO', '1 Coríntios', 16, 46, 'NT'),
  ('2CO', '2 Coríntios', 13, 47, 'NT'),
  ('GAL', 'Gálatas', 6, 48, 'NT'),
  ('EPH', 'Efésios', 6, 49, 'NT'),
  ('PHP', 'Filipenses', 4, 50, 'NT'),
  ('COL', 'Colossenses', 4, 51, 'NT'),
  ('1TH', '1 Tessalonicenses', 5, 52, 'NT'),
  ('2TH', '2 Tessalonicenses', 3, 53, 'NT'),
  ('1TI', '1 Timóteo', 6, 54, 'NT'),
  ('2TI', '2 Timóteo', 4, 55, 'NT'),
  ('TIT', 'Tito', 3, 56, 'NT'),
  ('PHM', 'Filemom', 1, 57, 'NT'),
  ('HEB', 'Hebreus', 13, 58, 'NT'),
  ('JAS', 'Tiago', 5, 59, 'NT'),
  ('1PE', '1 Pedro', 5, 60, 'NT'),
  ('2PE', '2 Pedro', 3, 61, 'NT'),
  ('1JN', '1 João', 5, 62, 'NT'),
  ('2JN', '2 João', 1, 63, 'NT'),
  ('3JN', '3 João', 1, 64, 'NT'),
  ('JUD', 'Judas', 1, 65, 'NT'),
  ('REV', 'Apocalipse', 22, 66, 'NT')
on conflict (code) do nothing;

alter table public.bible_books enable row level security;
revoke all on public.bible_books from anon, authenticated;
grant select on public.bible_books to anon, authenticated;
create policy "livros bíblicos são públicos" on public.bible_books for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- Catálogo cosmético: variantes evolutivas e compatibilidade com corpos
-- ---------------------------------------------------------------------------

alter table public.cosmetic_items
  add column if not exists variant_of text references public.cosmetic_items (id),
  add column if not exists variant_label text,
  add column if not exists body_compatibility text[];

comment on column public.cosmetic_items.variant_of is 'Item base do qual esta aparência é uma evolução (cada variante é um item próprio, a base nunca é removida).';
comment on column public.cosmetic_items.body_compatibility is 'Corpos suportados; NULL = todos (política padrão: toda peça tem versão para os três corpos).';

alter table public.item_unlock_rules drop constraint if exists item_unlock_rules_rule_type_check;
alter table public.item_unlock_rules add constraint item_unlock_rules_rule_type_check check (rule_type in (
  'starter', 'chapter_completed', 'book_completed', 'chapters_count', 'composite',
  'world_completed', 'reading_streak', 'achievement_unlocked', 'collection_completed'
));

-- ---------------------------------------------------------------------------
-- Coleções
-- ---------------------------------------------------------------------------

create table public.item_collections (
  id text primary key check (id ~ '^[a-z0-9-]{3,64}$'),
  name text not null,
  description text,
  reward_item_id text references public.cosmetic_items (id),
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table public.collection_items (
  collection_id text not null references public.item_collections (id) on delete cascade,
  item_id text not null references public.cosmetic_items (id),
  sort_order int not null default 0,
  primary key (collection_id, item_id)
);

alter table public.item_collections enable row level security;
alter table public.collection_items enable row level security;
revoke all on public.item_collections, public.collection_items from anon, authenticated;
grant select on public.item_collections, public.collection_items to authenticated;
create policy "coleções visíveis" on public.item_collections for select to authenticated using (is_active);
create policy "itens de coleção visíveis" on public.collection_items for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Estado de assinatura (fonte confiável: só o servidor/webhook de pagamento escreve)
-- ---------------------------------------------------------------------------

create table public.user_entitlements (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'premium')),
  status text not null default 'active' check (status in ('active', 'past_due', 'canceled', 'expired')),
  current_period_end timestamptz,
  provider text,
  provider_ref text,
  updated_at timestamptz not null default now()
);

alter table public.user_entitlements enable row level security;
revoke all on public.user_entitlements from anon, authenticated;
grant select on public.user_entitlements to authenticated;
create policy "usuário lê o próprio plano" on public.user_entitlements for select to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Visuais salvos: controle de versão por visual
-- ---------------------------------------------------------------------------

alter table public.avatar_loadouts add column if not exists version int not null default 1;

-- ---------------------------------------------------------------------------
-- Motor de recompensas
-- ---------------------------------------------------------------------------

create table private.domain_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null check (event_type in (
    'CHAPTER_COMPLETED', 'BOOK_COMPLETED', 'WORLD_COMPLETED',
    'READING_STREAK_REACHED', 'ACHIEVEMENT_UNLOCKED', 'COLLECTION_COMPLETED'
  )),
  source_event_id text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, event_type, source_event_id)
);

create index domain_events_user_type_idx on private.domain_events (user_id, event_type);

create table public.reward_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  rule_id uuid not null references public.item_unlock_rules (id) on delete cascade,
  item_id text not null references public.cosmetic_items (id),
  source_event_id text not null,
  created_at timestamptz not null default now(),
  -- cada regra recompensa cada usuário no máximo uma vez
  unique (user_id, rule_id),
  unique (user_id, rule_id, source_event_id)
);

alter table public.reward_events enable row level security;
revoke all on public.reward_events from anon, authenticated;
grant select on public.reward_events to authenticated;
create policy "usuário lê as próprias recompensas" on public.reward_events for select to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Funções internas
-- ---------------------------------------------------------------------------

create or replace function private.is_premium(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_entitlements e
    where e.user_id = p_user
      and e.plan = 'premium'
      and e.status in ('active', 'past_due')
      and coalesce(e.current_period_end, 'infinity'::timestamptz) > now()
  );
$$;

create or replace function private.loadout_limit(p_user uuid)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select case when private.is_premium(p_user) then 10 else 3 end;
$$;

/** Visuais além do limite do plano (por ordem de criação) ficam só leitura — nunca apagados. */
create or replace function private.loadout_is_locked(p_user uuid, p_loadout uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select t.rn > private.loadout_limit(p_user)
    from (
      select l.id, row_number() over (order by l.created_at, l.id) as rn
      from public.avatar_loadouts l where l.user_id = p_user
    ) t
    where t.id = p_loadout
  ), false);
$$;

/** Valida um mapa slot → item para o usuário e o corpo informados. */
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

/** Grava o equipamento de um visual com bloqueio de linha e versão otimista. */
create or replace function private.write_loadout(p_user uuid, p_loadout uuid, p_equipment jsonb, p_expected_version int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_version int;
  v_body text;
begin
  select l.version into v_version from public.avatar_loadouts l
  where l.id = p_loadout and l.user_id = p_user for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'loadout_not_found';
  end if;
  if private.loadout_is_locked(p_user, p_loadout) then
    raise exception using errcode = 'P0001', message = 'loadout_locked';
  end if;
  if p_expected_version is not null and p_expected_version <> v_version then
    raise exception using errcode = 'P0001', message = 'version_conflict';
  end if;
  select a.body_id into v_body from public.avatar_appearances a where a.user_id = p_user;
  if v_body is null then
    raise exception using errcode = 'P0001', message = 'avatar_required';
  end if;
  perform private.validate_equipment(p_user, p_equipment, v_body);
  delete from public.avatar_loadout_equipment e where e.loadout_id = p_loadout;
  insert into public.avatar_loadout_equipment (loadout_id, slot, item_id)
  select p_loadout, key, value #>> '{}' from jsonb_each(p_equipment) where jsonb_typeof(value) = 'string';
  update public.avatar_loadouts l set version = l.version + 1 where l.id = p_loadout;
end;
$$;

create or replace function private.wardrobe_state(p_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'appearance', (private.avatar_state(p_user) -> 'appearance'),
    'appearanceVersion', (select a.version from public.avatar_appearances a where a.user_id = p_user),
    'activeLoadoutId', (select l.id from public.avatar_loadouts l where l.user_id = p_user and l.is_active),
    'plan', jsonb_build_object(
      'tier', case when private.is_premium(p_user) then 'premium' else 'free' end,
      'loadoutLimit', private.loadout_limit(p_user),
      'status', coalesce((select e.status from public.user_entitlements e where e.user_id = p_user), 'active')
    ),
    'loadouts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'name', t.name, 'isActive', t.is_active, 'version', t.version,
        'position', t.rn, 'locked', t.rn > private.loadout_limit(p_user), 'updatedAt', t.updated_at,
        'equipment', coalesce((
          select jsonb_object_agg(e.slot, e.item_id) from public.avatar_loadout_equipment e where e.loadout_id = t.id
        ), '{}'::jsonb)
      ) order by t.rn)
      from (
        select l.*, row_number() over (order by l.created_at, l.id) as rn
        from public.avatar_loadouts l where l.user_id = p_user
      ) t
    ), '[]'::jsonb),
    'owned', coalesce((
      select jsonb_agg(jsonb_build_object('itemId', ui.item_id, 'unlockedAt', ui.unlocked_at, 'source', ui.source_event_id) order by ui.unlocked_at)
      from public.user_items ui where ui.user_id = p_user
    ), '[]'::jsonb)
  );
$$;

-- ---------------------------------------------------------------------------
-- Motor de recompensas (somente servidor)
-- ---------------------------------------------------------------------------

/** A condição principal de uma regra já foi cumprida pelo histórico de eventos do usuário? */
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
  -- requisitos adicionais (ex.: possuir o Manto de Elias para o Manto da Sucessão)
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
      return exists (
        select 1 from private.domain_events d
        where d.user_id = p_user and d.event_type = 'BOOK_COMPLETED' and d.payload ->> 'book' = p ->> 'book'
      ) or (
        select count(distinct (d.payload ->> 'chapter')::int) from private.domain_events d
        where d.user_id = p_user and d.event_type = 'CHAPTER_COMPLETED' and d.payload ->> 'book' = p ->> 'book'
      ) >= (select b.chapters from public.bible_books b where b.code = p ->> 'book');
    when 'chapters_count' then
      return (
        select count(distinct (d.payload ->> 'book', (d.payload ->> 'chapter')::int)) from private.domain_events d
        where d.user_id = p_user and d.event_type = 'CHAPTER_COMPLETED'
          and (p ->> 'book' is null or d.payload ->> 'book' = p ->> 'book')
      ) >= (p ->> 'count')::int;
    when 'world_completed' then
      return exists (select 1 from private.domain_events d where d.user_id = p_user and d.event_type = 'WORLD_COMPLETED' and d.payload ->> 'world' = p ->> 'world');
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

create or replace function private.collection_complete(p_user uuid, p_collection text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.collection_items ci where ci.collection_id = p_collection)
     and not exists (
       select 1 from public.collection_items ci
       where ci.collection_id = p_collection
         and not exists (select 1 from public.user_items ui where ui.user_id = p_user and ui.item_id = ci.item_id)
     );
$$;

/**
 * Reavalia todas as regras ainda não concedidas ao usuário e concede as cumpridas.
 * Repete enquanto houver novas concessões (itens podem destravar outros itens e coleções).
 */
create or replace function private.evaluate_rewards(p_user uuid, p_source text)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rule public.item_unlock_rules;
  v_granted text[] := '{}';
  v_new boolean;
  v_round int := 0;
  v_reward uuid;
  v_col record;
begin
  loop
    v_round := v_round + 1;
    v_new := false;
    for v_rule in
      select r.* from public.item_unlock_rules r
      join public.cosmetic_items i on i.id = r.item_id and i.is_active and not i.is_premium_cosmetic
      where r.rule_type <> 'starter'
        and not exists (select 1 from public.reward_events re where re.user_id = p_user and re.rule_id = r.id)
      order by r.created_at
    loop
      if private.rule_condition_met(p_user, v_rule) then
        insert into public.reward_events (user_id, rule_id, item_id, source_event_id)
        values (p_user, v_rule.id, v_rule.item_id, p_source)
        on conflict do nothing
        returning id into v_reward;
        if v_reward is not null then
          insert into public.user_items (user_id, item_id, source_event_id)
          values (p_user, v_rule.item_id, 'reward:' || v_rule.id)
          on conflict (user_id, item_id) do nothing;
          v_granted := v_granted || v_rule.item_id;
          v_new := true;
        end if;
      end if;
    end loop;
    -- registra conclusão de coleções (auditoria; a recompensa vem da regra collection_completed)
    for v_col in select c.id from public.item_collections c where c.is_active loop
      if private.collection_complete(p_user, v_col.id) then
        insert into private.domain_events (user_id, event_type, source_event_id, payload)
        values (p_user, 'COLLECTION_COMPLETED', 'collection:' || v_col.id, jsonb_build_object('collection', v_col.id))
        on conflict do nothing;
      end if;
    end loop;
    exit when not v_new or v_round >= 8;
  end loop;
  return v_granted;
end;
$$;

/**
 * Ponto de entrada do motor: registra um evento de domínio validado e concede recompensas.
 * Idempotente por (usuário, tipo, source_event_id). NÃO é exposto ao cliente: será chamado
 * por operações autenticadas do servidor (ex.: complete_chapter no Marco 3).
 */
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
  -- serializa eventos do mesmo usuário (concessões concorrentes)
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
    when 'READING_STREAK_REACHED' then
      if jsonb_typeof(p_payload -> 'days') <> 'number' or (p_payload ->> 'days')::int < 1 then
        raise exception using errcode = 'P0001', message = 'invalid_event_payload', detail = p_payload::text;
      end if;
    when 'WORLD_COMPLETED' then
      if coalesce(p_payload ->> 'world', '') = '' then
        raise exception using errcode = 'P0001', message = 'invalid_event_payload', detail = p_payload::text;
      end if;
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

revoke all on all functions in schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- save_avatar (redefinida): mesma assinatura, agora com versão do visual,
-- bloqueio de visuais excedentes e compatibilidade de corpo.
-- ---------------------------------------------------------------------------

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
  v_key text;
  v_required_keys constant text[] := array[
    'bodyId', 'skinToneId', 'eyesId', 'browsId', 'expressionId', 'beardId', 'hairStyleId', 'hairColorId'
  ];
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

  perform private.grant_starter_items(v_uid);

  select a.version into v_current_version from public.avatar_appearances a where a.user_id = v_uid for update;
  if found and p_expected_version is not null and p_expected_version <> v_current_version then
    raise exception using errcode = 'P0001', message = 'version_conflict';
  end if;

  insert into public.avatar_appearances as a (
    user_id, body_id, skin_tone_id, eyes_id, brows_id, expression_id, beard_id, hair_style_id, hair_color_id
  ) values (
    v_uid,
    p_appearance ->> 'bodyId', p_appearance ->> 'skinToneId', p_appearance ->> 'eyesId',
    p_appearance ->> 'browsId', p_appearance ->> 'expressionId', p_appearance ->> 'beardId',
    p_appearance ->> 'hairStyleId', p_appearance ->> 'hairColorId'
  )
  on conflict (user_id) do update set
    body_id = excluded.body_id, skin_tone_id = excluded.skin_tone_id, eyes_id = excluded.eyes_id,
    brows_id = excluded.brows_id, expression_id = excluded.expression_id, beard_id = excluded.beard_id,
    hair_style_id = excluded.hair_style_id, hair_color_id = excluded.hair_color_id,
    version = a.version + 1;

  select l.id into v_loadout from public.avatar_loadouts l where l.user_id = v_uid and l.is_active;
  if v_loadout is null then
    insert into public.avatar_loadouts (user_id, name, is_active)
    values (v_uid, 'Visual 1', true)
    on conflict (user_id) where is_active do nothing
    returning id into v_loadout;
    if v_loadout is null then
      select l.id into v_loadout from public.avatar_loadouts l where l.user_id = v_uid and l.is_active;
    end if;
  end if;

  perform private.write_loadout(v_uid, v_loadout, p_equipment, null);

  update public.profiles p
  set avatar_onboarding_completed_at = coalesce(p.avatar_onboarding_completed_at, now())
  where p.id = v_uid;

  return private.avatar_state(v_uid);
end;
$$;

-- ---------------------------------------------------------------------------
-- RPCs do guarda-roupa e visuais salvos
-- ---------------------------------------------------------------------------

create or replace function public.get_wardrobe()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  if exists (select 1 from public.profiles p where p.id = v_uid) then
    perform private.grant_starter_items(v_uid);
  end if;
  return private.wardrobe_state(v_uid);
end;
$$;

/**
 * Salva atomicamente o equipamento de um visual e, opcionalmente, a aparência
 * (ex.: cabelo trocado no guarda-roupa). Ambos com controle de versão.
 */
create or replace function public.save_wardrobe(
  p_loadout_id uuid,
  p_equipment jsonb,
  p_expected_loadout_version int,
  p_appearance jsonb default null,
  p_expected_appearance_version int default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_version int;
begin
  if p_appearance is not null then
    select a.version into v_version from public.avatar_appearances a where a.user_id = v_uid for update;
    if not found then
      raise exception using errcode = 'P0001', message = 'avatar_required';
    end if;
    if p_expected_appearance_version is not null and p_expected_appearance_version <> v_version then
      raise exception using errcode = 'P0001', message = 'version_conflict';
    end if;
    update public.avatar_appearances a set
      body_id = coalesce(p_appearance ->> 'bodyId', a.body_id),
      skin_tone_id = coalesce(p_appearance ->> 'skinToneId', a.skin_tone_id),
      eyes_id = coalesce(p_appearance ->> 'eyesId', a.eyes_id),
      brows_id = coalesce(p_appearance ->> 'browsId', a.brows_id),
      expression_id = coalesce(p_appearance ->> 'expressionId', a.expression_id),
      beard_id = coalesce(p_appearance ->> 'beardId', a.beard_id),
      hair_style_id = coalesce(p_appearance ->> 'hairStyleId', a.hair_style_id),
      hair_color_id = coalesce(p_appearance ->> 'hairColorId', a.hair_color_id),
      version = a.version + 1
    where a.user_id = v_uid;
  end if;
  perform private.write_loadout(v_uid, p_loadout_id, p_equipment, p_expected_loadout_version);
  return private.wardrobe_state(v_uid);
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
  select coalesce(jsonb_object_agg(e.slot, e.item_id), '{}'::jsonb) into v_eq
  from public.avatar_loadout_equipment e join public.avatar_loadouts l on l.id = e.loadout_id
  where l.id = p_loadout_id and l.user_id = v_uid;
  perform private.write_loadout(v_uid, p_loadout_id, v_eq || jsonb_build_object(v_slot, p_item_id), p_expected_version);
  return private.wardrobe_state(v_uid);
end;
$$;

create or replace function public.unequip_slot(p_loadout_id uuid, p_slot text, p_expected_version int default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_eq jsonb;
begin
  select coalesce(jsonb_object_agg(e.slot, e.item_id), '{}'::jsonb) into v_eq
  from public.avatar_loadout_equipment e join public.avatar_loadouts l on l.id = e.loadout_id
  where l.id = p_loadout_id and l.user_id = v_uid;
  perform private.write_loadout(v_uid, p_loadout_id, v_eq - p_slot, p_expected_version);
  return private.wardrobe_state(v_uid);
end;
$$;

create or replace function public.create_loadout(p_name text, p_copy_from uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_name text := btrim(coalesce(p_name, ''));
  v_source uuid;
  v_new uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 7));
  if char_length(v_name) not between 1 and 30 then
    raise exception using errcode = 'P0001', message = 'invalid_name';
  end if;
  if (select count(*) from public.avatar_loadouts l where l.user_id = v_uid) >= private.loadout_limit(v_uid) then
    raise exception using errcode = 'P0001', message = 'loadout_limit_reached';
  end if;
  select l.id into v_source from public.avatar_loadouts l
  where l.user_id = v_uid and (l.id = p_copy_from or (p_copy_from is null and l.is_active));
  if v_source is null then
    raise exception using errcode = 'P0001', message = 'loadout_not_found';
  end if;
  insert into public.avatar_loadouts (user_id, name, is_active) values (v_uid, v_name, false) returning id into v_new;
  insert into public.avatar_loadout_equipment (loadout_id, slot, item_id)
  select v_new, e.slot, e.item_id from public.avatar_loadout_equipment e where e.loadout_id = v_source;
  return private.wardrobe_state(v_uid);
end;
$$;

create or replace function public.rename_loadout(p_loadout_id uuid, p_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_name text := btrim(coalesce(p_name, ''));
begin
  if char_length(v_name) not between 1 and 30 then
    raise exception using errcode = 'P0001', message = 'invalid_name';
  end if;
  if not exists (select 1 from public.avatar_loadouts l where l.id = p_loadout_id and l.user_id = v_uid) then
    raise exception using errcode = 'P0001', message = 'loadout_not_found';
  end if;
  if private.loadout_is_locked(v_uid, p_loadout_id) then
    raise exception using errcode = 'P0001', message = 'loadout_locked';
  end if;
  update public.avatar_loadouts l set name = v_name, version = l.version + 1 where l.id = p_loadout_id;
  return private.wardrobe_state(v_uid);
end;
$$;

create or replace function public.activate_loadout(p_loadout_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 7));
  if not exists (select 1 from public.avatar_loadouts l where l.id = p_loadout_id and l.user_id = v_uid) then
    raise exception using errcode = 'P0001', message = 'loadout_not_found';
  end if;
  if private.loadout_is_locked(v_uid, p_loadout_id) then
    raise exception using errcode = 'P0001', message = 'loadout_locked';
  end if;
  update public.avatar_loadouts l set is_active = false where l.user_id = v_uid and l.is_active and l.id <> p_loadout_id;
  update public.avatar_loadouts l set is_active = true where l.id = p_loadout_id;
  return private.wardrobe_state(v_uid);
end;
$$;

create or replace function public.delete_loadout(p_loadout_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_was_active boolean;
  v_next uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 7));
  select l.is_active into v_was_active from public.avatar_loadouts l where l.id = p_loadout_id and l.user_id = v_uid;
  if v_was_active is null then
    raise exception using errcode = 'P0001', message = 'loadout_not_found';
  end if;
  if (select count(*) from public.avatar_loadouts l where l.user_id = v_uid) <= 1 then
    raise exception using errcode = 'P0001', message = 'last_loadout';
  end if;
  delete from public.avatar_loadouts l where l.id = p_loadout_id;
  if v_was_active then
    select l.id into v_next from public.avatar_loadouts l where l.user_id = v_uid order by l.created_at, l.id limit 1;
    update public.avatar_loadouts l set is_active = true where l.id = v_next;
  end if;
  return private.wardrobe_state(v_uid);
end;
$$;

create or replace function public.get_collections()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id, 'name', c.name, 'description', c.description,
      'items', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'itemId', ci.item_id,
          'owned', exists (select 1 from public.user_items ui where ui.user_id = v_uid and ui.item_id = ci.item_id)
        ) order by ci.sort_order), '[]'::jsonb)
        from public.collection_items ci where ci.collection_id = c.id
      ),
      'rewardItemId', c.reward_item_id,
      'rewardOwned', exists (select 1 from public.user_items ui where ui.user_id = v_uid and ui.item_id = c.reward_item_id),
      'completed', private.collection_complete(v_uid, c.id)
    ) order by c.sort_order)
    from public.item_collections c where c.is_active
  ), '[]'::jsonb);
end;
$$;

-- ---------------------------------------------------------------------------
-- Perfil público (projeção mínima) e privacidade
-- ---------------------------------------------------------------------------

/**
 * Retorna só o que o dono consentiu em mostrar: nome, username e visual ativo.
 * 'public' = qualquer usuário autenticado; 'friends' = por enquanto só o próprio
 * (amizades chegam no Marco 4); 'private' = só o próprio.
 */
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
    'equipment', v_state -> 'equipment'
  );
end;
$$;

create or replace function public.set_privacy_mode(p_mode text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_row public.profiles;
begin
  if p_mode not in ('private', 'friends', 'public') then
    raise exception using errcode = 'P0001', message = 'invalid_privacy_mode';
  end if;
  update public.profiles p set privacy_mode = p_mode::public.privacy_mode where p.id = v_uid returning * into v_row;
  if v_row.id is null then
    raise exception using errcode = 'P0001', message = 'profile_required';
  end if;
  return v_row;
end;
$$;

revoke all on function
  public.get_wardrobe(), public.save_wardrobe(uuid, jsonb, int, jsonb, int),
  public.equip_item(uuid, text, int), public.unequip_slot(uuid, text, int),
  public.create_loadout(text, uuid), public.rename_loadout(uuid, text),
  public.activate_loadout(uuid), public.delete_loadout(uuid),
  public.get_collections(), public.get_public_avatar(text), public.set_privacy_mode(text)
from public, anon;

grant execute on function
  public.get_wardrobe(), public.save_wardrobe(uuid, jsonb, int, jsonb, int),
  public.equip_item(uuid, text, int), public.unequip_slot(uuid, text, int),
  public.create_loadout(text, uuid), public.rename_loadout(uuid, text),
  public.activate_loadout(uuid), public.delete_loadout(uuid),
  public.get_collections(), public.get_public_avatar(text), public.set_privacy_mode(text)
to authenticated;
