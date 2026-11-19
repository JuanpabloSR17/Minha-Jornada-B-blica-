-- Skins da enciclopédia que já entraram por lote: cada uma com regra de leitura (personagens) ou na
-- loja (ofícios), personagens só no próprio sexo, e a conquista acontece lendo.
create function tests.read_range(p_user uuid, p_book text, p_from int, p_to int) returns void language plpgsql as $$
declare c int;
begin
  for c in p_from .. p_to loop
    perform private.record_event(p_user, 'CHAPTER_COMPLETED', 'chapter:' || p_book || '.' || c, jsonb_build_object('book', p_book, 'chapter', c));
  end loop;
end $$;

begin;
select tests.assert(not exists (
  select 1 from public.skins s where s.season = 'enciclopedia' and not s.in_shop
     and not exists (select 1 from public.skin_unlock_rules r where r.skin_id = s.id)),
  'toda skin de personagem da enciclopédia tem regra de leitura');
select tests.assert(not exists (select 1 from public.skins s where s.season = 'enciclopedia' and s.rarity in ('legendary', 'glorious') and s.character_sex is null),
  'Lendárias e Gloriosas da enciclopédia têm o sexo do personagem marcado');
select tests.assert(not exists (select 1 from public.skins s where s.season = 'enciclopedia' and s.character_sex is not null and s.variants <> '{padrao}'),
  'personagens da enciclopédia só no próprio sexo');
select tests.mk_m('bf000000-0000-0000-0000-0000000000bf', 'leitor_p01', 0);
select tests.read_range('bf000000-0000-0000-0000-0000000000bf', 'GEN', 37, 49);
select tests.assert(not exists (select 1 from public.user_skins where user_id = 'bf000000-0000-0000-0000-0000000000bf' and skin_id = 'lendario_jose'),
  'Gênesis 37–49 ainda não concede as Vestes de José');
select tests.read_range('bf000000-0000-0000-0000-0000000000bf', 'GEN', 50, 50);
select tests.assert(exists (select 1 from public.user_skins where user_id = 'bf000000-0000-0000-0000-0000000000bf' and skin_id = 'lendario_jose'),
  'Gênesis 37–50 concede as Vestes de José');
select tests.assert(not exists (select 1 from public.user_skins where user_id = 'bf000000-0000-0000-0000-0000000000bf' and skin_id like 'glorioso_%'),
  'as Gloriosas das Origens pedem o mundo inteiro');
select tests.read_range('bf000000-0000-0000-0000-0000000000bf', b.code, 1, b.chapters) from public.bible_books b where b.code in ('GEN', 'EXO', 'LEV', 'NUM', 'DEU');
select tests.assert((select count(*) from public.user_skins where user_id = 'bf000000-0000-0000-0000-0000000000bf'
   and skin_id in ('glorioso_jose_governador_do_egito', 'glorioso_abraao_sob_as_estrelas', 'glorioso_noe_e_o_arco_iris')) = 3,
  'concluir o mundo das Origens concede as 3 Gloriosas de Gênesis');
rollback;
