-- Lendárias e Gloriosas conquistadas lendo (Temporada 1, Êxodo). Aditiva.
-- Cada skin de leitura tem uma regra no servidor: livros a concluir, capítulos a ler e marcos a
-- cumprir. A cada capítulo ou marco registrado, o servidor confere as regras e concede a skin uma
-- única vez (origem "skin-reading:<skin>"). Ninguém compra nem recebe essas skins de outro jeito.
--
--   lendario_moises                       concluir Êxodo
--   glorioso_moises_rosto_resplandecente  concluir Êxodo + cumprir o Marco: Tábuas da Aliança
--   lendario_arao                         ler os 3 capítulos da Trilha do Tabernáculo (Êx 25, 30, 40)
--   glorioso_arao_vara_floresceu          concluir a temporada: Êxodo, Levítico e Números (onde está Nm 17)

create table public.skin_unlock_rules (
  skin_id text primary key references public.skins (id) on delete cascade,
  rule jsonb not null check (jsonb_typeof(rule) = 'object' and rule <> '{}'::jsonb),
  label text not null,
  sort_order int not null default 0
);
alter table public.skin_unlock_rules enable row level security;
create policy "skin_unlock_rules: catálogo legível" on public.skin_unlock_rules for select to authenticated using (true);
revoke all on public.skin_unlock_rules from anon;
revoke insert, update, delete on public.skin_unlock_rules from authenticated;
grant select on public.skin_unlock_rules to authenticated;

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('lendario_moises', '{"books": ["EXO"]}', 'Concluir o livro de Êxodo', 1),
  ('glorioso_moises_rosto_resplandecente', '{"books": ["EXO"], "milestones": ["holy_tabuas_da_alianca"]}',
    'Concluir Êxodo e cumprir o Marco: Tábuas da Aliança', 2),
  ('lendario_arao', '{"chapters": [["EXO", 25], ["EXO", 30], ["EXO", 40]]}', 'Ler os 3 capítulos da Trilha do Tabernáculo', 3),
  ('glorioso_arao_vara_floresceu', '{"books": ["EXO", "LEV", "NUM"]}', 'Concluir a temporada: Êxodo, Levítico e Números', 4);

-- Progresso de uma regra: unidades feitas e totais (capítulos dos livros e da lista, mais marcos).
create or replace function private.skin_rule_progress(p_user uuid, p_rule jsonb)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with read as (
    select distinct d.payload ->> 'book' as book, (d.payload ->> 'chapter')::int as chapter
      from private.domain_events d
     where d.user_id = p_user and d.event_type = 'CHAPTER_COMPLETED'
  ),
  book_units as (
    select count(*) as total,
           count(*) filter (where exists (select 1 from read r where r.book = b.code and r.chapter = c)) as done
      from public.bible_books b
      cross join lateral generate_series(1, b.chapters) c
     where b.code in (select jsonb_array_elements_text(coalesce(p_rule -> 'books', '[]'::jsonb)))
  ),
  chapter_units as (
    select count(*) as total,
           count(*) filter (where exists (select 1 from read r where r.book = x ->> 0 and r.chapter = (x ->> 1)::int)) as done
      from jsonb_array_elements(coalesce(p_rule -> 'chapters', '[]'::jsonb)) x
  ),
  milestone_units as (
    select count(*) as total,
           count(*) filter (where exists (
             select 1 from private.domain_events d
              where d.user_id = p_user and d.event_type = 'MILESTONE_REACHED' and d.payload ->> 'milestone' = m)) as done
      from jsonb_array_elements_text(coalesce(p_rule -> 'milestones', '[]'::jsonb)) m
  )
  select jsonb_build_object(
    'done', b.done + c.done + m.done,
    'total', b.total + c.total + m.total)
    from book_units b, chapter_units c, milestone_units m
$$;

-- Concede as skins de leitura cujas regras a conta já cumpriu (idempotente). Devolve as concedidas agora.
create or replace function private.grant_reading_skins(p_user uuid)
returns setof text
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  v jsonb;
begin
  if not exists (select 1 from public.profiles p where p.id = p_user) then return; end if;
  for r in
    select u.skin_id, u.rule from public.skin_unlock_rules u join public.skins s on s.id = u.skin_id
     where s.is_active
       and not exists (select 1 from public.user_skins us where us.user_id = p_user and us.skin_id = u.skin_id)
     order by u.sort_order
  loop
    v := private.skin_rule_progress(p_user, r.rule);
    if (v ->> 'total')::int > 0 and (v ->> 'done')::int >= (v ->> 'total')::int then
      insert into public.user_skins (user_id, skin_id, source_event_id)
      values (p_user, r.skin_id, 'skin-reading:' || r.skin_id)
      on conflict (user_id, skin_id) do nothing;
      if found then return next r.skin_id; end if;
    end if;
  end loop;
end;
$$;

create or replace function private.on_event_grant_reading_skins()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.grant_reading_skins(new.user_id);
  return null;
end;
$$;

create trigger domain_events_reading_skins
after insert on private.domain_events
for each row when (new.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED'))
execute function private.on_event_grant_reading_skins();

-- Skins do jogador agora trazem a origem, e as skins de leitura trazem a regra e o progresso.
create or replace function public.get_my_skins()
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
    'selected', private.skin_selection(v_uid),
    'owned', coalesce((
      select jsonb_agg(jsonb_build_object('skinId', s.id, 'acquiredAt', u.acquired_at,
               'source', coalesce(split_part(u.source_event_id, ':', 1), 'inicio')) order by s.sort_order)
        from public.skins s
        left join public.user_skins u on u.skin_id = s.id and u.user_id = v_uid
       where s.is_active and (u.user_id is not null or s.origin = 'inicio')
    ), '[]'::jsonb),
    'reading', coalesce((
      select jsonb_agg(jsonb_build_object('skinId', r.skin_id, 'label', r.label)
               || private.skin_rule_progress(v_uid, r.rule) order by r.sort_order)
        from public.skin_unlock_rules r join public.skins s on s.id = r.skin_id
       where s.is_active
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function private.skin_rule_progress(uuid, jsonb) from public, anon, authenticated;
revoke all on function private.grant_reading_skins(uuid) from public, anon, authenticated;
revoke all on function private.on_event_grant_reading_skins() from public, anon, authenticated;
revoke all on function public.get_my_skins() from public, anon;
grant execute on function public.get_my_skins() to authenticated;

-- retroativo: quem já cumpriu alguma regra antes desta migração recebe a skin (idempotente)
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
