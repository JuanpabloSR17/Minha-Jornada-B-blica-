-- Conclusão dos sete mundos (aditiva). Derivada dos capítulos já registrados, uma vez por conta.
-- Nenhuma recompensa é fixada aqui: os gatilhos 'world' existem sem itens nem Siclos até a decisão
-- editorial (docs/MUNDOS-RECOMPENSAS.md).

create table public.bible_worlds (
  id text primary key check (id ~ '^[a-z-]{3,32}$'),
  name text not null,
  position int not null unique
);
create table public.bible_world_books (
  world_id text not null references public.bible_worlds (id),
  book_code text not null references public.bible_books (code) unique,
  primary key (world_id, book_code)
);
alter table public.bible_worlds enable row level security;
alter table public.bible_world_books enable row level security;
revoke all on public.bible_worlds, public.bible_world_books from anon, authenticated;
grant select on public.bible_worlds, public.bible_world_books to authenticated;
create policy "mundos visíveis" on public.bible_worlds for select to authenticated using (true);
create policy "livros dos mundos visíveis" on public.bible_world_books for select to authenticated using (true);

insert into public.bible_worlds (id, name, position) values
  ('origens', 'Origens e Aliança', 1),
  ('reinos', 'Terra e Reinos', 2),
  ('sabedoria', 'Poesia e Sabedoria', 3),
  ('profetas', 'Voz dos Profetas', 4),
  ('evangelhos', 'Vida e Ensino de Jesus', 5),
  ('igreja', 'Caminhos da Igreja', 6),
  ('nova-criacao', 'Visão da Nova Criação', 7);

insert into public.bible_world_books (world_id, book_code)
select w, unnest(b) from (values
  ('origens', array['GEN','EXO','LEV','NUM','DEU']),
  ('reinos', array['JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST']),
  ('sabedoria', array['JOB','PSA','PRO','ECC','SNG']),
  ('profetas', array['ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL']),
  ('evangelhos', array['MAT','MRK','LUK','JHN']),
  ('igreja', array['ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD']),
  ('nova-criacao', array['REV'])
) t(w, b);

-- os 66 livros em exatamente um mundo
do $$
begin
  if (select count(*) from public.bible_world_books) <> (select count(*) from public.bible_books) then
    raise exception 'mundos não cobrem os 66 livros';
  end if;
end $$;

-- gatilhos de conclusão (sem itens nem Siclos até a decisão editorial)
insert into public.reward_triggers (id, kind, name, description)
select 'mundo-' || w.id, 'world', 'Mundo: ' || w.name, 'Todos os capítulos de ' || w.name || ' registrados (recompensa em decisão editorial).'
from public.bible_worlds w
on conflict (id) do nothing;

create or replace function private.world_complete(p_user uuid, p_world text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.bible_world_books wb
    join public.bible_books b on b.code = wb.book_code
    cross join lateral generate_series(1, b.chapters) c
    where wb.world_id = p_world
      and not exists (select 1 from private.domain_events d where d.user_id = p_user and d.event_type = 'CHAPTER_COMPLETED'
        and d.payload ->> 'book' = b.code and (d.payload ->> 'chapter')::int = c)
  )
$$;

/** Registra a conclusão do mundo do livro, se todos os capítulos dele já estiverem registrados (uma vez). */
create or replace function private.check_world_for_book(p_user uuid, p_book text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_world text;
begin
  select wb.world_id into v_world from public.bible_world_books wb where wb.book_code = p_book;
  if v_world is null then return; end if;
  if exists (select 1 from private.domain_events d where d.user_id = p_user and d.event_type = 'WORLD_COMPLETED' and d.source_event_id = 'world:' || v_world) then
    return;
  end if;
  if private.world_complete(p_user, v_world) then
    perform private.record_event(p_user, 'WORLD_COMPLETED', 'world:' || v_world, jsonb_build_object('world', 'mundo-' || v_world));
  end if;
end;
$$;

create or replace function private.on_chapter_completed_world()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.check_world_for_book(new.user_id, new.payload ->> 'book');
  return null;
end;
$$;

create trigger domain_events_world_completion
after insert on private.domain_events
for each row when (new.event_type = 'CHAPTER_COMPLETED')
execute function private.on_chapter_completed_world();

-- retroativo: contas que já concluíram algum mundo antes desta migração (idempotente)
do $$
declare r record;
begin
  for r in
    select distinct d.user_id, wb.world_id
    from private.domain_events d join public.bible_world_books wb on wb.book_code = d.payload ->> 'book'
    where d.event_type = 'CHAPTER_COMPLETED'
  loop
    if private.world_complete(r.user_id, r.world_id) then
      perform private.record_event(r.user_id, 'WORLD_COMPLETED', 'world:' || r.world_id, jsonb_build_object('world', 'mundo-' || r.world_id));
    end if;
  end loop;
end $$;

/** Progresso por mundo da conta: capítulos registrados, total e quando foi concluído (servidor). */
create or replace function public.get_world_progress()
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
      'id', w.id, 'name', w.name, 'position', w.position,
      'chapters', (select sum(b.chapters) from public.bible_world_books wb join public.bible_books b on b.code = wb.book_code where wb.world_id = w.id),
      'done', (select count(distinct (d.payload ->> 'book', d.payload ->> 'chapter')) from private.domain_events d
               join public.bible_world_books wb on wb.book_code = d.payload ->> 'book'
               where d.user_id = v_uid and d.event_type = 'CHAPTER_COMPLETED' and wb.world_id = w.id),
      'completedAt', (select d.created_at from private.domain_events d where d.user_id = v_uid and d.event_type = 'WORLD_COMPLETED' and d.source_event_id = 'world:' || w.id)
    ) order by w.position)
    from public.bible_worlds w), '[]'::jsonb);
end;
$$;

revoke all on function private.world_complete(uuid, text), private.check_world_for_book(uuid, text), private.on_chapter_completed_world() from public, anon, authenticated;
revoke all on function public.get_world_progress() from public, anon;
grant execute on function public.get_world_progress() to authenticated;
