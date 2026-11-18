-- Personagens bíblicos com sexo definido na Bíblia (principais e secundários, com nome ou
-- identificados, como a filha de Faraó): só a apresentação do sexo do personagem, nos 3 estilos.
-- Ofícios e figuras genéricas (Pastor, Peregrino, Levita, Ourives, Tocador de shofar…) continuam
-- com a padrão e a feminina. Decisão do usuário, 18/11/2026; amplia 20261201000100. Aditiva.

alter table public.skins add column character_sex text check (character_sex in ('masculino', 'feminino'));

update public.skins set character_sex = 'masculino' where id in (
  'glorioso_moises_rosto_resplandecente', 'glorioso_arao_vara_floresceu', 'lendario_moises', 'lendario_arao',
  'epico_bezalel', 'epico_jetro', 'raro_hur', 'raro_aoliabe');
update public.skins set character_sex = 'feminino' where id in (
  'epico_miria', 'epico_zipora', 'raro_joquebede', 'raro_filha_de_farao', 'raro_parteiras');
-- Lendárias e Gloriosas são sempre personagens; as que ainda não foram marcadas acima (lotes futuros
-- passam o sexo explicitamente) ficam marcadas pela própria raridade na restrição abaixo
update public.skins set variants = '{padrao}' where character_sex is not null;

-- seleções antigas: personagem com a apresentação do outro sexo passa à padrão (mesma skin, estilo e posse)
update public.user_skin_selection u set variant = 'padrao', updated_at = now()
  from public.skins s
 where s.id = u.skin_id and (s.character_sex is not null or s.rarity in ('legendary', 'glorious')) and u.variant <> 'padrao';

alter table public.skins drop constraint if exists skins_principal_single_presentation;
alter table public.skins add constraint skins_character_single_presentation
  check ((character_sex is null and rarity not in ('legendary', 'glorious')) or variants = '{padrao}');
