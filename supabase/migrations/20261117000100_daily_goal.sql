-- Jornada Bíblica — meta diária de leitura (v1), Siclos e escolha gratuita de um Comum.
-- Aditiva: não altera migrações anteriores e não apaga dados.
--
-- Regra v1: o PRIMEIRO capítulo inédito confirmado no dia cumpre a meta diária:
--   +40 Siclos e a escolha gratuita de 1 entre até 3 Comuns elegíveis que o jogador ainda não tem.
--   Releituras não contam. Capítulos inéditos seguintes só registram progresso e recompensas de leitura.
--
-- Dia e fuso (decisão registrada em docs/MODO-MISSAO.md):
--   * dia = data civil no fuso IANA do perfil (profiles.time_zone), padrão 'America/Sao_Paulo';
--   * o app informa o fuso do aparelho (sync_time_zone); trocas valem no máximo 1 vez a cada 24 h;
--   * uma meta só pode ser registrada num dia POSTERIOR ao da última meta (trocar de fuso não
--     "volta" para um dia ainda sem meta).

-- ---------------------------------------------------------------------------
-- Fuso do perfil
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists time_zone text not null default 'America/Sao_Paulo',
  add column if not exists time_zone_changed_at timestamptz;

create or replace function public.sync_time_zone(p_time_zone text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_profile public.profiles;
begin
  select * into v_profile from public.profiles p where p.id = v_uid for update;
  if v_profile.id is null then
    raise exception using errcode = 'P0001', message = 'profile_required';
  end if;
  if p_time_zone is null or not exists (select 1 from pg_catalog.pg_timezone_names z where z.name = p_time_zone) then
    raise exception using errcode = 'P0001', message = 'invalid_time_zone';
  end if;
  if p_time_zone = v_profile.time_zone then
    return v_profile.time_zone;
  end if;
  -- primeira definição é livre; depois, no máximo uma troca a cada 24 h (o fuso atual continua valendo)
  if v_profile.time_zone_changed_at is not null and v_profile.time_zone_changed_at > now() - interval '24 hours' then
    return v_profile.time_zone;
  end if;
  update public.profiles set time_zone = p_time_zone, time_zone_changed_at = now() where id = v_uid;
  return p_time_zone;
end;
$$;

create or replace function private.local_day(p_user uuid, p_at timestamptz)
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select (p_at at time zone coalesce((select p.time_zone from public.profiles p where p.id = p_user), 'America/Sao_Paulo'))::date;
$$;

-- ---------------------------------------------------------------------------
-- Siclos, metas e regras
-- ---------------------------------------------------------------------------

insert into public.economy_rules (key, value, description) values
  ('siclos_daily_goal', 40, 'Siclos ao cumprir a meta diária (primeiro capítulo inédito do dia).'),
  ('daily_goal_choices', 3, 'Quantidade máxima de Comuns oferecidos na escolha gratuita da meta diária.')
on conflict (key) do nothing;

create table public.siclos_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null,
  source_event_id text not null,
  amount int not null check (amount <> 0),
  created_at timestamptz not null default now(),
  unique (user_id, event_type, source_event_id)
);
alter table public.siclos_ledger enable row level security;
revoke all on public.siclos_ledger from anon, authenticated;
grant select on public.siclos_ledger to authenticated;
create policy "dono lê os próprios Siclos" on public.siclos_ledger for select to authenticated using (user_id = auth.uid());

create table public.daily_goals (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  time_zone text not null,
  session_id uuid not null,
  book_code text not null references public.bible_books (code),
  chapter int not null,
  siclos int not null check (siclos >= 0),
  options text[] not null default '{}',
  chosen_item text references public.cosmetic_items (id),
  chosen_at timestamptz,
  achieved_at timestamptz not null default now(),
  primary key (user_id, day),
  check (cardinality(options) <= 3),
  check (chosen_item is null or chosen_item = any (options))
);
alter table public.daily_goals enable row level security;
revoke all on public.daily_goals from anon, authenticated;
grant select on public.daily_goals to authenticated;
create policy "dono lê as próprias metas" on public.daily_goals for select to authenticated using (user_id = auth.uid());

/** Comuns elegíveis à escolha: ativos, regra ativa do conjunto de missão (catálogo), não Premium e ainda não possuídos. */
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
    and not exists (select 1 from public.user_items ui where ui.user_id = p_user and ui.item_id = i.id);
$$;

/** Estado de uma meta (para a tela): opções ainda disponíveis e se a escolha está pendente. */
create or replace function private.daily_goal_state(p_user uuid, p_day date)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when g.user_id is null then null else jsonb_build_object(
    'day', g.day,
    'timeZone', g.time_zone,
    'siclosAwarded', g.siclos,
    'options', to_jsonb(g.options),
    'available', coalesce((select jsonb_agg(o order by array_position(g.options, o)) from unnest(g.options) o
      where not exists (select 1 from public.user_items ui where ui.user_id = p_user and ui.item_id = o)), '[]'::jsonb),
    'chosenItem', g.chosen_item,
    'choicePending', g.chosen_item is null and exists (select 1 from unnest(g.options) o
      where not exists (select 1 from public.user_items ui where ui.user_id = p_user and ui.item_id = o)),
    'book', g.book_code, 'chapter', g.chapter
  ) end
  from (select 1) one left join public.daily_goals g on g.user_id = p_user and g.day = p_day;
$$;

create or replace function private.siclos_balance(p_user uuid)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(s.amount), 0)::int from public.siclos_ledger s where s.user_id = p_user;
$$;

/**
 * Registra a meta do dia se ainda não houver (chamada dentro da finalização, já com a trava do usuário).
 * Devolve true se a meta foi cumprida AGORA.
 */
create or replace function private.try_daily_goal(p_user uuid, p_day date, p_session uuid, p_book text, p_chapter int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_options text[];
  v_siclos int := private.economy('siclos_daily_goal');
begin
  if exists (select 1 from public.daily_goals g where g.user_id = p_user and g.day >= p_day) then
    return false; -- já cumprida hoje, ou o fuso foi trocado para "voltar" a um dia anterior
  end if;
  -- até N opções, ordem pseudoaleatória estável por usuário e dia
  select coalesce(array_agg(id), '{}') into v_options from (
    select e.id from private.eligible_commons(p_user) e(id)
    order by md5(p_user::text || p_day::text || e.id)
    limit private.economy('daily_goal_choices')) t;

  insert into public.daily_goals (user_id, day, time_zone, session_id, book_code, chapter, siclos, options)
  values (p_user, p_day, (select p.time_zone from public.profiles p where p.id = p_user), p_session, p_book, p_chapter, v_siclos, v_options);
  if v_siclos > 0 then
    insert into public.siclos_ledger (user_id, event_type, source_event_id, amount)
    values (p_user, 'DAILY_GOAL', 'goal:' || p_day::text, v_siclos);
  end if;
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Finalização de missão com a meta diária (com "agora" injetável para testes)
-- ---------------------------------------------------------------------------

create or replace function private.complete_reading_mission_at(
  p_uid uuid,
  p_session_id uuid,
  p_book text,
  p_chapter int,
  p_mode text,
  p_started_at timestamptz,
  p_active_seconds int,
  p_now timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.reading_sessions;
  v_book public.bible_books;
  v_reread boolean;
  v_source text;
  v_ev jsonb;
  v_granted jsonb := '[]'::jsonb;
  v_missions jsonb := '[]'::jsonb;
  v_trigger record;
  v_xp int := 0;
  v_xp_awarded int := 0;
  v_active int;
  v_was_complete boolean;
  v_snapshot jsonb;
  v_result jsonb;
  v_day date;
  v_goal_now boolean := false;
begin
  if p_session_id is null then
    raise exception using errcode = 'P0001', message = 'invalid_session';
  end if;
  if not exists (select 1 from public.profiles p where p.id = p_uid) then
    raise exception using errcode = 'P0001', message = 'profile_required';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_uid::text, 42));

  select * into v_existing from public.reading_sessions s where s.id = p_session_id;
  if found then
    if v_existing.user_id <> p_uid then
      raise exception using errcode = 'P0001', message = 'invalid_session';
    end if;
    if v_existing.book_code <> p_book or v_existing.chapter <> p_chapter then
      raise exception using errcode = 'P0001', message = 'invalid_session', detail = 'mismatch';
    end if;
    -- resultado já registrado; a meta vem com o estado atual (ex.: escolha feita depois)
    return v_existing.result || jsonb_build_object('duplicate', true,
      'dailyGoal', coalesce(v_existing.result -> 'dailyGoal', '{}'::jsonb) || jsonb_build_object(
        'goal', private.daily_goal_state(p_uid, (v_existing.result -> 'dailyGoal' ->> 'day')::date),
        'siclosBalance', private.siclos_balance(p_uid)));
  end if;

  select * into v_book from public.bible_books b where b.code = p_book;
  if v_book.code is null or p_chapter is null or p_chapter not between 1 and v_book.chapters then
    raise exception using errcode = 'P0001', message = 'invalid_chapter';
  end if;
  if p_mode is null or p_mode not in ('physical', 'digital') then
    raise exception using errcode = 'P0001', message = 'invalid_mode';
  end if;
  if p_started_at is null or p_started_at > p_now + interval '5 minutes' or p_started_at < p_now - interval '30 days'
     or p_active_seconds is null or p_active_seconds < 0 then
    raise exception using errcode = 'P0001', message = 'invalid_session';
  end if;
  if (select count(*) from public.reading_sessions s where s.user_id = p_uid and s.completed_at > p_now - interval '10 minutes')
     >= private.economy('max_missions_per_10min') then
    raise exception using errcode = 'P0001', message = 'too_many_missions';
  end if;

  v_active := least(p_active_seconds, greatest(0, ceil(extract(epoch from p_now - p_started_at))::int + 60));
  v_reread := exists (
    select 1 from private.domain_events d
    where d.user_id = p_uid and d.event_type = 'CHAPTER_COMPLETED'
      and d.payload ->> 'book' = p_book and (d.payload ->> 'chapter')::int = p_chapter);
  v_was_complete := private.book_chapters_complete(p_uid, p_book);
  v_day := private.local_day(p_uid, p_now);

  v_source := case when v_reread then 'mission:' || p_session_id::text else 'chapter:' || p_book || '.' || p_chapter end;
  v_ev := private.record_event(p_uid, 'CHAPTER_COMPLETED', v_source,
    jsonb_build_object('book', p_book, 'chapter', p_chapter, 'session', p_session_id, 'mode', p_mode, 'day', v_day));
  v_granted := v_granted || coalesce(v_ev -> 'granted', '[]'::jsonb);
  if (v_ev ->> 'duplicate')::boolean then
    v_reread := true;
  end if;

  if not v_was_complete and private.book_chapters_complete(p_uid, p_book) then
    v_ev := private.record_event(p_uid, 'BOOK_COMPLETED', 'book:' || p_book, jsonb_build_object('book', p_book));
    v_granted := v_granted || coalesce(v_ev -> 'granted', '[]'::jsonb);
  end if;

  for v_trigger in
    select t.id, t.kind, t.name from public.reward_triggers t
    where t.is_active and t.book_code = p_book and t.chapter = p_chapter and t.kind in ('mission', 'milestone')
    order by t.id
  loop
    v_ev := private.record_event(p_uid,
      case v_trigger.kind when 'mission' then 'MISSION_COMPLETED' else 'MILESTONE_REACHED' end,
      v_trigger.kind || ':' || v_trigger.id,
      jsonb_build_object(v_trigger.kind, v_trigger.id));
    v_granted := v_granted || coalesce(v_ev -> 'granted', '[]'::jsonb);
    if not (v_ev ->> 'duplicate')::boolean then
      v_missions := v_missions || jsonb_build_object('id', v_trigger.id, 'kind', v_trigger.kind, 'name', v_trigger.name);
    end if;
  end loop;

  v_xp := private.economy(case when v_reread then 'xp_reread' else 'xp_new_chapter' end);
  if v_xp > 0 then
    insert into public.xp_ledger (user_id, event_type, source_event_id, amount)
    values (p_uid, case when v_reread then 'CHAPTER_REREAD' else 'CHAPTER_COMPLETED' end,
            case when v_reread then 'mission:' || p_session_id::text else 'chapter:' || p_book || '.' || p_chapter end, v_xp)
    on conflict (user_id, event_type, source_event_id) do nothing
    returning amount into v_xp_awarded;
  end if;

  -- meta diária: só capítulo inédito
  if not v_reread then
    v_goal_now := private.try_daily_goal(p_uid, v_day, p_session_id, p_book, p_chapter);
  end if;

  v_snapshot := private.reading_snapshot(p_uid, p_book);
  v_result := v_snapshot || jsonb_build_object(
    'sessionId', p_session_id,
    'chapter', p_chapter,
    'mode', p_mode,
    'activeSeconds', v_active,
    'alreadyCompleted', v_reread,
    'xpAwarded', coalesce(v_xp_awarded, 0),
    'granted', coalesce((select jsonb_agg(distinct g) from jsonb_array_elements_text(v_granted) g), '[]'::jsonb),
    'missions', v_missions,
    'bookJustCompleted', not v_was_complete and (v_snapshot -> 'book' ->> 'isComplete')::boolean,
    'dailyGoal', jsonb_build_object(
      'day', v_day,
      'achievedNow', v_goal_now,
      'achievedToday', exists (select 1 from public.daily_goals g where g.user_id = p_uid and g.day = v_day),
      'siclosAwarded', case when v_goal_now then (select g.siclos from public.daily_goals g where g.user_id = p_uid and g.day = v_day) else 0 end,
      'siclosBalance', private.siclos_balance(p_uid),
      'newChaptersToday', (select count(*) from private.domain_events d where d.user_id = p_uid and d.event_type = 'CHAPTER_COMPLETED'
                            and d.source_event_id like 'chapter:%' and d.payload ->> 'day' = v_day::text),
      'goal', private.daily_goal_state(p_uid, v_day)),
    'duplicate', false);

  insert into public.reading_sessions (id, user_id, book_code, chapter, mode, started_at, completed_at, active_seconds, reported_seconds, is_reread, result)
  values (p_session_id, p_uid, p_book, p_chapter, p_mode, p_started_at, p_now, v_active, p_active_seconds, v_reread, v_result);
  return v_result;
end;
$$;

create or replace function public.complete_reading_mission(
  p_session_id uuid,
  p_book text,
  p_chapter int,
  p_mode text,
  p_started_at timestamptz,
  p_active_seconds int
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.complete_reading_mission_at(private.require_uid(), p_session_id, p_book, p_chapter, p_mode, p_started_at, p_active_seconds, now());
end;
$$;

-- ---------------------------------------------------------------------------
-- Escolha gratuita do Comum
-- ---------------------------------------------------------------------------

/**
 * Resgata o Comum escolhido para a meta de p_day. Idempotente: repetir a mesma escolha devolve o
 * estado sem conceder de novo; outra escolha para a mesma meta é recusada. No máximo um item por meta.
 */
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
  if exists (select 1 from public.user_items ui where ui.user_id = v_uid and ui.item_id = p_item) then
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

/** Situação da meta: hoje, saldo de Siclos e escolhas pendentes (de qualquer dia). */
create or replace function public.get_daily_goal_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_today date := private.local_day(v_uid, now());
begin
  return jsonb_build_object(
    'today', v_today,
    'timeZone', (select p.time_zone from public.profiles p where p.id = v_uid),
    'achievedToday', exists (select 1 from public.daily_goals g where g.user_id = v_uid and g.day = v_today),
    'siclosBalance', private.siclos_balance(v_uid),
    'siclosPerGoal', private.economy('siclos_daily_goal'),
    'pending', coalesce((
      select jsonb_agg(s order by s ->> 'day')
      from (select private.daily_goal_state(v_uid, g.day) s from public.daily_goals g
            where g.user_id = v_uid and g.chosen_item is null) t
      where (s ->> 'choicePending')::boolean), '[]'::jsonb));
end;
$$;

-- get_mission_overview ganha o saldo de Siclos
create or replace function public.get_mission_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  return private.reading_snapshot(v_uid, null) || jsonb_build_object(
    'siclosBalance', private.siclos_balance(v_uid),
    'chaptersByBook', coalesce((
      select jsonb_object_agg(book, chapters) from (
        select d.payload ->> 'book' as book, jsonb_agg(distinct (d.payload ->> 'chapter')::int) as chapters
        from private.domain_events d
        where d.user_id = v_uid and d.event_type = 'CHAPTER_COMPLETED'
        group by d.payload ->> 'book') t), '{}'::jsonb),
    'missions', coalesce((
      select jsonb_agg(jsonb_build_object('id', t.id, 'kind', t.kind, 'name', t.name, 'description', t.description,
        'book', t.book_code, 'chapter', t.chapter,
        'completed', exists (select 1 from private.domain_events d where d.user_id = v_uid
          and d.event_type = case t.kind when 'mission' then 'MISSION_COMPLETED' else 'MILESTONE_REACHED' end
          and d.source_event_id = t.kind || ':' || t.id)) order by t.id)
      from public.reward_triggers t where t.is_active and t.book_code is not null), '[]'::jsonb));
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated;
revoke all on function public.sync_time_zone(text) from public, anon;
revoke all on function public.claim_daily_goal_item(date, text) from public, anon;
revoke all on function public.get_daily_goal_status() from public, anon;
grant execute on function public.sync_time_zone(text) to authenticated;
grant execute on function public.claim_daily_goal_item(date, text) to authenticated;
grant execute on function public.get_daily_goal_status() to authenticated;
