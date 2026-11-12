-- Jornada Bíblica — meta diária v2: recompensa ao completar a META PESSOAL do dia.
-- Aditiva: não altera migrações anteriores e não apaga dados.
--
-- Regras v2
--  * A recompensa diária sai quando os capítulos INÉDITOS do dia atingem a meta do dia
--    (1, 2, 3, 5 ou N). Ritmo livre: o jogador escolhe a missão do dia (>= 1 capítulo) antes
--    de começar; sem escolha, não há recompensa diária naquele dia.
--  * Recompensa: 40 Siclos + 20 XP de bônus + escolha de 1 entre até 3 Comuns. Uma por dia.
--  * Cada capítulo inédito: 40 XP (releitura: 0). Capítulos além da meta: só XP e progresso.
--  * Mudança de meta vale a partir da próxima data civil do fuso de leitura (exceto a primeira
--    definição, no onboarding). Cada dia guarda um snapshot da meta ativa (daily_targets).
--  * Fuso: o aparelho só é adotado sozinho se o usuário nunca definiu um; depois é só sugestão.
--
-- Política para a regra anterior (v1: primeiro capítulo inédito do dia)
--  * Metas já concedidas ficam como estão (daily_goals.rule_version = 1): Siclos, item e escolha
--    pendente são mantidos; nada é removido nem concedido de novo.
--  * Um dia que já tem meta (v1 ou v2) nunca recebe outra recompensa diária.
--  * XP já registrado (10 por capítulo) não é recalculado; os 40 XP valem para novos capítulos.

-- ---------------------------------------------------------------------------
-- Economia
-- ---------------------------------------------------------------------------

update public.economy_rules set value = 40, updated_at = now(),
  description = 'XP por capítulo inédito concluído (regra de produto v2).'
where key = 'xp_new_chapter';
update public.economy_rules set description = 'Siclos ao cumprir a meta diária (meta pessoal do dia).' where key = 'siclos_daily_goal';
insert into public.economy_rules (key, value, description) values
  ('xp_daily_goal_bonus', 20, 'XP de bônus ao cumprir a meta diária.')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Meta pessoal: mudança pendente até a próxima data civil
-- ---------------------------------------------------------------------------

alter table public.reading_preferences
  add column if not exists pending_plan_mode text check (pending_plan_mode in ('daily_goal', 'free')),
  add column if not exists pending_target int check (pending_target between 1 and 50),
  add column if not exists pending_effective_day date;
alter table public.reading_preferences drop constraint if exists reading_preferences_pending_consistency;
alter table public.reading_preferences add constraint reading_preferences_pending_consistency check (
  (pending_plan_mode is null and pending_target is null and pending_effective_day is null)
  or (pending_plan_mode = 'free' and pending_target is null and pending_effective_day is not null)
  or (pending_plan_mode = 'daily_goal' and pending_target is not null and pending_effective_day is not null));

/** Promove a mudança pendente quando o dia chega e devolve a preferência em vigor no dia. */
create or replace function private.effective_preferences(p_user uuid, p_day date)
returns public.reading_preferences
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.reading_preferences;
begin
  update public.reading_preferences r
  set plan_mode = r.pending_plan_mode, target_chapters_per_day = r.pending_target,
      pending_plan_mode = null, pending_target = null, pending_effective_day = null
  where r.user_id = p_user and r.pending_effective_day is not null and r.pending_effective_day <= p_day;
  select * into v_row from public.reading_preferences r where r.user_id = p_user;
  return v_row;
end;
$$;

create or replace function private.set_reading_preferences_at(p_uid uuid, p_plan_mode text, p_target int, p_now timestamptz)
returns public.reading_preferences
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.reading_preferences;
  v_today date;
begin
  if not exists (select 1 from public.profiles p where p.id = p_uid) then
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
  perform pg_advisory_xact_lock(hashtextextended(p_uid::text, 42));
  v_today := private.local_day(p_uid, p_now);
  v_row := private.effective_preferences(p_uid, v_today);

  if v_row.user_id is null then
    -- primeira definição (onboarding): vale já
    insert into public.reading_preferences (user_id, plan_mode, target_chapters_per_day)
    values (p_uid, p_plan_mode, p_target)
    returning * into v_row;
  elsif v_row.plan_mode = p_plan_mode and v_row.target_chapters_per_day is not distinct from p_target then
    -- voltou para a meta em vigor: cancela a mudança pendente
    update public.reading_preferences
    set pending_plan_mode = null, pending_target = null, pending_effective_day = null
    where user_id = p_uid returning * into v_row;
  else
    update public.reading_preferences
    set pending_plan_mode = p_plan_mode, pending_target = p_target, pending_effective_day = v_today + 1
    where user_id = p_uid returning * into v_row;
  end if;

  update public.profiles p
  set onboarding_completed_at = coalesce(p.onboarding_completed_at, now())
  where p.id = p_uid and p.avatar_onboarding_completed_at is not null;
  return v_row;
end;
$$;

create or replace function public.set_reading_preferences(p_plan_mode text, p_target int default null)
returns public.reading_preferences
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.set_reading_preferences_at(private.require_uid(), p_plan_mode, p_target, now());
end;
$$;

-- ---------------------------------------------------------------------------
-- Snapshot da meta de cada dia
-- ---------------------------------------------------------------------------

create table public.daily_targets (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  plan_mode text not null check (plan_mode in ('daily_goal', 'free')),
  target int check (target between 1 and 50),
  source text not null check (source in ('preference', 'free_choice', 'legacy_v1')),
  time_zone text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.daily_targets enable row level security;
revoke all on public.daily_targets from anon, authenticated;
grant select on public.daily_targets to authenticated;
create policy "dono lê as próprias metas do dia" on public.daily_targets for select to authenticated using (user_id = auth.uid());

-- metas v1 já concedidas ganham snapshot de auditoria (meta 1, regra antiga)
alter table public.daily_goals
  add column if not exists rule_version int not null default 1,
  add column if not exists target int,
  add column if not exists xp_bonus int not null default 0;
alter table public.daily_goals alter column rule_version set default 2;
insert into public.daily_targets (user_id, day, plan_mode, target, source, time_zone, created_at)
select g.user_id, g.day, 'daily_goal', 1, 'legacy_v1', g.time_zone, g.achieved_at
from public.daily_goals g where g.rule_version = 1
on conflict (user_id, day) do nothing;

/** Snapshot da meta do dia (criado na primeira vez que o dia é usado e nunca mais alterado pela preferência). */
create or replace function private.day_target(p_user uuid, p_day date)
returns public.daily_targets
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.daily_targets;
  v_prefs public.reading_preferences;
begin
  select * into v_row from public.daily_targets t where t.user_id = p_user and t.day = p_day;
  if found then
    return v_row;
  end if;
  v_prefs := private.effective_preferences(p_user, p_day);
  insert into public.daily_targets (user_id, day, plan_mode, target, source, time_zone)
  values (p_user, p_day, coalesce(v_prefs.plan_mode, 'free'),
          case when v_prefs.plan_mode = 'daily_goal' then v_prefs.target_chapters_per_day end,
          'preference', (select p.time_zone from public.profiles p where p.id = p_user))
  on conflict (user_id, day) do nothing;
  select * into v_row from public.daily_targets t where t.user_id = p_user and t.day = p_day;
  return v_row;
end;
$$;

create or replace function private.new_chapters_on(p_user uuid, p_day date)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from private.domain_events d
  where d.user_id = p_user and d.event_type = 'CHAPTER_COMPLETED'
    and d.source_event_id like 'chapter:%' and d.payload ->> 'day' = p_day::text;
$$;

/** Ritmo livre: escolher a missão do dia (>= 1 capítulo) antes do primeiro capítulo inédito do dia. */
create or replace function private.set_daily_mission_target_at(p_uid uuid, p_target int, p_now timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day date;
  v_t public.daily_targets;
begin
  if p_target is null or p_target not between 1 and 50 then
    raise exception using errcode = 'P0001', message = 'invalid_goal';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_uid::text, 42));
  v_day := private.local_day(p_uid, p_now);
  v_t := private.day_target(p_uid, v_day);
  if v_t.plan_mode <> 'free' then
    raise exception using errcode = 'P0001', message = 'daily_target_not_free';
  end if;
  if v_t.target is not null then
    if v_t.target = p_target then
      return private.daily_status(p_uid, p_now);
    end if;
    raise exception using errcode = 'P0001', message = 'daily_target_already_set';
  end if;
  if private.new_chapters_on(p_uid, v_day) > 0 then
    raise exception using errcode = 'P0001', message = 'daily_target_after_start';
  end if;
  update public.daily_targets set target = p_target, source = 'free_choice' where user_id = p_uid and day = v_day;
  return private.daily_status(p_uid, p_now);
end;
$$;

-- ---------------------------------------------------------------------------
-- Recompensa diária
-- ---------------------------------------------------------------------------

/** Concede a recompensa do dia se a meta foi atingida agora (chamada sob a trava do jogador). */
create or replace function private.try_daily_goal(p_user uuid, p_day date, p_session uuid, p_book text, p_chapter int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_t public.daily_targets := private.day_target(p_user, p_day);
  v_options text[];
  v_siclos int := private.economy('siclos_daily_goal');
  v_bonus int := private.economy('xp_daily_goal_bonus');
begin
  if v_t.target is null or private.new_chapters_on(p_user, p_day) < v_t.target then
    return false;
  end if;
  if exists (select 1 from public.daily_goals g where g.user_id = p_user and g.day >= p_day) then
    return false; -- já recebida hoje, ou o fuso foi trocado para "voltar" a um dia anterior
  end if;
  select coalesce(array_agg(id), '{}') into v_options from (
    select e.id from private.eligible_commons(p_user) e(id)
    order by md5(p_user::text || p_day::text || e.id)
    limit private.economy('daily_goal_choices')) t;

  insert into public.daily_goals (user_id, day, time_zone, session_id, book_code, chapter, siclos, options, rule_version, target, xp_bonus)
  values (p_user, p_day, v_t.time_zone, p_session, p_book, p_chapter, v_siclos, v_options, 2, v_t.target, v_bonus);
  if v_siclos > 0 then
    insert into public.siclos_ledger (user_id, event_type, source_event_id, amount)
    values (p_user, 'DAILY_GOAL', 'goal:' || p_day::text, v_siclos);
  end if;
  if v_bonus > 0 then
    insert into public.xp_ledger (user_id, event_type, source_event_id, amount)
    values (p_user, 'DAILY_GOAL_BONUS', 'goal:' || p_day::text, v_bonus)
    on conflict (user_id, event_type, source_event_id) do nothing;
  end if;
  return true;
end;
$$;

/** Situação do dia (meta, progresso, recompensa prevista, mudança pendente, escolhas pendentes). */
create or replace function private.daily_status(p_user uuid, p_now timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day date := private.local_day(p_user, p_now);
  v_t public.daily_targets := private.day_target(p_user, v_day);
  v_done int := private.new_chapters_on(p_user, v_day);
  v_goal public.daily_goals;
  v_prefs public.reading_preferences;
  v_profile public.profiles;
begin
  select * into v_goal from public.daily_goals g where g.user_id = p_user and g.day = v_day;
  select * into v_prefs from public.reading_preferences r where r.user_id = p_user;
  select * into v_profile from public.profiles p where p.id = p_user;
  return jsonb_build_object(
    'today', v_day,
    'timeZone', v_profile.time_zone,
    'timeZoneSource', v_profile.time_zone_source,
    'planMode', v_t.plan_mode,
    'target', v_t.target,
    'targetSource', v_t.source,
    'needsFreeChoice', v_t.plan_mode = 'free' and v_t.target is null,
    'canChooseFreeTarget', v_t.plan_mode = 'free' and v_t.target is null and v_done = 0,
    'newChaptersToday', v_done,
    'remaining', case when v_t.target is null then null else greatest(0, v_t.target - v_done) end,
    'achievedToday', v_goal.user_id is not null,
    'goalRuleVersion', v_goal.rule_version,
    'reward', jsonb_build_object(
      'siclos', private.economy('siclos_daily_goal'),
      'xpBonus', private.economy('xp_daily_goal_bonus'),
      'commonChoices', least(private.economy('daily_goal_choices'), (select count(*) from private.eligible_commons(p_user)))::int,
      'xpPerChapter', private.economy('xp_new_chapter')),
    'pendingChange', case when v_prefs.pending_effective_day is null then null else jsonb_build_object(
      'planMode', v_prefs.pending_plan_mode, 'target', v_prefs.pending_target, 'effectiveDay', v_prefs.pending_effective_day) end,
    'siclosBalance', private.siclos_balance(p_user),
    'siclosPerGoal', private.economy('siclos_daily_goal'),
    'xpTotal', coalesce((select sum(x.amount) from public.xp_ledger x where x.user_id = p_user), 0),
    'pending', coalesce((
      select jsonb_agg(s order by s ->> 'day')
      from (select private.daily_goal_state(p_user, g.day) s from public.daily_goals g
            where g.user_id = p_user and g.chosen_item is null) t
      where (s ->> 'choicePending')::boolean), '[]'::jsonb));
end;
$$;

-- estado da meta passa a informar a regra, a meta do dia e o bônus de XP
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
    'xpBonus', g.xp_bonus,
    'target', g.target,
    'ruleVersion', g.rule_version,
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

-- ---------------------------------------------------------------------------
-- Finalização de missão (mesma estrutura; meta pelo snapshot do dia)
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
  v_target public.daily_targets;
  v_done int;
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
  -- fixa a meta do dia antes de registrar o capítulo (mudanças feitas hoje só valem amanhã)
  v_target := private.day_target(p_uid, v_day);

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

  if not v_reread then
    v_goal_now := private.try_daily_goal(p_uid, v_day, p_session_id, p_book, p_chapter);
  end if;
  v_done := private.new_chapters_on(p_uid, v_day);

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
      'planMode', v_target.plan_mode,
      'target', v_target.target,
      'achievedNow', v_goal_now,
      'achievedToday', exists (select 1 from public.daily_goals g where g.user_id = p_uid and g.day = v_day),
      'siclosAwarded', case when v_goal_now then (select g.siclos from public.daily_goals g where g.user_id = p_uid and g.day = v_day) else 0 end,
      'xpBonus', case when v_goal_now then (select g.xp_bonus from public.daily_goals g where g.user_id = p_uid and g.day = v_day) else 0 end,
      'siclosBalance', private.siclos_balance(p_uid),
      'newChaptersToday', v_done,
      'remaining', case when v_target.target is null then null else greatest(0, v_target.target - v_done) end,
      'goal', private.daily_goal_state(p_uid, v_day)),
    'duplicate', false);

  insert into public.reading_sessions (id, user_id, book_code, chapter, mode, started_at, completed_at, active_seconds, reported_seconds, is_reread, result)
  values (p_session_id, p_uid, p_book, p_chapter, p_mode, p_started_at, p_now, v_active, p_active_seconds, v_reread, v_result);
  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Fuso: o aparelho sugere; só substitui quando o usuário nunca definiu
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists time_zone_source text not null default 'default'
  check (time_zone_source in ('default', 'device', 'user'));
-- quem já teve o fuso ajustado pelo aparelho (v1) fica como 'device'
update public.profiles set time_zone_source = 'device' where time_zone_changed_at is not null and time_zone_source = 'default';

create or replace function private.change_time_zone(p_uid uuid, p_time_zone text, p_source text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
begin
  select * into v_profile from public.profiles p where p.id = p_uid for update;
  if v_profile.id is null then
    raise exception using errcode = 'P0001', message = 'profile_required';
  end if;
  if p_time_zone is null or not exists (select 1 from pg_catalog.pg_timezone_names z where z.name = p_time_zone) then
    raise exception using errcode = 'P0001', message = 'invalid_time_zone';
  end if;
  if p_time_zone = v_profile.time_zone then
    update public.profiles set time_zone_source = p_source where id = p_uid and p_source = 'user';
    return;
  end if;
  if v_profile.time_zone_changed_at is not null and v_profile.time_zone_changed_at > now() - interval '24 hours' then
    raise exception using errcode = 'P0001', message = 'time_zone_change_too_soon';
  end if;
  update public.profiles set time_zone = p_time_zone, time_zone_source = p_source, time_zone_changed_at = now() where id = p_uid;
end;
$$;

-- o tipo de retorno muda (texto → jsonb): recria
drop function if exists public.sync_time_zone(text);
/**
 * O app informa o fuso do aparelho. Só é adotado se o usuário nunca definiu um fuso
 * (padrão do sistema); caso contrário volta como sugestão, sem alterar nada.
 */
create function public.sync_time_zone(p_time_zone text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_profile public.profiles;
begin
  if p_time_zone is null or not exists (select 1 from pg_catalog.pg_timezone_names z where z.name = p_time_zone) then
    raise exception using errcode = 'P0001', message = 'invalid_time_zone';
  end if;
  select * into v_profile from public.profiles p where p.id = v_uid;
  if v_profile.id is null then
    raise exception using errcode = 'P0001', message = 'profile_required';
  end if;
  if v_profile.time_zone_source = 'default' and p_time_zone <> v_profile.time_zone then
    perform private.change_time_zone(v_uid, p_time_zone, 'device');
    select * into v_profile from public.profiles p where p.id = v_uid;
  end if;
  return jsonb_build_object('timeZone', v_profile.time_zone, 'source', v_profile.time_zone_source,
    'suggestion', case when p_time_zone <> v_profile.time_zone then p_time_zone end);
end;
$$;

/** Escolha explícita do fuso de leitura (no máximo uma troca a cada 24 h). */
create or replace function public.set_time_zone(p_time_zone text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
begin
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 42));
  perform private.change_time_zone(v_uid, p_time_zone, 'user');
  return private.daily_status(v_uid, now());
end;
$$;

-- ---------------------------------------------------------------------------
-- API
-- ---------------------------------------------------------------------------

drop function if exists public.get_daily_goal_status();
create function public.get_daily_goal_status()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.daily_status(private.require_uid(), now());
end;
$$;

create or replace function public.set_daily_mission_target(p_target int)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.set_daily_mission_target_at(private.require_uid(), p_target, now());
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated;
revoke all on function public.sync_time_zone(text) from public, anon;
revoke all on function public.set_time_zone(text) from public, anon;
revoke all on function public.get_daily_goal_status() from public, anon;
revoke all on function public.set_daily_mission_target(int) from public, anon;
grant execute on function public.sync_time_zone(text) to authenticated;
grant execute on function public.set_time_zone(text) to authenticated;
grant execute on function public.get_daily_goal_status() to authenticated;
grant execute on function public.set_daily_mission_target(int) to authenticated;
