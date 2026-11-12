-- Jornada Bíblica — marcos dos Santos com sessão vinculada.
-- Aditiva: não altera migrações anteriores e não apaga dados.
--
--  * O jogador escolhe um marco na aba Ler; a sessão de leitura leva o ID do marco.
--  * Ao finalizar, o servidor confere que o marco existe, está ativo, é do tipo marco e é do mesmo
--    capítulo da sessão (invalid_milestone), e grava o vínculo em reading_sessions.milestone_id.
--    Reenviar a mesma sessão com outro marco, ou sem ele, é recusado (invalid_session).
--  * Marcos (kind = 'milestone') só disparam na sessão vinculada. Missões dos Raros
--    (kind = 'mission') continuam disparando em qualquer sessão do capítulo.
--  * Uma leitura comum do capítulo segue só as recompensas habituais. A releitura cumpre o marco
--    sem XP de leitura, capítulo novo ou avanço na meta diária (regras existentes).

alter table public.reading_sessions add column if not exists milestone_id text references public.reward_triggers (id);

create or replace function private.complete_reading_mission_at(
  p_uid uuid,
  p_session_id uuid,
  p_book text,
  p_chapter int,
  p_mode text,
  p_started_at timestamptz,
  p_active_seconds int,
  p_now timestamptz,
  p_milestone text
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
    -- o vínculo marco ↔ sessão é fixo: um reenvio com outro marco (ou sem ele) é recusado
    if v_existing.milestone_id is distinct from p_milestone then
      raise exception using errcode = 'P0001', message = 'invalid_session', detail = 'milestone';
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
  -- marco escolhido explicitamente: precisa existir, estar ativo e ser deste capítulo
  if p_milestone is not null and not exists (
    select 1 from public.reward_triggers t
    where t.id = p_milestone and t.kind = 'milestone' and t.is_active and t.book_code = p_book and t.chapter = p_chapter) then
    raise exception using errcode = 'P0001', message = 'invalid_milestone', detail = p_milestone;
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
    where t.is_active and t.book_code = p_book and t.chapter = p_chapter
      -- missões dos Raros: qualquer sessão do capítulo; marcos dos Santos: só a sessão vinculada
      and (t.kind = 'mission' or (t.kind = 'milestone' and t.id = p_milestone))
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
    'milestone', p_milestone,
    'duplicate', false);

  insert into public.reading_sessions (id, user_id, book_code, chapter, mode, started_at, completed_at, active_seconds, reported_seconds, is_reread, result, milestone_id)
  values (p_session_id, p_uid, p_book, p_chapter, p_mode, p_started_at, p_now, v_active, p_active_seconds, v_reread, v_result, p_milestone);
  return v_result;
end;
$$;

-- assinatura anterior (8 parâmetros) continua válida: sessão sem marco
create or replace function private.complete_reading_mission_at(
  p_uid uuid, p_session_id uuid, p_book text, p_chapter int, p_mode text,
  p_started_at timestamptz, p_active_seconds int, p_now timestamptz
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.complete_reading_mission_at(p_uid, p_session_id, p_book, p_chapter, p_mode, p_started_at, p_active_seconds, p_now, null::text);
$$;

-- a API ganha o marco opcional (o tipo da assinatura muda: recria)
drop function if exists public.complete_reading_mission(uuid, text, int, text, timestamptz, int);
create function public.complete_reading_mission(
  p_session_id uuid,
  p_book text,
  p_chapter int,
  p_mode text,
  p_started_at timestamptz,
  p_active_seconds int,
  p_milestone text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.complete_reading_mission_at(private.require_uid(), p_session_id, p_book, p_chapter, p_mode, p_started_at, p_active_seconds, now(), p_milestone);
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated;
revoke all on function public.complete_reading_mission(uuid, text, int, text, timestamptz, int, text) from public, anon;
grant execute on function public.complete_reading_mission(uuid, text, int, text, timestamptz, int, text) to authenticated;
