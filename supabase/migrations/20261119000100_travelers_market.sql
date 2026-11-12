-- Jornada Bíblica — Mercado dos Viajantes (v1): comprar itens cosméticos com Siclos.
-- Aditiva: não altera migrações anteriores e não apaga dados.
--
--  * À venda: itens ativos com cosmetic_items.shop_eligible (catálogo oficial: loja = true),
--    não Santos, não Premium, não peças iniciais. Preço = shop_price_suggested
--    (preco_siclos_sugerido do catálogo oficial). Sem preço → listado, mas compra indisponível.
--  * Compra = débito em siclos_ledger + posse em user_items na MESMA transação, sob a trava do
--    jogador (a mesma das missões e da escolha gratuita). Saldo nunca fica negativo.
--  * O ID da compra é gerado pelo app e é a chave de idempotência: reenviar devolve o resultado
--    registrado. No máximo uma compra por jogador e item (único).
--  * Identidade canônica: IDs antigos/aliases resolvem para o item atual, e a posse registrada
--    com um ID antigo conta como posse do item.

-- ---------------------------------------------------------------------------
-- Posse pela identidade canônica
-- ---------------------------------------------------------------------------

create or replace function private.owns_canonical(p_user uuid, p_item text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_items ui
    where ui.user_id = p_user
      and (ui.item_id = p_item
           or exists (select 1 from public.cosmetic_item_aliases a where a.alias_id = ui.item_id and a.item_id = p_item)));
$$;

-- escolha gratuita da meta: elegibilidade também reconhece posse por ID antigo
create or replace function private.eligible_commons(p_user uuid)
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  select i.id
  from public.cosmetic_items i
  where i.is_active and i.rarity = 'common' and not i.is_premium_cosmetic and not i.is_starter
    and exists (select 1 from public.item_unlock_rules r where r.item_id = i.id and r.is_active
                and r.rule_type = 'mission_pool' and r.rule_payload ->> 'pool' = 'common')
    and not private.owns_canonical(p_user, i.id);
$$;

-- escolha gratuita: posse por ID antigo também bloqueia (mesma regra da compra)
create or replace function public.claim_daily_goal_item(p_day date, p_item text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_goal public.daily_goals;
  v_rule uuid;
  v_granted text[];
begin
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 42));
  select * into v_goal from public.daily_goals g where g.user_id = v_uid and g.day = p_day for update;
  if v_goal.user_id is null then
    raise exception using errcode = 'P0001', message = 'goal_not_found';
  end if;
  if v_goal.chosen_item is not null then
    if v_goal.chosen_item = p_item then
      return jsonb_build_object('duplicate', true, 'granted', '[]'::jsonb, 'itemId', p_item,
        'goal', private.daily_goal_state(v_uid, p_day), 'siclosBalance', private.siclos_balance(v_uid));
    end if;
    raise exception using errcode = 'P0001', message = 'goal_choice_already_made';
  end if;
  if p_item is null or not (p_item = any (v_goal.options)) then
    raise exception using errcode = 'P0001', message = 'invalid_goal_choice';
  end if;
  if private.owns_canonical(v_uid, p_item) then
    raise exception using errcode = 'P0001', message = 'item_already_owned';
  end if;

  insert into public.user_items (user_id, item_id, source_event_id) values (v_uid, p_item, 'goal:' || p_day::text);
  select r.id into v_rule from public.item_unlock_rules r
  where r.item_id = p_item and r.rule_type = 'mission_pool' and r.is_active order by r.revision desc limit 1;
  if v_rule is not null then
    insert into public.reward_events (user_id, rule_id, item_id, source_event_id)
    values (v_uid, v_rule, p_item, 'goal:' || p_day::text)
    on conflict do nothing;
  end if;
  update public.daily_goals set chosen_item = p_item, chosen_at = now() where user_id = v_uid and day = p_day;
  -- o item novo pode completar uma coleção
  v_granted := private.evaluate_rewards(v_uid, 'goal-choice:' || p_day::text);
  return jsonb_build_object('duplicate', false, 'itemId', p_item,
    'granted', to_jsonb(array[p_item] || coalesce(v_granted, '{}')),
    'goal', private.daily_goal_state(v_uid, p_day), 'siclosBalance', private.siclos_balance(v_uid));
end;
$$;

-- ---------------------------------------------------------------------------
-- Compras
-- ---------------------------------------------------------------------------

create table public.market_purchases (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id text not null references public.cosmetic_items (id),
  requested_item_id text not null,
  price int not null check (price > 0),
  result jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, item_id)
);
alter table public.market_purchases enable row level security;
revoke all on public.market_purchases from anon, authenticated;
grant select on public.market_purchases to authenticated;
create policy "dono lê as próprias compras" on public.market_purchases for select to authenticated using (user_id = auth.uid());

/** Situação de venda de um item canônico: 'available', 'price_pending' ou null (fora da loja). */
create or replace function private.market_status(p_item public.cosmetic_items)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when not p_item.is_active or not p_item.shop_eligible or p_item.rarity = 'holy'
         or p_item.is_premium_cosmetic or p_item.is_starter then null
    when p_item.shop_price_suggested is null then 'price_pending'
    else 'available' end;
$$;

/**
 * Compra p_item com Siclos. p_purchase_id (UUID gerado pelo app) torna a compra idempotente:
 * reenviar a mesma compra devolve o resultado registrado com duplicate = true.
 */
create or replace function public.purchase_market_item(p_purchase_id uuid, p_item text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_existing public.market_purchases;
  v_item public.cosmetic_items;
  v_canonical text;
  v_balance int;
  v_granted text[];
  v_result jsonb;
begin
  if p_purchase_id is null or p_item is null then
    raise exception using errcode = 'P0001', message = 'invalid_purchase';
  end if;
  if not exists (select 1 from public.profiles p where p.id = v_uid) then
    raise exception using errcode = 'P0001', message = 'profile_required';
  end if;
  -- mesma trava de missões, metas e escolha gratuita: tudo do jogador é serializado
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 42));
  v_canonical := private.resolve_item_id(p_item);

  select * into v_existing from public.market_purchases m where m.id = p_purchase_id;
  if found then
    if v_existing.user_id <> v_uid or v_existing.item_id <> v_canonical then
      raise exception using errcode = 'P0001', message = 'invalid_purchase';
    end if;
    return v_existing.result || jsonb_build_object('duplicate', true, 'siclosBalance', private.siclos_balance(v_uid));
  end if;

  select * into v_item from public.cosmetic_items i where i.id = v_canonical;
  if v_item.id is null or private.market_status(v_item) is null then
    raise exception using errcode = 'P0001', message = 'item_not_for_sale', detail = p_item;
  end if;
  if private.market_status(v_item) = 'price_pending' then
    raise exception using errcode = 'P0001', message = 'price_not_defined', detail = v_item.id;
  end if;
  if private.owns_canonical(v_uid, v_item.id) then
    raise exception using errcode = 'P0001', message = 'item_already_owned', detail = v_item.id;
  end if;
  v_balance := private.siclos_balance(v_uid);
  if v_balance < v_item.shop_price_suggested then
    raise exception using errcode = 'P0001', message = 'insufficient_siclos',
      detail = format('saldo %s, preço %s', v_balance, v_item.shop_price_suggested);
  end if;

  insert into public.siclos_ledger (user_id, event_type, source_event_id, amount)
  values (v_uid, 'MARKET_PURCHASE', 'purchase:' || p_purchase_id::text, -v_item.shop_price_suggested);
  insert into public.user_items (user_id, item_id, source_event_id)
  values (v_uid, v_item.id, 'purchase:' || p_purchase_id::text);
  if private.siclos_balance(v_uid) < 0 then
    raise exception using errcode = 'P0001', message = 'insufficient_siclos'; -- defesa extra: desfaz tudo
  end if;
  -- o item comprado pode completar uma coleção
  v_granted := private.evaluate_rewards(v_uid, 'purchase:' || p_purchase_id::text);

  v_result := jsonb_build_object(
    'purchaseId', p_purchase_id,
    'itemId', v_item.id,
    'requestedItemId', p_item,
    'price', v_item.shop_price_suggested,
    'granted', to_jsonb(array[v_item.id] || coalesce(v_granted, '{}')),
    'siclosBalance', private.siclos_balance(v_uid),
    'duplicate', false);
  insert into public.market_purchases (id, user_id, item_id, requested_item_id, price, result)
  values (p_purchase_id, v_uid, v_item.id, p_item, v_item.shop_price_suggested, v_result);
  return v_result;
end;
$$;

/** Vitrine: itens da loja com preço e posse (canônica), saldo e compras do jogador. */
create or replace function public.get_market()
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
    'siclosBalance', private.siclos_balance(v_uid),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'itemId', i.id,
        'price', i.shop_price_suggested,
        'status', private.market_status(i),
        'owned', private.owns_canonical(v_uid, i.id))
        order by i.shop_price_suggested nulls last, i.rarity, i.name)
      from public.cosmetic_items i where private.market_status(i) is not null), '[]'::jsonb),
    'purchases', coalesce((
      select jsonb_agg(jsonb_build_object('purchaseId', m.id, 'itemId', m.item_id, 'price', m.price, 'createdAt', m.created_at)
        order by m.created_at desc)
      from public.market_purchases m where m.user_id = v_uid), '[]'::jsonb));
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated;
revoke all on function public.purchase_market_item(uuid, text) from public, anon;
revoke all on function public.get_market() from public, anon;
grant execute on function public.purchase_market_item(uuid, text) to authenticated;
grant execute on function public.get_market() to authenticated;
