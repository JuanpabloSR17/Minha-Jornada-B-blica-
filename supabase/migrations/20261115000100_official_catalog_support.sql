-- Jornada Bíblica — suporte ao catálogo oficial de raridades (v2 do arquivo oficial).
-- Aditiva: não altera migrações anteriores e não apaga dados.
--  * IDs oficiais (com "_") aceitos; aliases de compatibilidade entre IDs
--  * Novos slots: chest, special, effect, back_item (separado de "back" = manto)
--  * Metadados editoriais: representação (literal/inspirada/metafórica/simbólica), significado, referente
--  * Loja futura só como metadado (nunca para itens Santos; nada é vendável/negociável)
--  * Regras com is_active (troca de regra sem apagar histórico) e regra "mission_pool"
--  * Progresso bíblico calculado no servidor (get_reading_progress)

-- ---------------------------------------------------------------------------
-- IDs, slots e metadados
-- ---------------------------------------------------------------------------

alter table public.cosmetic_items drop constraint if exists cosmetic_items_id_check;
alter table public.cosmetic_items add constraint cosmetic_items_id_check check (id ~ '^[a-z0-9_-]{3,64}$');

alter table public.cosmetic_items drop constraint if exists cosmetic_items_slot_check;
alter table public.cosmetic_items add constraint cosmetic_items_slot_check check (slot in (
  'outfit', 'back', 'feet', 'waist', 'neck', 'head', 'hands', 'background', 'frame',
  'chest', 'special', 'effect', 'back_item', 'relic'
));

alter table public.cosmetic_items
  add column if not exists representation text not null default 'inspired'
    check (representation in ('literal', 'inspired', 'metaphorical', 'symbolic')),
  add column if not exists meaning text,
  add column if not exists referent text,
  add column if not exists holy_subtype text,
  add column if not exists shop_eligible boolean not null default false,
  add column if not exists shop_price_suggested int check (shop_price_suggested is null or shop_price_suggested > 0);

alter table public.cosmetic_items drop constraint if exists cosmetic_items_holy_not_for_sale;
alter table public.cosmetic_items add constraint cosmetic_items_holy_not_for_sale
  check (rarity <> 'holy' or not shop_eligible);

comment on column public.cosmetic_items.representation is 'literal = descrito no texto; inspired/metaphorical/symbolic = associação interpretativa (exibida como "inspirado em").';
comment on column public.cosmetic_items.shop_eligible is 'Elegível à futura loja de Siclos (metadado; não há loja implementada). Itens Santos nunca.';

-- um lendário ATIVO por livro (itens desativados do rascunho não contam)
drop index if exists public.cosmetic_items_one_legendary_per_book;
create unique index cosmetic_items_one_legendary_per_book
  on public.cosmetic_items (book_code) where rarity = 'legendary' and book_code is not null and is_active;

-- ---------------------------------------------------------------------------
-- Aliases de compatibilidade (ID oficial ↔ ID do projeto)
-- ---------------------------------------------------------------------------

create table public.cosmetic_item_aliases (
  alias_id text primary key check (alias_id ~ '^[a-z0-9_-]{3,64}$'),
  item_id text not null references public.cosmetic_items (id),
  source text not null check (source in ('official', 'draft')),
  created_at timestamptz not null default now(),
  check (alias_id <> item_id)
);

alter table public.cosmetic_item_aliases enable row level security;
revoke all on public.cosmetic_item_aliases from anon, authenticated;
grant select on public.cosmetic_item_aliases to anon, authenticated;
create policy "aliases são públicos" on public.cosmetic_item_aliases for select to anon, authenticated using (true);

create or replace function private.resolve_item_id(p_id text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select a.item_id from public.cosmetic_item_aliases a where a.alias_id = p_id), p_id);
$$;

/**
 * Leva posse e equipamento de IDs antigos (aliases que são itens) para o ID canônico.
 * Idempotente; nunca apaga posse. Equipamento:
 *  - mesmo slot: troca pelo ID canônico;
 *  - slot diferente: o item canônico vai para o slot novo (se estiver livre) e sai do antigo;
 *  - item desativado que continua equipado sai do visual (a túnica volta para a túnica inicial),
 *    para que nenhum visual fique inválido. A posse do item antigo é mantida.
 */
create or replace function private.apply_item_aliases()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int := 0;
  v_n int;
begin
  insert into public.user_items (user_id, item_id, unlocked_at, source_event_id)
  select ui.user_id, a.item_id, ui.unlocked_at, 'alias:' || a.alias_id
  from public.user_items ui
  join public.cosmetic_item_aliases a on a.alias_id = ui.item_id
  on conflict (user_id, item_id) do nothing;
  get diagnostics v_n = row_count;
  v_count := v_count + v_n;

  -- mesmo slot
  update public.avatar_loadout_equipment e
  set item_id = a.item_id
  from public.cosmetic_item_aliases a, public.cosmetic_items c
  where a.alias_id = e.item_id and c.id = a.item_id and c.slot = e.slot;
  get diagnostics v_n = row_count;
  v_count := v_count + v_n;

  -- slot diferente (relíquias nunca são equipadas)
  insert into public.avatar_loadout_equipment (loadout_id, slot, item_id)
  select e.loadout_id, c.slot, c.id
  from public.avatar_loadout_equipment e
  join public.cosmetic_item_aliases a on a.alias_id = e.item_id
  join public.cosmetic_items c on c.id = a.item_id and c.is_active and c.slot <> e.slot and c.slot <> 'relic'
  on conflict (loadout_id, slot) do nothing;
  get diagnostics v_n = row_count;
  v_count := v_count + v_n;

  -- itens inativos que ainda estão equipados
  update public.avatar_loadout_equipment e
  set item_id = 'tunic-linen'
  from public.cosmetic_items c, public.avatar_loadouts l
  where c.id = e.item_id and not c.is_active and e.slot = 'outfit' and l.id = e.loadout_id
    and exists (select 1 from public.user_items ui where ui.user_id = l.user_id and ui.item_id = 'tunic-linen');
  delete from public.avatar_loadout_equipment e
  using public.cosmetic_items c
  where c.id = e.item_id and not c.is_active and e.slot <> 'outfit';
  get diagnostics v_n = row_count;
  return v_count + v_n;
end;
$$;

-- ---------------------------------------------------------------------------
-- Regras: ativação e "mission_pool"
-- ---------------------------------------------------------------------------

alter table public.item_unlock_rules add column if not exists is_active boolean not null default true;

alter table public.item_unlock_rules drop constraint if exists item_unlock_rules_rule_type_check;
alter table public.item_unlock_rules add constraint item_unlock_rules_rule_type_check check (rule_type in (
  'starter', 'chapter_completed', 'book_completed', 'chapters_count', 'composite',
  'world_completed', 'reading_streak', 'achievement_unlocked', 'collection_completed',
  'mission_completed', 'milestone_reached', 'mission_pool'
));
comment on column public.item_unlock_rules.rule_type is 'mission_pool: item oferecido como escolha em recompensas de missão (Modo Missão); nunca concedido automaticamente.';

alter table public.reward_triggers drop constraint if exists reward_triggers_id_check;
alter table public.reward_triggers add constraint reward_triggers_id_check check (id ~ '^[a-z0-9_-]{3,64}$');

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
      where r.is_active and r.rule_type not in ('starter', 'mission_pool')
        and not exists (select 1 from public.reward_events re where re.user_id = p_user and re.rule_id = r.id)
        and not exists (select 1 from public.user_items ui where ui.user_id = p_user and ui.item_id = r.item_id)
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

-- ---------------------------------------------------------------------------
-- Equipamento: novos slots e IDs por alias
-- ---------------------------------------------------------------------------

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
  v_allowed constant text[] := array[
    'outfit', 'back', 'feet', 'waist', 'neck', 'head', 'hands', 'background', 'frame',
    'chest', 'special', 'effect', 'back_item'
  ];
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
  v_item text := private.resolve_item_id(p_item_id);
  v_slot text;
  v_eq jsonb;
begin
  select i.slot into v_slot from public.cosmetic_items i where i.id = v_item and i.is_active;
  if v_slot is null then
    raise exception using errcode = 'P0001', message = 'item_not_found', detail = p_item_id;
  end if;
  if v_slot = 'relic' then
    raise exception using errcode = 'P0001', message = 'item_not_equippable', detail = p_item_id;
  end if;
  select coalesce(jsonb_object_agg(e.slot, e.item_id), '{}'::jsonb) into v_eq
  from public.avatar_loadout_equipment e join public.avatar_loadouts l on l.id = e.loadout_id
  where l.id = p_loadout_id and l.user_id = v_uid;
  perform private.write_loadout(v_uid, p_loadout_id, v_eq || jsonb_build_object(v_slot, v_item), p_expected_version);
  return private.wardrobe_state(v_uid);
end;
$$;

-- ---------------------------------------------------------------------------
-- Progresso bíblico calculado no servidor (contrato com a leitura)
-- ---------------------------------------------------------------------------

/**
 * Progresso do usuário a partir dos capítulos concluídos registrados pelo servidor:
 * capítulos distintos, % da Bíblia, livros concluídos, lendário de cada livro e
 * recompensas de leitura ainda disponíveis (com o que falta para cada uma).
 */
create or replace function public.get_reading_progress()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  return (
    with done as (
      select distinct d.payload ->> 'book' as book, (d.payload ->> 'chapter')::int as chapter
      from private.domain_events d
      where d.user_id = v_uid and d.event_type = 'CHAPTER_COMPLETED'
    ),
    per_book as (
      select b.code, b.name, b.chapters, b.book_order, count(done.chapter)::int as completed
      from public.bible_books b left join done on done.book = b.code
      group by b.code, b.name, b.chapters, b.book_order
    ),
    pending as (
      select r.item_id, r.rule_type, r.rule_payload
      from public.item_unlock_rules r
      join public.cosmetic_items i on i.id = r.item_id and i.is_active and not i.is_premium_cosmetic
      where r.is_active and r.rule_type in ('chapter_completed', 'book_completed', 'chapters_count')
        and not exists (select 1 from public.user_items ui where ui.user_id = v_uid and ui.item_id = r.item_id)
    )
    select jsonb_build_object(
      'chaptersCompleted', coalesce(sum(p.completed), 0),
      'totalChapters', (select sum(chapters) from public.bible_books),
      'percent', round(coalesce(sum(p.completed), 0) * 100.0 / (select sum(chapters) from public.bible_books), 2),
      'booksCompleted', count(*) filter (where p.completed = p.chapters),
      'books', jsonb_agg(jsonb_build_object(
        'book', p.code, 'name', p.name, 'completed', p.completed, 'total', p.chapters,
        'isComplete', p.completed = p.chapters,
        'legendaryItemId', (select i.id from public.cosmetic_items i where i.rarity = 'legendary' and i.book_code = p.code and i.is_active),
        'legendaryOwned', exists (
          select 1 from public.user_items ui join public.cosmetic_items i on i.id = ui.item_id
          where ui.user_id = v_uid and i.rarity = 'legendary' and i.book_code = p.code and i.is_active)
      ) order by p.book_order),
      'rewardsAvailable', coalesce((
        select jsonb_agg(jsonb_build_object(
          'itemId', x.item_id, 'rule', x.rule_type, 'book', x.rule_payload ->> 'book',
          'chapter', (x.rule_payload ->> 'chapter')::int,
          'remaining', case x.rule_type
            when 'chapter_completed' then 1
            when 'book_completed' then (select pb.chapters - pb.completed from per_book pb where pb.code = x.rule_payload ->> 'book')
            else greatest(0, (x.rule_payload ->> 'count')::int - (
              select count(*) from done where x.rule_payload ->> 'book' is null or done.book = x.rule_payload ->> 'book'))
          end
        ))
        from pending x
      ), '[]'::jsonb)
    )
    from per_book p
  );
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated;
revoke all on function public.get_reading_progress() from public, anon;
grant execute on function public.get_reading_progress() to authenticated;
