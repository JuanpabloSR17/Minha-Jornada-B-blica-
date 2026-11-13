-- Próxima leitura sugerida pelo progresso da conta (aditiva).
-- Num aparelho novo o app não tem a última leitura local: o servidor calcula, a partir dos capítulos já
-- registrados, o próximo capítulo inédito depois da última leitura (na ordem canônica, voltando ao
-- início se preciso). A releitura continua disponível por escolha na aba Ler.

create or replace function public.get_next_reading()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_uid();
  v_last_book text;
  v_last_chapter int;
  v_last_pos int;
  v_next record;
  v_total int;
  v_done int;
begin
  -- última leitura: a sessão mais recente; sem sessões, o último capítulo registrado por evento
  select s.book_code, s.chapter into v_last_book, v_last_chapter
  from public.reading_sessions s where s.user_id = v_uid
  order by s.completed_at desc limit 1;
  if v_last_book is null then
    select d.payload ->> 'book', (d.payload ->> 'chapter')::int into v_last_book, v_last_chapter
    from private.domain_events d where d.user_id = v_uid and d.event_type = 'CHAPTER_COMPLETED'
    order by d.created_at desc limit 1;
  end if;
  select b.book_order * 1000 + v_last_chapter into v_last_pos from public.bible_books b where b.code = v_last_book;

  with done as (
    select distinct d.payload ->> 'book' as book, (d.payload ->> 'chapter')::int as chapter
    from private.domain_events d where d.user_id = v_uid and d.event_type = 'CHAPTER_COMPLETED'
  ), all_chapters as (
    select b.code as book, c as chapter, b.book_order * 1000 + c as pos
    from public.bible_books b, generate_series(1, b.chapters) c
  )
  select a.book, a.chapter into v_next
  from all_chapters a
  where not exists (select 1 from done where done.book = a.book and done.chapter = a.chapter)
  order by (a.pos <= coalesce(v_last_pos, 0)), a.pos
  limit 1;

  select count(*) into v_done from (
    select distinct d.payload ->> 'book', d.payload ->> 'chapter'
    from private.domain_events d where d.user_id = v_uid and d.event_type = 'CHAPTER_COMPLETED') t;
  select sum(chapters) into v_total from public.bible_books;

  return jsonb_build_object(
    'last', case when v_last_book is null then null else jsonb_build_object('book', v_last_book, 'chapter', v_last_chapter) end,
    'next', case when v_next.book is null then null else jsonb_build_object('book', v_next.book, 'chapter', v_next.chapter) end,
    'allDone', v_done >= v_total
  );
end;
$$;

revoke all on function public.get_next_reading() from public, anon;
grant execute on function public.get_next_reading() to authenticated;
