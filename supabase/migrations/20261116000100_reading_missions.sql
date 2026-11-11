-- Jornada Bíblica — Modo Missão de leitura (conclusão de capítulo no servidor).
-- Aditiva: não altera migrações anteriores e não apaga dados.
--  * reading_sessions: uma linha por missão finalizada; o ID é gerado pelo app e é a chave
--    de idempotência (repetir a finalização devolve o mesmo resultado, sem duplicar nada)
--  * xp_ledger: XP com chave única (usuário, tipo, origem)
--  * economy_rules: valores de XP/limites configuráveis sem mudar código
--  * reward_triggers ganham vínculo opcional com um capítulo (missões curadas)
--  * public.complete_reading_mission: registra o capítulo pelo motor existente
--    (private.record_event), dispara missões/marcos vinculados ao capítulo, XP e progresso

-- ---------------------------------------------------------------------------
-- Regras de economia (provisórias até a definição de produto)
-- ---------------------------------------------------------------------------

create table public.economy_rules (
  key text primary key check (key ~ '^[a-z0-9_]{3,64}$'),
  value int not null check (value >= 0),
  description text not null,
  updated_at timestamptz not null default now()
);
alter table public.economy_rules enable row level security;
revoke all on public.economy_rules from anon, authenticated;
grant select on public.economy_rules to authenticated;
create policy "regras de economia legíveis" on public.economy_rules for select to authenticated using (true);

insert into public.economy_rules (key, value, description) values
  ('xp_new_chapter', 10, 'XP por capítulo inédito concluído. PROVISÓRIO: não há regra de produto definida.'),
  ('xp_reread', 0, 'XP por releitura (a especificação permite política separada e limitada; hoje 0).'),
  ('max_missions_per_10min', 60, 'Limite anti-abuso de missões finalizadas em 10 minutos.')
on conflict (key) do nothing;

create or replace function private.economy(p_key text)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select r.value from public.economy_rules r where r.key = p_key), 0);
$$;

-- ---------------------------------------------------------------------------
-- XP
-- ---------------------------------------------------------------------------

create table public.xp_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null,
  source_event_id text not null,
  amount int not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (user_id, event_type, source_event_id)
);
alter table public.xp_ledger enable row level security;
revoke all on public.xp_ledger from anon, authenticated;
grant select on public.xp_ledger to authenticated;
create policy "dono lê o próprio XP" on public.xp_ledger for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Missões curadas vinculadas a um capítulo
-- ---------------------------------------------------------------------------

alter table public.reward_triggers
  add column if not exists book_code text references public.bible_books (code),
  add column if not exists chapter int;
alter table public.reward_triggers drop constraint if exists reward_triggers_chapter_check;
alter table public.reward_triggers add constraint reward_triggers_chapter_check
  check ((book_code is null) = (chapter is null) and (chapter is null or chapter >= 1));
comment on column public.reward_triggers.book_code is 'Missão/marco concluído ao finalizar uma missão de leitura deste capítulo.';

-- ---------------------------------------------------------------------------
-- Sessões de missão finalizadas
-- ---------------------------------------------------------------------------

create table public.reading_sessions (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  book_code text not null references public.bible_books (code),
  chapter int not null check (chapter >= 1),
  mode text not null check (mode in ('physical', 'digital')),
  started_at timestamptz not null,
  completed_at timestamptz not null default now(),
  active_seconds int not null check (active_seconds >= 0),
  reported_seconds int not null check (reported_seconds >= 0),
  is_reread boolean not null,
  result jsonb not null
);
create index reading_sessions_user_idx on public.reading_sessions (user_id, completed_at desc);
alter table public.reading_sessions enable row level security;
revoke all on public.reading_sessions from anon, authenticated;
grant select on public.reading_sessions to authenticated;
create policy "dono lê as próprias missões" on public.reading_sessions for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Progresso
-- ---------------------------------------------------------------------------

create or replace function private.reading_snapshot(p_user uuid, p_book text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with done as (
    select distinct d.payload ->> 'book' as book, (d.payload ->> 'chapter')::int as chapter
    from private.domain_events d
    where d.user_id = p_user and d.event_type = 'CHAPTER_COMPLETED'
  ), total as (select sum(chapters)::int n from public.bible_books)
  select jsonb_build_object(
    'chaptersCompleted', (select count(*) from done),
    'totalChapters', (select n from total),
    'percent', round((select count(*) from done) * 100.0 / (select n from total), 2),
    'booksCompleted', (select count(*) from public.bible_books b where (select count(*) from done where done.book = b.code) = b.chapters),
    'xpTotal', coalesce((select sum(x.amount) from public.xp_ledger x where x.user_id = p_user), 0),
    'book', (
      select jsonb_build_object(
        'code', b.code, 'name', b.name, 'total', b.chapters,
        'completed', (select count(*) from done where done.book = b.code),
        'isComplete', (select count(*) from done where done.book = b.code) = b.chapters,
        'legendaryItemId', (select i.id from public.cosmetic_items i where i.rarity = 'legendary' and i.book_code = b.code and i.is_active))
      from public.bible_books b where b.code = p_book)
  );
$$;

-- ---------------------------------------------------------------------------
-- Finalizar uma missão de leitura
-- ---------------------------------------------------------------------------

/**
 * Finaliza a missão p_session_id (UUID gerado pelo app). Idempotente: a mesma sessão devolve o
 * mesmo resultado com duplicate = true. A conclusão segue a confirmação do jogador, sem tempo mínimo;
 * o tempo informado é limitado ao tempo decorrido desde o início.
 */
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
declare
  v_uid uuid := private.require_uid();
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
begin
  if p_session_id is null then
    raise exception using errcode = 'P0001', message = 'invalid_session';
  end if;
  if not exists (select 1 from public.profiles p where p.id = v_uid) then
    raise exception using errcode = 'P0001', message = 'profile_required';
  end if;
  -- mesma trava do motor de recompensas: finalizações do mesmo usuário são serializadas
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 42));

  select * into v_existing from public.reading_sessions s where s.id = p_session_id;
  if found then
    if v_existing.user_id <> v_uid then
      raise exception using errcode = 'P0001', message = 'invalid_session';
    end if;
    if v_existing.book_code <> p_book or v_existing.chapter <> p_chapter then
      raise exception using errcode = 'P0001', message = 'invalid_session', detail = 'mismatch';
    end if;
    return v_existing.result || jsonb_build_object('duplicate', true);
  end if;

  select * into v_book from public.bible_books b where b.code = p_book;
  if v_book.code is null or p_chapter is null or p_chapter not between 1 and v_book.chapters then
    raise exception using errcode = 'P0001', message = 'invalid_chapter';
  end if;
  if p_mode is null or p_mode not in ('physical', 'digital') then
    raise exception using errcode = 'P0001', message = 'invalid_mode';
  end if;
  if p_started_at is null or p_started_at > now() + interval '5 minutes' or p_started_at < now() - interval '30 days'
     or p_active_seconds is null or p_active_seconds < 0 then
    raise exception using errcode = 'P0001', message = 'invalid_session';
  end if;
  if (select count(*) from public.reading_sessions s where s.user_id = v_uid and s.completed_at > now() - interval '10 minutes')
     >= private.economy('max_missions_per_10min') then
    raise exception using errcode = 'P0001', message = 'too_many_missions';
  end if;

  v_active := least(p_active_seconds, greatest(0, ceil(extract(epoch from now() - p_started_at))::int + 60));
  v_reread := exists (
    select 1 from private.domain_events d
    where d.user_id = v_uid and d.event_type = 'CHAPTER_COMPLETED'
      and d.payload ->> 'book' = p_book and (d.payload ->> 'chapter')::int = p_chapter);
  v_was_complete := private.book_chapters_complete(v_uid, p_book);

  -- 1. capítulo pelo motor existente (inédito: chave do capítulo; releitura: chave da sessão)
  v_source := case when v_reread then 'mission:' || p_session_id::text else 'chapter:' || p_book || '.' || p_chapter end;
  v_ev := private.record_event(v_uid, 'CHAPTER_COMPLETED', v_source,
    jsonb_build_object('book', p_book, 'chapter', p_chapter, 'session', p_session_id, 'mode', p_mode));
  v_granted := v_granted || coalesce(v_ev -> 'granted', '[]'::jsonb);
  -- corrida com outra sessão do mesmo capítulo: quem chegou depois é releitura
  if (v_ev ->> 'duplicate')::boolean then
    v_reread := true;
  end if;

  -- 2. livro concluído agora (histórico; o lendário já foi avaliado pelos capítulos)
  if not v_was_complete and private.book_chapters_complete(v_uid, p_book) then
    v_ev := private.record_event(v_uid, 'BOOK_COMPLETED', 'book:' || p_book, jsonb_build_object('book', p_book));
    v_granted := v_granted || coalesce(v_ev -> 'granted', '[]'::jsonb);
  end if;

  -- 3. missões e marcos curados vinculados a este capítulo (uma vez por usuário)
  for v_trigger in
    select t.id, t.kind, t.name from public.reward_triggers t
    where t.is_active and t.book_code = p_book and t.chapter = p_chapter and t.kind in ('mission', 'milestone')
    order by t.id
  loop
    v_ev := private.record_event(v_uid,
      case v_trigger.kind when 'mission' then 'MISSION_COMPLETED' else 'MILESTONE_REACHED' end,
      v_trigger.kind || ':' || v_trigger.id,
      jsonb_build_object(v_trigger.kind, v_trigger.id));
    v_granted := v_granted || coalesce(v_ev -> 'granted', '[]'::jsonb);
    if not (v_ev ->> 'duplicate')::boolean then
      v_missions := v_missions || jsonb_build_object('id', v_trigger.id, 'kind', v_trigger.kind, 'name', v_trigger.name);
    end if;
  end loop;

  -- 4. XP (chave única: capítulo inédito ou sessão de releitura)
  v_xp := private.economy(case when v_reread then 'xp_reread' else 'xp_new_chapter' end);
  if v_xp > 0 then
    insert into public.xp_ledger (user_id, event_type, source_event_id, amount)
    values (v_uid, case when v_reread then 'CHAPTER_REREAD' else 'CHAPTER_COMPLETED' end,
            case when v_reread then 'mission:' || p_session_id::text else 'chapter:' || p_book || '.' || p_chapter end, v_xp)
    on conflict (user_id, event_type, source_event_id) do nothing
    returning amount into v_xp_awarded;
  end if;

  v_snapshot := private.reading_snapshot(v_uid, p_book);
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
    'duplicate', false);

  insert into public.reading_sessions (id, user_id, book_code, chapter, mode, started_at, active_seconds, reported_seconds, is_reread, result)
  values (p_session_id, v_uid, p_book, p_chapter, p_mode, p_started_at, v_active, p_active_seconds, v_reread, v_result);
  return v_result;
end;
$$;

/** Resumo para a tela de missões: progresso, XP e capítulos concluídos de cada livro. */
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
revoke all on function public.complete_reading_mission(uuid, text, int, text, timestamptz, int) from public, anon;
revoke all on function public.get_mission_overview() from public, anon;
grant execute on function public.complete_reading_mission(uuid, text, int, text, timestamptz, int) to authenticated;
grant execute on function public.get_mission_overview() to authenticated;
