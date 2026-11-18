-- Loja de skins (Mercado dos Viajantes): a loja passa a vender só skins (traje completo pintado em
-- 3 estilos). Migração aditiva: o Mercado de peças continua no banco, mas sai do app.
--
-- Preço justo = dias de meta diária × Siclos da meta (hoje 40): Comum 4 dias (160), Rara 10 dias (400),
-- Épica 25 dias (1.000). Se a recompensa da meta mudar, os preços acompanham. Lendárias e Gloriosas
-- não se compram: só lendo.
-- Vitrine (vira às 21h de Brasília, como antes): 3 Comuns e 3 Raras por dia + a Épica da semana, grátis
-- no dia de presente (economy_rules.skin_gift_weekday; 0 = domingo).
-- Compra idempotente pelo ID gerado no aparelho, com a mesma trava por jogador de missões, metas e
-- Mercado: sem cobrança dupla, sem compra de skin já possuída. Siclos continuam só vindo da leitura.

insert into public.rarities (id, name, sort_order, color, description, is_active) values
  ('glorious', 'Glorioso', 7, '#F2D27A', 'O momento marcante de um personagem primário. Só lendo.', true)
on conflict (id) do nothing;

insert into public.economy_rules (key, value, description) values
  ('skin_days_common', 4, 'Preço de uma skin Comum, em dias de meta diária.'),
  ('skin_days_rare', 10, 'Preço de uma skin Rara, em dias de meta diária.'),
  ('skin_days_epic', 25, 'Preço de uma skin Épica, em dias de meta diária.'),
  ('skin_gift_weekday', 0, 'Dia da semana (0 = domingo) em que a Épica da semana sai de graça.'),
  ('skin_shop_commons', 3, 'Skins Comuns na vitrine do dia.'),
  ('skin_shop_rares', 3, 'Skins Raras na vitrine do dia.')
on conflict (key) do nothing;

create table public.skins (
  id text primary key check (id ~ '^[a-z0-9_]{3,80}$'),
  name text not null,
  rarity text not null check (rarity in ('common', 'rare', 'epic', 'legendary', 'glorious')),
  origin text not null check (origin in ('inicio', 'leitura', 'missao', 'temporada-gratis', 'temporada-premium', 'loja', 'siclos')),
  scripture_ref text,
  season text,
  in_shop boolean not null default false,
  sort_order int not null default 0,
  is_active boolean not null default true,
  -- Lendárias e Gloriosas nunca vão para a loja
  check (not in_shop or rarity in ('common', 'rare', 'epic'))
);
alter table public.skins enable row level security;
revoke all on public.skins from anon, authenticated;
grant select on public.skins to authenticated;
create policy "skins legíveis" on public.skins for select to authenticated using (is_active);

create table public.user_skins (
  user_id uuid not null references public.profiles (id) on delete cascade,
  skin_id text not null references public.skins (id),
  source_event_id text not null,
  acquired_at timestamptz not null default now(),
  primary key (user_id, skin_id)
);
alter table public.user_skins enable row level security;
revoke all on public.user_skins from anon, authenticated;
grant select on public.user_skins to authenticated;
create policy "dono lê as próprias skins" on public.user_skins for select to authenticated using (user_id = (select auth.uid()));

create table public.skin_purchases (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  skin_id text not null references public.skins (id),
  price int not null check (price >= 0),
  gift boolean not null default false,
  result jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.skin_purchases enable row level security;
revoke all on public.skin_purchases from anon, authenticated;
grant select on public.skin_purchases to authenticated;
create policy "dono lê as próprias compras de skins" on public.skin_purchases for select to authenticated using (user_id = (select auth.uid()));
create index skin_purchases_user on public.skin_purchases (user_id, created_at desc);

insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order) values
  ('glorioso_moises_rosto_resplandecente', 'Moisés com o rosto resplandecente', 'glorious', 'leitura', 'Êxodo 34:29', 't1-exodo', false, 1),
  ('glorioso_arao_vara_floresceu', 'Arão e a vara que floresceu', 'glorious', 'leitura', 'Números 17:8', 't1-exodo', false, 2),
  ('lendario_moises', 'Manto de Moisés', 'legendary', 'leitura', 'Êxodo 4:2', 't1-exodo', false, 3),
  ('lendario_arao', 'Vestes de Arão', 'legendary', 'leitura', 'Êxodo 28', 't1-exodo', false, 4),
  ('epico_miria', 'Tamborim de Miriã', 'epic', 'temporada-premium', 'Êxodo 15:20', 't1-exodo', false, 5),
  ('epico_bezalel', 'Avental de Bezalel', 'epic', 'temporada-gratis', 'Êxodo 31:2-5', 't1-exodo', false, 6),
  ('epico_jetro', 'Manto de Jetro', 'epic', 'temporada-premium', 'Êxodo 18:1', 't1-exodo', false, 7),
  ('epico_zipora', 'Véu de Zípora', 'epic', 'temporada-gratis', 'Êxodo 2:16-21', 't1-exodo', false, 8),
  ('epico_sumo_sacerdote', 'Sumo sacerdote', 'epic', 'loja', 'Êxodo 28', 't1-exodo', true, 9),
  ('raro_joquebede', 'Cesto de Joquebede', 'rare', 'missao', 'Êxodo 2:3', 't1-exodo', false, 10),
  ('raro_filha_de_farao', 'Linho da filha de Faraó', 'rare', 'missao', 'Êxodo 2:5-6', 't1-exodo', false, 11),
  ('raro_parteiras', 'Sifrá e Puá', 'rare', 'missao', 'Êxodo 1:15-17', 't1-exodo', false, 12),
  ('raro_hur', 'Hur', 'rare', 'temporada-gratis', 'Êxodo 17:12', 't1-exodo', false, 13),
  ('raro_aoliabe', 'Aoliabe, o bordador', 'rare', 'temporada-premium', 'Êxodo 31:6', 't1-exodo', false, 14),
  ('raro_levita', 'Levita', 'rare', 'loja', 'Números 3:5-8', 't1-exodo', true, 15),
  ('raro_sacerdote', 'Sacerdote', 'rare', 'loja', 'Êxodo 28:40-42', 't1-exodo', true, 16),
  ('raro_bordador', 'Bordador', 'rare', 'loja', 'Êxodo 35:35', 't1-exodo', true, 17),
  ('raro_ourives', 'Ourives', 'rare', 'loja', 'Êxodo 31:4', 't1-exodo', true, 18),
  ('raro_gravador', 'Gravador de pedras', 'rare', 'loja', 'Êxodo 28:11', 't1-exodo', true, 19),
  ('raro_perfumista', 'Perfumista', 'rare', 'loja', 'Êxodo 30:25', 't1-exodo', true, 20),
  ('raro_shofar', 'Tocador de shofar', 'rare', 'temporada-gratis', 'Êxodo 19:16', 't1-exodo', false, 21),
  ('comum_pastor', 'Pastor de ovelhas', 'common', 'inicio', 'Êxodo 3:1', 't1-exodo', false, 22),
  ('comum_carpinteiro', 'Carpinteiro de acácia', 'common', 'siclos', 'Êxodo 25:10', 't1-exodo', true, 23),
  ('comum_tecela', 'Tecelã', 'common', 'siclos', 'Êxodo 35:25', 't1-exodo', true, 24),
  ('comum_parteira', 'Parteira', 'common', 'siclos', 'Êxodo 1:15', 't1-exodo', true, 25),
  ('comum_peregrino_exodo', 'Peregrino do Êxodo', 'common', 'inicio', 'Êxodo 12:11', 't1-exodo', false, 26)
on conflict (id) do nothing;

create or replace function private.skin_price(p_rarity text)
returns int
language sql
stable
set search_path = ''
as $$
  select private.economy('siclos_daily_goal') * case p_rarity
    when 'common' then private.economy('skin_days_common')
    when 'rare' then private.economy('skin_days_rare')
    when 'epic' then private.economy('skin_days_epic')
  end
$$;

create or replace function private.owns_skin(p_user uuid, p_skin text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (select 1 from public.user_skins u where u.user_id = p_user and u.skin_id = p_skin)
      or exists (select 1 from public.skins s where s.id = p_skin and s.origin = 'inicio')
$$;

-- Vitrine do dia: sorteio estável e igual para todas as contas até a virada; a Épica muda por semana.
create or replace function private.skin_offers(p_day date)
returns table (skin_id text, section text, price int, gift boolean)
language sql
stable
set search_path = ''
as $$
  with eligible as (
    select s.id, s.rarity,
      row_number() over (
        partition by s.rarity
        order by md5(case when s.rarity = 'epic' then ((p_day - date '2000-01-02') / 7)::text else p_day::text end || ':' || s.id), s.id
      ) as position
    from public.skins s
    where s.is_active and s.in_shop
  ), gift_day as (
    select extract(dow from p_day)::int = private.economy('skin_gift_weekday') as today
  )
  select e.id, e.rarity,
    case when e.rarity = 'epic' and g.today then 0 else private.skin_price(e.rarity) end,
    e.rarity = 'epic' and g.today
  from eligible e cross join gift_day g
  where (e.rarity = 'common' and e.position <= private.economy('skin_shop_commons'))
     or (e.rarity = 'rare' and e.position <= private.economy('skin_shop_rares'))
     or (e.rarity = 'epic' and e.position = 1)
$$;

create or replace function private.skin_market_state(p_user uuid, p_at timestamptz)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'siclosBalance', private.siclos_balance(p_user),
    'siclosPerGoal', private.economy('siclos_daily_goal'),
    'prices', jsonb_build_object(
      'common', private.skin_price('common'), 'rare', private.skin_price('rare'), 'epic', private.skin_price('epic')),
    'days', jsonb_build_object(
      'common', private.economy('skin_days_common'), 'rare', private.economy('skin_days_rare'), 'epic', private.economy('skin_days_epic')),
    'giftWeekday', private.economy('skin_gift_weekday'),
    'rotation', jsonb_build_object(
      'day', r.day,
      'serverNow', p_at,
      'nextAt', ((r.day + 1) + time '21:00') at time zone 'America/Sao_Paulo'
    ),
    'offers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'skinId', o.skin_id, 'rarity', o.section, 'price', o.price, 'gift', o.gift,
        'owned', private.owns_skin(p_user, o.skin_id))
        order by case o.section when 'epic' then 0 when 'rare' then 1 else 2 end, s.sort_order)
      from private.skin_offers(r.day) o join public.skins s on s.id = o.skin_id
    ), '[]'::jsonb),
    'owned', coalesce((
      select jsonb_agg(s.id order by s.sort_order) from public.skins s
      where s.is_active and private.owns_skin(p_user, s.id)
    ), '[]'::jsonb),
    'purchases', coalesce((
      select jsonb_agg(jsonb_build_object(
        'purchaseId', p.id, 'skinId', p.skin_id, 'price', p.price, 'gift', p.gift, 'createdAt', p.created_at)
        order by p.created_at desc)
      from public.skin_purchases p where p.user_id = p_user
    ), '[]'::jsonb)
  )
  from (select private.market_rotation_day(p_at) as day) r
$$;

create or replace function public.get_skin_market()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select private.skin_market_state(private.require_uid(), statement_timestamp())
$$;

create or replace function private.purchase_skin_at(
  p_purchase_id uuid, p_skin text, p_price int, p_offer_day date, p_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_existing public.skin_purchases;
  v_skin public.skins;
  v_offer record;
  v_day date;
  v_balance int;
  v_result jsonb;
begin
  if p_purchase_id is null or p_skin is null then
    raise exception using errcode = 'P0001', message = 'invalid_purchase';
  end if;
  if not exists (select 1 from public.profiles p where p.id = v_uid) then
    raise exception using errcode = 'P0001', message = 'profile_required';
  end if;
  -- mesma trava de missões, metas, Mercado e escolha gratuita: tudo do jogador é serializado
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 42));

  select * into v_existing from public.skin_purchases p where p.id = p_purchase_id;
  if found then
    if v_existing.user_id <> v_uid or v_existing.skin_id <> p_skin then
      raise exception using errcode = 'P0001', message = 'invalid_purchase';
    end if;
    return v_existing.result || jsonb_build_object('duplicate', true, 'siclosBalance', private.siclos_balance(v_uid));
  end if;

  select * into v_skin from public.skins s where s.id = p_skin and s.is_active;
  if v_skin.id is null or not v_skin.in_shop then
    raise exception using errcode = 'P0001', message = 'skin_not_for_sale', detail = p_skin;
  end if;
  if private.owns_skin(v_uid, v_skin.id) then
    raise exception using errcode = 'P0001', message = 'skin_already_owned', detail = v_skin.id;
  end if;
  v_day := private.market_rotation_day(coalesce(p_at, clock_timestamp()));
  select * into v_offer from private.skin_offers(v_day) o where o.skin_id = v_skin.id;
  if (p_offer_day is not null and p_offer_day <> v_day) or v_offer.skin_id is null then
    raise exception using errcode = 'P0001', message = 'market_offer_expired';
  end if;
  if p_price is not null and p_price <> v_offer.price then
    raise exception using errcode = 'P0001', message = 'market_price_changed';
  end if;
  v_balance := private.siclos_balance(v_uid);
  if v_balance < v_offer.price then
    raise exception using errcode = 'P0001', message = 'insufficient_siclos',
      detail = format('saldo %s, preço %s', v_balance, v_offer.price);
  end if;

  if v_offer.price > 0 then
    insert into public.siclos_ledger (user_id, event_type, source_event_id, amount)
    values (v_uid, 'SKIN_PURCHASE', 'skin:' || p_purchase_id::text, -v_offer.price);
  end if;
  insert into public.user_skins (user_id, skin_id, source_event_id)
  values (v_uid, v_skin.id, case when v_offer.gift then 'skin-gift:' else 'skin-purchase:' end || p_purchase_id::text);
  if private.siclos_balance(v_uid) < 0 then
    raise exception using errcode = 'P0001', message = 'insufficient_siclos'; -- defesa extra: desfaz tudo
  end if;

  v_result := jsonb_build_object(
    'purchaseId', p_purchase_id,
    'skinId', v_skin.id,
    'price', v_offer.price,
    'gift', v_offer.gift,
    'siclosBalance', private.siclos_balance(v_uid),
    'duplicate', false);
  insert into public.skin_purchases (id, user_id, skin_id, price, gift, result)
  values (p_purchase_id, v_uid, v_skin.id, v_offer.price, v_offer.gift, v_result);
  return v_result;
end;
$$;

create or replace function public.purchase_skin(p_purchase_id uuid, p_skin text, p_price int, p_offer_day date)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.purchase_skin_at(p_purchase_id, p_skin, p_price, p_offer_day, null)
$$;

revoke all on function private.skin_price(text), private.owns_skin(uuid, text), private.skin_offers(date),
  private.skin_market_state(uuid, timestamptz), private.purchase_skin_at(uuid, text, int, date, timestamptz)
  from public, anon, authenticated;
revoke all on function public.get_skin_market(), public.purchase_skin(uuid, text, int, date) from public, anon;
grant execute on function public.get_skin_market(), public.purchase_skin(uuid, text, int, date) to authenticated;
