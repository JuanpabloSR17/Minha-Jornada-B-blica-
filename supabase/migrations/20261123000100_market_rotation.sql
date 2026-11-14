-- Mercado dos Viajantes: horário e seleção da vitrine são definidos pelo servidor.
-- O sorteio é compartilhado por todas as contas e se mantém estável até a virada.
create or replace function private.market_rotation_day(p_at timestamptz)
returns date
language sql
stable
set search_path = ''
as $$
  select ((p_at at time zone 'America/Sao_Paulo') - interval '21 hours')::date
$$;

create or replace function private.market_offers(p_day date)
returns table (item_id text, section text)
language sql
stable
set search_path = ''
as $$
  with eligible as (
    select i.id,
      case
        when i.shop_price_suggested is null or i.id in (
          'common_cantil_de_agua', 'common_ferramenta_da_colheita',
          'common_lamparina_de_barro', 'common_tunica_de_linho_cru'
        ) then 'essentials'
        when i.rarity = 'rare' then 'rare'
        when i.slot in ('outfit', 'back', 'feet', 'head') then 'wear'
        else 'gear'
      end as kind
    from public.cosmetic_items i
    where i.rarity in ('common', 'rare') and private.market_status(i) is not null
  ), ranked as (
    select e.*,
      row_number() over (partition by e.kind order by md5(case when e.kind = 'rare' then e.id else p_day::text || ':' || e.id end), e.id) as position,
      count(*) over (partition by e.kind) as pool_size
    from eligible e
  )
  select id, case when kind = 'essentials' then 'essentials' else 'daily' end
  from ranked
  where kind = 'essentials'
    or (kind in ('gear', 'wear') and position <= case when kind = 'gear' then 3 else 2 end)
    -- Os Raros percorrem uma ordem embaralhada fixa, mudando ao menos uma oferta a cada dia.
    or (kind = 'rare' and mod(position - 1 - (p_day - date '2000-01-01') % pool_size + pool_size, pool_size) < 2)
$$;

-- Um reenvio já registrado é recuperado antes de checar a nova vitrine.

create or replace function private.purchase_market_item_at(
  p_purchase_id uuid, p_item text, p_price int, p_offer_day date, p_at timestamptz
)
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
  v_day date;
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
  v_day := private.market_rotation_day(coalesce(p_at, clock_timestamp()));
  if (p_offer_day is not null and p_offer_day <> v_day)
     or not exists (select 1 from private.market_offers(v_day) o where o.item_id = v_item.id) then
    raise exception using errcode = 'P0001', message = 'market_offer_expired';
  end if;
  if p_price is not null and p_price <> v_item.shop_price_suggested then
    raise exception using errcode = 'P0001', message = 'market_price_changed';
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

-- Clientes antigos ainda podem comprar usando os dois parâmetros. O servidor também
-- valida a vitrine nesse caminho. Clientes novos informam o preço e o dia apresentados.
create or replace function public.purchase_market_item(p_purchase_id uuid, p_item text)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.purchase_market_item_at(p_purchase_id, p_item, null, null, null)
$$;

create or replace function public.purchase_market_item(p_purchase_id uuid, p_item text, p_price int, p_offer_day date)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.purchase_market_item_at(p_purchase_id, p_item, p_price, p_offer_day, null)
$$;

create or replace function private.market_state(p_user uuid, p_at timestamptz)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'siclosBalance', private.siclos_balance(p_user),
    'rotation', jsonb_build_object(
      'day', rotation.day,
      'serverNow', p_at,
      'nextAt', ((rotation.day + 1) + time '21:00') at time zone 'America/Sao_Paulo'
    ),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'itemId', i.id,
        'price', i.shop_price_suggested,
        'status', private.market_status(i),
        'owned', private.owns_canonical(p_user, i.id),
        'section', o.section)
        order by o.section, i.shop_price_suggested nulls last, i.name, i.id)
      from private.market_offers(rotation.day) o
      join public.cosmetic_items i on i.id = o.item_id
    ), '[]'::jsonb),
    'purchases', coalesce((
      select jsonb_agg(jsonb_build_object(
        'purchaseId', m.id, 'itemId', m.item_id, 'price', m.price, 'createdAt', m.created_at)
        order by m.created_at desc)
      from public.market_purchases m where m.user_id = p_user
    ), '[]'::jsonb)
  )
  from (select private.market_rotation_day(p_at) as day) rotation
$$;

create or replace function public.get_market()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select private.market_state(private.require_uid(), statement_timestamp())
$$;

revoke all on function private.market_rotation_day(timestamptz),
  private.market_offers(date), private.market_state(uuid, timestamptz),
  private.purchase_market_item_at(uuid, text, int, date, timestamptz) from public, anon, authenticated;
revoke all on function public.purchase_market_item(uuid, text, int, date) from public, anon;
grant execute on function public.purchase_market_item(uuid, text, int, date) to authenticated;
