-- ARQUIVO GERADO por scripts/generate-catalog-sql.mjs — não edite à mão.
-- Catálogo de avatar v3: opções de aparência e itens iniciais gratuitos.

insert into public.avatar_appearance_options (id, category, name, sort_order, catalog_version) values
  ('body-a', 'body', 'Modelo A', 0, 3),
  ('body-b', 'body', 'Modelo B', 1, 3),
  ('body-c', 'body', 'Modelo C', 2, 3),
  ('skin-1', 'skin_tone', 'Tom 1', 0, 3),
  ('skin-2', 'skin_tone', 'Tom 2', 1, 3),
  ('skin-3', 'skin_tone', 'Tom 3', 2, 3),
  ('skin-4', 'skin_tone', 'Tom 4', 3, 3),
  ('skin-5', 'skin_tone', 'Tom 5', 4, 3),
  ('skin-6', 'skin_tone', 'Tom 6', 5, 3),
  ('eyes-round', 'eyes', 'Redondos', 0, 3),
  ('eyes-almond', 'eyes', 'Amendoados', 1, 3),
  ('eyes-soft', 'eyes', 'Serenos', 2, 3),
  ('eyes-wide', 'eyes', 'Atentos', 3, 3),
  ('eyes-narrow', 'eyes', 'Estreitos', 4, 3),
  ('eyes-joy', 'eyes', 'Sorridentes', 5, 3),
  ('brows-soft', 'brows', 'Suaves', 0, 3),
  ('brows-straight', 'brows', 'Retas', 1, 3),
  ('brows-arched', 'brows', 'Arqueadas', 2, 3),
  ('brows-thick', 'brows', 'Grossas', 3, 3),
  ('expr-smile', 'expression', 'Sorriso', 0, 3),
  ('expr-joy', 'expression', 'Alegria', 1, 3),
  ('expr-calm', 'expression', 'Sereno', 2, 3),
  ('expr-determined', 'expression', 'Determinado', 3, 3),
  ('expr-wonder', 'expression', 'Admirado', 4, 3),
  ('beard-none', 'beard', 'Sem barba', 0, 3),
  ('beard-stubble', 'beard', 'Por fazer', 1, 3),
  ('beard-mustache', 'beard', 'Bigode', 2, 3),
  ('beard-goatee', 'beard', 'Cavanhaque', 3, 3),
  ('beard-short', 'beard', 'Curta', 4, 3),
  ('beard-full', 'beard', 'Cheia', 5, 3),
  ('beard-long', 'beard', 'Longa', 6, 3),
  ('hair-shaved', 'hair_style', 'Raspado', 0, 3),
  ('hair-short', 'hair_style', 'Curto', 1, 3),
  ('hair-side-part', 'hair_style', 'Repartido', 2, 3),
  ('hair-curly', 'hair_style', 'Cacheado', 3, 3),
  ('hair-afro', 'hair_style', 'Crespo volumoso', 4, 3),
  ('hair-wavy', 'hair_style', 'Ondulado médio', 5, 3),
  ('hair-long', 'hair_style', 'Longo liso', 6, 3),
  ('hair-long-wavy', 'hair_style', 'Longo ondulado', 7, 3),
  ('hair-braids', 'hair_style', 'Tranças', 8, 3),
  ('hair-bun', 'hair_style', 'Coque', 9, 3),
  ('hair-ponytail', 'hair_style', 'Rabo de cavalo', 10, 3),
  ('hair-locs', 'hair_style', 'Dreadlocks', 11, 3),
  ('haircolor-black', 'hair_color', 'Preto', 0, 3),
  ('haircolor-darkbrown', 'hair_color', 'Castanho escuro', 1, 3),
  ('haircolor-brown', 'hair_color', 'Castanho', 2, 3),
  ('haircolor-auburn', 'hair_color', 'Acaju', 3, 3),
  ('haircolor-copper', 'hair_color', 'Cobre', 4, 3),
  ('haircolor-honey', 'hair_color', 'Loiro mel', 5, 3),
  ('haircolor-blond', 'hair_color', 'Loiro claro', 6, 3),
  ('haircolor-gray', 'hair_color', 'Grisalho', 7, 3)
on conflict (id) do update set
  category = excluded.category, name = excluded.name,
  sort_order = excluded.sort_order, catalog_version = excluded.catalog_version, is_active = true;

insert into public.cosmetic_items (id, name, category, slot, rarity, description, scripture_ref, asset_manifest_key, is_starter, is_premium_cosmetic, catalog_version, body_compatibility, variant_label) values
  ('tunic-linen', 'Túnica de Linho', 'tunic', 'outfit', 'common', 'Túnica simples de linho cru, para começar a jornada.', null, 'outfit/tunic-linen', true, false, 3, null, null),
  ('tunic-olive', 'Túnica Oliveira', 'tunic', 'outfit', 'common', 'Tecido verde como as folhas de oliveira.', null, 'outfit/tunic-olive', true, false, 3, null, null),
  ('tunic-terracotta', 'Túnica Terracota', 'tunic', 'outfit', 'common', 'Cor de barro cozido, com barra bordada.', null, 'outfit/tunic-terracotta', true, false, 3, null, null),
  ('tunic-indigo', 'Túnica Índigo', 'tunic', 'outfit', 'common', 'Azul profundo tingido à mão, com listras verticais.', null, 'outfit/tunic-indigo', true, false, 3, null, null),
  ('tunic-ochre', 'Túnica Ocre', 'tunic', 'outfit', 'common', 'Tom de areia ao entardecer.', null, 'outfit/tunic-ochre', true, false, 3, null, null),
  ('tunic-sky', 'Túnica Céu da Galileia', 'tunic', 'outfit', 'common', 'Azul claro como o céu sobre o lago.', null, 'outfit/tunic-sky', true, false, 3, null, null),
  ('tunic-pomegranate', 'Túnica Romã', 'tunic', 'outfit', 'common', 'Vermelho-romã com gola trabalhada.', null, 'outfit/tunic-pomegranate', true, false, 3, null, null),
  ('tunic-stone', 'Túnica Pedra', 'tunic', 'outfit', 'common', 'Cinza discreto, resistente para viagens.', null, 'outfit/tunic-stone', true, false, 3, null, null),
  ('tunic-joseph', 'Túnica de José', 'tunic', 'outfit', 'epic', 'Inspirada na túnica que Jacó deu a José (Gênesis 37:3). Recompensa simbólica, não uma relíquia histórica.', 'Gênesis 37:3', 'outfit/tunic-joseph', false, false, 3, null, null),
  ('cloak-wool', 'Manto de Lã', 'cloak', 'back', 'common', 'Manto quente de lã de ovelha.', null, 'back/cloak-wool', true, false, 3, null, null),
  ('cloak-desert', 'Manto do Deserto', 'cloak', 'back', 'common', 'Leve e claro, protege do sol.', null, 'back/cloak-desert', true, false, 3, null, null),
  ('cloak-shepherd', 'Manto do Pastor', 'cloak', 'back', 'common', 'Listrado, como os mantos de quem cuida do rebanho.', null, 'back/cloak-shepherd', true, false, 3, null, null),
  ('cloak-night', 'Manto Noturno', 'cloak', 'back', 'common', 'Azul-noite para as vigílias sob as estrelas.', null, 'back/cloak-night', true, false, 3, null, null),
  ('cloak-crimson', 'Manto Carmim', 'cloak', 'back', 'common', 'Tecido carmim de bordas douradas.', null, 'back/cloak-crimson', true, false, 3, null, null),
  ('sandals-leather', 'Sandálias de Couro', 'footwear', 'feet', 'common', 'Sandálias simples para longas caminhadas.', null, 'feet/sandals-leather', true, false, 3, null, null),
  ('sandals-woven', 'Sandálias Trançadas', 'footwear', 'feet', 'common', 'Tiras de palha trançada.', null, 'feet/sandals-woven', true, false, 3, null, null),
  ('sandals-laced', 'Sandálias de Tiras Altas', 'footwear', 'feet', 'common', 'Tiras amarradas até o tornozelo.', null, 'feet/sandals-laced', true, false, 3, null, null),
  ('boots-travel', 'Botas de Viagem', 'footwear', 'feet', 'common', 'Couro grosso para estradas de pedra.', null, 'feet/boots-travel', true, false, 3, null, null),
  ('shoes-cloth', 'Sapatilhas de Pano', 'footwear', 'feet', 'common', 'Macias e silenciosas.', null, 'feet/shoes-cloth', true, false, 3, null, null),
  ('sandals-red', 'Sandálias Rubras', 'footwear', 'feet', 'common', 'Couro tingido de vermelho.', null, 'feet/sandals-red', true, false, 3, null, null),
  ('belt-rope', 'Cinto de Corda', 'belt', 'waist', 'common', 'Corda trançada amarrada com um nó.', null, 'waist/belt-rope', true, false, 3, null, null),
  ('belt-leather', 'Cinto de Couro', 'belt', 'waist', 'common', 'Couro curtido com fivela de bronze.', null, 'waist/belt-leather', true, false, 3, null, null),
  ('sash-blue', 'Faixa Azul', 'belt', 'waist', 'common', 'Faixa de tecido azul com pontas soltas.', null, 'waist/sash-blue', true, false, 3, null, null),
  ('sash-scarlet', 'Faixa Escarlate', 'belt', 'waist', 'common', 'Faixa vermelha com pontas soltas.', null, 'waist/sash-scarlet', true, false, 3, null, null),
  ('belt-woven', 'Cinto Tecido', 'belt', 'waist', 'common', 'Faixa tecida com padrão geométrico.', null, 'waist/belt-woven', true, false, 3, null, null),
  ('belt-pouch', 'Cinto com Bolsa', 'belt', 'waist', 'common', 'Cinto de couro com uma pequena bolsa.', null, 'waist/belt-pouch', true, false, 3, null, null),
  ('headband-linen', 'Faixa de Cabeça', 'accessory', 'head', 'common', 'Faixa de linho amarrada na testa.', null, 'head/headband-linen', true, false, 3, null, null),
  ('headwrap-sand', 'Turbante de Areia', 'accessory', 'head', 'common', 'Tecido enrolado que protege do sol.', null, 'head/headwrap-sand', true, false, 3, null, null),
  ('headscarf-ochre', 'Lenço de Cabeça', 'accessory', 'head', 'common', 'Lenço leve que cobre cabeça e ombros.', null, 'head/headscarf-ochre', true, false, 3, null, null),
  ('necklace-cord', 'Colar de Cordão', 'accessory', 'neck', 'common', 'Cordão com um pingente de folha de oliveira.', null, 'neck/necklace-cord', true, false, 3, null, null),
  ('necklace-beads', 'Colar de Contas', 'accessory', 'neck', 'common', 'Contas de barro pintadas à mão.', null, 'neck/necklace-beads', true, false, 3, null, null),
  ('scarf-neck', 'Lenço de Pescoço', 'accessory', 'neck', 'common', 'Tecido enrolado no pescoço.', null, 'neck/scarf-neck', true, false, 3, null, null),
  ('staff-shepherd', 'Cajado de Pastor', 'accessory', 'hands', 'common', 'Cajado de madeira com ponta curva.', null, 'hands/staff-shepherd', true, false, 3, null, null),
  ('scroll-simple', 'Pergaminho', 'accessory', 'hands', 'common', 'Um rolo para anotar a jornada.', null, 'hands/scroll-simple', true, false, 3, null, null),
  ('oil-lamp', 'Lamparina', 'accessory', 'hands', 'common', 'Pequena lamparina de barro.', null, 'hands/oil-lamp', true, false, 3, null, null),
  ('bg-parchment', 'Pergaminho Antigo', 'background', 'background', 'common', 'Fundo padrão de pergaminho com colinas.', null, 'background/bg-parchment', true, false, 3, null, null),
  ('sandals-desert', 'Sandálias do Deserto', 'footwear', 'feet', 'rare', 'Inspiradas no chamado de Moisés diante da sarça, quando ouviu: “tira as sandálias dos pés” (Êxodo 3:5). Simbólicas, sem pretensão de autenticidade histórica.', 'Êxodo 3:5', 'feet/sandals-desert', false, false, 3, null, null),
  ('staff-moses', 'Vara de Moisés', 'accessory', 'hands', 'rare', 'Lembra a vara que Moisés estendeu sobre o mar (Êxodo 14:16). Item simbólico, sem poderes.', 'Êxodo 14:16', 'hands/staff-moses', false, false, 3, null, null),
  ('sling-david', 'Funda de Davi', 'accessory', 'hands', 'rare', 'Inspirada na funda e nas cinco pedras lisas com que Davi enfrentou Golias (1 Samuel 17:40, 49).', '1 Samuel 17:40', 'hands/sling-david', false, false, 3, null, null),
  ('harp-psalmist', 'Harpa do Salmista', 'accessory', 'hands', 'epic', 'Lembra Davi tocando harpa (1 Samuel 16:23) e os cânticos dos Salmos. Marco de leitura temática.', '1 Samuel 16:23', 'hands/harp-psalmist', false, false, 3, null, null),
  ('cloak-elijah', 'Manto de Elias', 'cloak', 'back', 'epic', 'Inspirado no manto que Elias lançou sobre Eliseu ao chamá-lo (1 Reis 19:19).', '1 Reis 19:19', 'back/cloak-elijah', false, false, 3, null, null),
  ('cloak-succession', 'Manto da Sucessão', 'cloak', 'back', 'epic', 'Evolução visual do Manto de Elias, lembrando quando Eliseu apanhou o manto e seguiu o chamado (2 Reis 2:13-14). A versão original continua no inventário.', '2 Reis 2:13-14', 'back/cloak-succession', false, false, 3, null, 'Após a passagem a Eliseu'),
  ('cloak-elijah-prophets', 'Manto de Elias — Edição dos Profetas', 'cloak', 'back', 'legendary', 'Aparência especial do Manto de Elias, recompensa da Coleção dos Profetas. Puramente cosmética.', '1 Reis 19:19; 2 Reis 2:13-14', 'back/cloak-elijah-prophets', false, false, 3, null, 'Edição especial de coleção'),
  ('scroll-isaiah', 'Rolo de Isaías', 'accessory', 'hands', 'rare', 'Lembra o rolo do profeta Isaías lido na sinagoga de Nazaré (Lucas 4:17).', 'Lucas 4:17', 'hands/scroll-isaiah', false, false, 3, null, null),
  ('crown-wisdom', 'Coroa da Sabedoria', 'accessory', 'head', 'epic', 'Recompensa simbólica pela leitura de Provérbios: “ela te dará uma coroa de glória” (Provérbios 4:9). Não representa relíquia.', 'Provérbios 4:9', 'head/crown-wisdom', false, false, 3, null, null),
  ('frame-complete', 'Moldura Jornada Completa', 'frame', 'frame', 'legendary', 'Celebra a leitura dos 1.189 capítulos da Bíblia (66 livros). “Lâmpada para os meus pés é a tua palavra” (Salmos 119:105).', 'Salmos 119:105', 'frame/frame-complete', false, false, 3, null, null),
  ('bg-sinai', 'Fundo do Monte Sinai', 'background', 'background', 'epic', 'Fundo ilustrado do monte Sinai (Êxodo 19:20). Recompensa da Coleção de Moisés.', 'Êxodo 19:20', 'background/bg-sinai', false, false, 3, null, null),
  ('bg-bethlehem', 'Fundo dos Campos de Belém', 'background', 'background', 'epic', 'Os campos onde Davi apascentava as ovelhas (1 Samuel 16:11). Recompensa da Coleção de Davi.', '1 Samuel 16:11', 'background/bg-bethlehem', false, false, 3, null, null)
on conflict (id) do update set
  name = excluded.name, category = excluded.category, slot = excluded.slot,
  rarity = excluded.rarity, description = excluded.description, scripture_ref = excluded.scripture_ref,
  asset_manifest_key = excluded.asset_manifest_key, is_starter = excluded.is_starter,
  is_premium_cosmetic = excluded.is_premium_cosmetic, catalog_version = excluded.catalog_version,
  body_compatibility = excluded.body_compatibility, variant_label = excluded.variant_label;

-- Variantes evolutivas (cada variante é um item próprio; a base permanece).
update public.cosmetic_items set variant_of = 'cloak-elijah' where id = 'cloak-succession';
update public.cosmetic_items set variant_of = 'cloak-elijah' where id = 'cloak-elijah-prophets';

-- Regras de desbloqueio: itens iniciais são gratuitos e concedidos pelo servidor.
insert into public.item_unlock_rules (item_id, rule_type, rule_payload, revision)
select i.id, 'starter', jsonb_build_object('catalogVersion', 3), 1
from public.cosmetic_items i
where i.is_starter and not i.is_premium_cosmetic
on conflict (item_id) where rule_type = 'starter' do nothing;

-- Regras de desbloqueio por leitura (avaliadas pelo servidor no Marco 3).
insert into public.item_unlock_rules (item_id, rule_type, rule_payload, requirements, revision) values
  ('tunic-joseph', 'chapter_completed', '{"book":"GEN","chapter":37,"label":"Conclua a leitura de Gênesis 37"}'::jsonb, '[]'::jsonb, 1),
  ('sandals-desert', 'chapter_completed', '{"book":"EXO","chapter":3,"label":"Conclua a leitura de Êxodo 3"}'::jsonb, '[]'::jsonb, 1),
  ('staff-moses', 'chapter_completed', '{"book":"EXO","chapter":14,"label":"Conclua a leitura de Êxodo 14"}'::jsonb, '[]'::jsonb, 1),
  ('sling-david', 'chapter_completed', '{"book":"1SA","chapter":17,"label":"Conclua a leitura de 1 Samuel 17"}'::jsonb, '[]'::jsonb, 1),
  ('harp-psalmist', 'chapters_count', '{"book":"PSA","count":30,"label":"Leia 30 salmos diferentes"}'::jsonb, '[]'::jsonb, 1),
  ('cloak-elijah', 'chapter_completed', '{"book":"1KI","chapter":19,"label":"Conclua a leitura de 1 Reis 19"}'::jsonb, '[]'::jsonb, 1),
  ('cloak-succession', 'chapter_completed', '{"book":"2KI","chapter":2,"label":"Conclua 2 Reis 2 tendo o Manto de Elias"}'::jsonb, '[{"type":"item_owned","item":"cloak-elijah"}]'::jsonb, 1),
  ('cloak-elijah-prophets', 'collection_completed', '{"collection":"prophets","label":"Complete a Coleção dos Profetas"}'::jsonb, '[]'::jsonb, 1),
  ('scroll-isaiah', 'book_completed', '{"book":"ISA","label":"Conclua o livro de Isaías"}'::jsonb, '[]'::jsonb, 1),
  ('crown-wisdom', 'book_completed', '{"book":"PRO","label":"Conclua o livro de Provérbios"}'::jsonb, '[]'::jsonb, 1),
  ('frame-complete', 'chapters_count', '{"count":1189,"label":"Leia os 1.189 capítulos da Bíblia"}'::jsonb, '[]'::jsonb, 1),
  ('bg-sinai', 'collection_completed', '{"collection":"moses","label":"Complete a Coleção de Moisés"}'::jsonb, '[]'::jsonb, 1),
  ('bg-bethlehem', 'collection_completed', '{"collection":"david","label":"Complete a Coleção de Davi"}'::jsonb, '[]'::jsonb, 1)
on conflict (item_id, rule_type, revision) do update set
  rule_payload = excluded.rule_payload, requirements = excluded.requirements;

-- Coleções e itens de coleção.
insert into public.item_collections (id, name, description, reward_item_id, sort_order) values
  ('moses', 'Coleção de Moisés', 'Do chamado na sarça à travessia do mar.', 'bg-sinai', 0),
  ('david', 'Coleção de Davi', 'O pastor, o guerreiro e o salmista.', 'bg-bethlehem', 1),
  ('prophets', 'Coleção dos Profetas', 'Elias, Eliseu e Isaías.', 'cloak-elijah-prophets', 2)
on conflict (id) do update set name = excluded.name, description = excluded.description,
  reward_item_id = excluded.reward_item_id, sort_order = excluded.sort_order;
insert into public.collection_items (collection_id, item_id, sort_order) values
  ('moses', 'sandals-desert', 0),
  ('moses', 'staff-moses', 1),
  ('david', 'sling-david', 0),
  ('david', 'harp-psalmist', 1),
  ('prophets', 'cloak-elijah', 0),
  ('prophets', 'cloak-succession', 1),
  ('prophets', 'scroll-isaiah', 2)
on conflict (collection_id, item_id) do update set sort_order = excluded.sort_order;
