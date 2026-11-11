-- ARQUIVO GERADO por scripts/generate-catalog-sql.mjs — não edite à mão.
-- Catálogo de avatar v2: opções de aparência e itens iniciais gratuitos.

insert into public.avatar_appearance_options (id, category, name, sort_order, catalog_version) values
  ('body-a', 'body', 'Modelo A', 0, 2),
  ('body-b', 'body', 'Modelo B', 1, 2),
  ('body-c', 'body', 'Modelo C', 2, 2),
  ('skin-1', 'skin_tone', 'Tom 1', 0, 2),
  ('skin-2', 'skin_tone', 'Tom 2', 1, 2),
  ('skin-3', 'skin_tone', 'Tom 3', 2, 2),
  ('skin-4', 'skin_tone', 'Tom 4', 3, 2),
  ('skin-5', 'skin_tone', 'Tom 5', 4, 2),
  ('skin-6', 'skin_tone', 'Tom 6', 5, 2),
  ('eyes-round', 'eyes', 'Redondos', 0, 2),
  ('eyes-almond', 'eyes', 'Amendoados', 1, 2),
  ('eyes-soft', 'eyes', 'Serenos', 2, 2),
  ('eyes-wide', 'eyes', 'Atentos', 3, 2),
  ('eyes-narrow', 'eyes', 'Estreitos', 4, 2),
  ('eyes-joy', 'eyes', 'Sorridentes', 5, 2),
  ('brows-soft', 'brows', 'Suaves', 0, 2),
  ('brows-straight', 'brows', 'Retas', 1, 2),
  ('brows-arched', 'brows', 'Arqueadas', 2, 2),
  ('brows-thick', 'brows', 'Grossas', 3, 2),
  ('expr-smile', 'expression', 'Sorriso', 0, 2),
  ('expr-joy', 'expression', 'Alegria', 1, 2),
  ('expr-calm', 'expression', 'Sereno', 2, 2),
  ('expr-determined', 'expression', 'Determinado', 3, 2),
  ('expr-wonder', 'expression', 'Admirado', 4, 2),
  ('beard-none', 'beard', 'Sem barba', 0, 2),
  ('beard-stubble', 'beard', 'Por fazer', 1, 2),
  ('beard-mustache', 'beard', 'Bigode', 2, 2),
  ('beard-goatee', 'beard', 'Cavanhaque', 3, 2),
  ('beard-short', 'beard', 'Curta', 4, 2),
  ('beard-full', 'beard', 'Cheia', 5, 2),
  ('beard-long', 'beard', 'Longa', 6, 2),
  ('hair-shaved', 'hair_style', 'Raspado', 0, 2),
  ('hair-short', 'hair_style', 'Curto', 1, 2),
  ('hair-side-part', 'hair_style', 'Repartido', 2, 2),
  ('hair-curly', 'hair_style', 'Cacheado', 3, 2),
  ('hair-afro', 'hair_style', 'Crespo volumoso', 4, 2),
  ('hair-wavy', 'hair_style', 'Ondulado médio', 5, 2),
  ('hair-long', 'hair_style', 'Longo liso', 6, 2),
  ('hair-long-wavy', 'hair_style', 'Longo ondulado', 7, 2),
  ('hair-braids', 'hair_style', 'Tranças', 8, 2),
  ('hair-bun', 'hair_style', 'Coque', 9, 2),
  ('hair-ponytail', 'hair_style', 'Rabo de cavalo', 10, 2),
  ('hair-locs', 'hair_style', 'Dreadlocks', 11, 2),
  ('haircolor-black', 'hair_color', 'Preto', 0, 2),
  ('haircolor-darkbrown', 'hair_color', 'Castanho escuro', 1, 2),
  ('haircolor-brown', 'hair_color', 'Castanho', 2, 2),
  ('haircolor-auburn', 'hair_color', 'Acaju', 3, 2),
  ('haircolor-copper', 'hair_color', 'Cobre', 4, 2),
  ('haircolor-honey', 'hair_color', 'Loiro mel', 5, 2),
  ('haircolor-blond', 'hair_color', 'Loiro claro', 6, 2),
  ('haircolor-gray', 'hair_color', 'Grisalho', 7, 2)
on conflict (id) do update set
  category = excluded.category, name = excluded.name,
  sort_order = excluded.sort_order, catalog_version = excluded.catalog_version, is_active = true;

insert into public.cosmetic_items (id, name, category, slot, rarity, description, scripture_ref, asset_manifest_key, is_starter, is_premium_cosmetic, catalog_version) values
  ('tunic-linen', 'Túnica de Linho', 'tunic', 'outfit', 'common', 'Túnica simples de linho cru, para começar a jornada.', null, 'outfit/tunic-linen', true, false, 2),
  ('tunic-olive', 'Túnica Oliveira', 'tunic', 'outfit', 'common', 'Tecido verde como as folhas de oliveira.', null, 'outfit/tunic-olive', true, false, 2),
  ('tunic-terracotta', 'Túnica Terracota', 'tunic', 'outfit', 'common', 'Cor de barro cozido, com barra bordada.', null, 'outfit/tunic-terracotta', true, false, 2),
  ('tunic-indigo', 'Túnica Índigo', 'tunic', 'outfit', 'common', 'Azul profundo tingido à mão, com listras verticais.', null, 'outfit/tunic-indigo', true, false, 2),
  ('tunic-ochre', 'Túnica Ocre', 'tunic', 'outfit', 'common', 'Tom de areia ao entardecer.', null, 'outfit/tunic-ochre', true, false, 2),
  ('tunic-sky', 'Túnica Céu da Galileia', 'tunic', 'outfit', 'common', 'Azul claro como o céu sobre o lago.', null, 'outfit/tunic-sky', true, false, 2),
  ('tunic-pomegranate', 'Túnica Romã', 'tunic', 'outfit', 'common', 'Vermelho-romã com gola trabalhada.', null, 'outfit/tunic-pomegranate', true, false, 2),
  ('tunic-stone', 'Túnica Pedra', 'tunic', 'outfit', 'common', 'Cinza discreto, resistente para viagens.', null, 'outfit/tunic-stone', true, false, 2),
  ('tunic-joseph', 'Túnica de José', 'tunic', 'outfit', 'epic', 'Inspirada na túnica que Jacó deu a José (Gênesis 37:3). Recompensa simbólica, não uma relíquia histórica.', 'Gênesis 37:3', 'outfit/tunic-joseph', false, false, 2),
  ('cloak-wool', 'Manto de Lã', 'cloak', 'back', 'common', 'Manto quente de lã de ovelha.', null, 'back/cloak-wool', true, false, 2),
  ('cloak-desert', 'Manto do Deserto', 'cloak', 'back', 'common', 'Leve e claro, protege do sol.', null, 'back/cloak-desert', true, false, 2),
  ('cloak-shepherd', 'Manto do Pastor', 'cloak', 'back', 'common', 'Listrado, como os mantos de quem cuida do rebanho.', null, 'back/cloak-shepherd', true, false, 2),
  ('cloak-night', 'Manto Noturno', 'cloak', 'back', 'common', 'Azul-noite para as vigílias sob as estrelas.', null, 'back/cloak-night', true, false, 2),
  ('cloak-crimson', 'Manto Carmim', 'cloak', 'back', 'common', 'Tecido carmim de bordas douradas.', null, 'back/cloak-crimson', true, false, 2),
  ('sandals-leather', 'Sandálias de Couro', 'footwear', 'feet', 'common', 'Sandálias simples para longas caminhadas.', null, 'feet/sandals-leather', true, false, 2),
  ('sandals-woven', 'Sandálias Trançadas', 'footwear', 'feet', 'common', 'Tiras de palha trançada.', null, 'feet/sandals-woven', true, false, 2),
  ('sandals-laced', 'Sandálias de Tiras Altas', 'footwear', 'feet', 'common', 'Tiras amarradas até o tornozelo.', null, 'feet/sandals-laced', true, false, 2),
  ('boots-travel', 'Botas de Viagem', 'footwear', 'feet', 'common', 'Couro grosso para estradas de pedra.', null, 'feet/boots-travel', true, false, 2),
  ('shoes-cloth', 'Sapatilhas de Pano', 'footwear', 'feet', 'common', 'Macias e silenciosas.', null, 'feet/shoes-cloth', true, false, 2),
  ('sandals-red', 'Sandálias Rubras', 'footwear', 'feet', 'common', 'Couro tingido de vermelho.', null, 'feet/sandals-red', true, false, 2),
  ('belt-rope', 'Cinto de Corda', 'belt', 'waist', 'common', 'Corda trançada amarrada com um nó.', null, 'waist/belt-rope', true, false, 2),
  ('belt-leather', 'Cinto de Couro', 'belt', 'waist', 'common', 'Couro curtido com fivela de bronze.', null, 'waist/belt-leather', true, false, 2),
  ('sash-blue', 'Faixa Azul', 'belt', 'waist', 'common', 'Faixa de tecido azul com pontas soltas.', null, 'waist/sash-blue', true, false, 2),
  ('sash-scarlet', 'Faixa Escarlate', 'belt', 'waist', 'common', 'Faixa vermelha com pontas soltas.', null, 'waist/sash-scarlet', true, false, 2),
  ('belt-woven', 'Cinto Tecido', 'belt', 'waist', 'common', 'Faixa tecida com padrão geométrico.', null, 'waist/belt-woven', true, false, 2),
  ('belt-pouch', 'Cinto com Bolsa', 'belt', 'waist', 'common', 'Cinto de couro com uma pequena bolsa.', null, 'waist/belt-pouch', true, false, 2),
  ('headband-linen', 'Faixa de Cabeça', 'accessory', 'head', 'common', 'Faixa de linho amarrada na testa.', null, 'head/headband-linen', true, false, 2),
  ('headwrap-sand', 'Turbante de Areia', 'accessory', 'head', 'common', 'Tecido enrolado que protege do sol.', null, 'head/headwrap-sand', true, false, 2),
  ('headscarf-ochre', 'Lenço de Cabeça', 'accessory', 'head', 'common', 'Lenço leve que cobre cabeça e ombros.', null, 'head/headscarf-ochre', true, false, 2),
  ('necklace-cord', 'Colar de Cordão', 'accessory', 'neck', 'common', 'Cordão com um pingente de folha de oliveira.', null, 'neck/necklace-cord', true, false, 2),
  ('necklace-beads', 'Colar de Contas', 'accessory', 'neck', 'common', 'Contas de barro pintadas à mão.', null, 'neck/necklace-beads', true, false, 2),
  ('scarf-neck', 'Lenço de Pescoço', 'accessory', 'neck', 'common', 'Tecido enrolado no pescoço.', null, 'neck/scarf-neck', true, false, 2),
  ('staff-shepherd', 'Cajado de Pastor', 'accessory', 'hands', 'common', 'Cajado de madeira com ponta curva.', null, 'hands/staff-shepherd', true, false, 2),
  ('scroll-simple', 'Pergaminho', 'accessory', 'hands', 'common', 'Um rolo para anotar a jornada.', null, 'hands/scroll-simple', true, false, 2),
  ('oil-lamp', 'Lamparina', 'accessory', 'hands', 'common', 'Pequena lamparina de barro.', null, 'hands/oil-lamp', true, false, 2),
  ('bg-parchment', 'Pergaminho Antigo', 'background', 'background', 'common', 'Fundo padrão de pergaminho com colinas.', null, 'background/bg-parchment', true, false, 2)
on conflict (id) do update set
  name = excluded.name, category = excluded.category, slot = excluded.slot,
  rarity = excluded.rarity, description = excluded.description, scripture_ref = excluded.scripture_ref,
  asset_manifest_key = excluded.asset_manifest_key, is_starter = excluded.is_starter,
  is_premium_cosmetic = excluded.is_premium_cosmetic, catalog_version = excluded.catalog_version;

-- Regras de desbloqueio: itens iniciais são gratuitos e concedidos pelo servidor.
insert into public.item_unlock_rules (item_id, rule_type, rule_payload, revision)
select i.id, 'starter', jsonb_build_object('catalogVersion', 2), 1
from public.cosmetic_items i
where i.is_starter and not i.is_premium_cosmetic
on conflict (item_id) where rule_type = 'starter' do nothing;

-- Regras de desbloqueio por leitura (avaliadas pelo servidor no Marco 3).
insert into public.item_unlock_rules (item_id, rule_type, rule_payload, requirements, revision) values
  ('tunic-joseph', 'chapter_completed', '{"book":"GEN","chapter":37,"label":"Conclua a leitura de Gênesis 37"}'::jsonb, '[]'::jsonb, 1)
on conflict (item_id, rule_type, revision) do update set
  rule_payload = excluded.rule_payload, requirements = excluded.requirements;
