-- Desfaz a rotação mantendo a vitrine v1, as compras, os Siclos e os itens.
drop function public.purchase_market_item(uuid, text, int, date);

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

drop function private.purchase_market_item_at(uuid, text, int, date, timestamptz);
drop function private.market_state(uuid, timestamptz);
drop function private.market_offers(date);
drop function private.market_rotation_day(timestamptz);
