# Integração do catálogo oficial — relatório

Arquivos: `catalogo_raridades_144_itens_v2.json` e `Jornada_Biblica_Raridades_144_Itens_Claude_Code.md`
(SHA-256 conferidos). Base comparada: catálogo v4 do projeto (rascunho `rarities-v1`, 144 itens) +
itens com histórico das migrações v1–v3 + peças iniciais. Resultado: catálogo **v5**.

## Resumo

| | Itens |
|---|---:|
| Itens oficiais integrados | **144** (22 comuns, 18 raros, 16 épicos, 66 lendários, 22 santos) |
| Casaram com item com histórico (ID antigo mantido, ID oficial vira alias) | 7 |
| Substituíram um item do rascunho (ID oficial; ID do rascunho vira alias) | 68 |
| Novos (sem equivalente no rascunho) | 69 |
| Itens do rascunho sem equivalente oficial (desativados, **nunca apagados**) | 63 |
| Complementares com histórico, fora do oficial (continuam ativos) | 8 |
| Aliases de compatibilidade | 75 |

O arquivo oficial pede para preservar IDs `book_*` de uma base anterior (`catalogo_itens_100.json`).
Essa base **nunca existiu neste repositório**: nenhum `book_*` estava publicado, então os IDs `book_*`
oficiais entram como canônicos, exceto `book_1sa` e `book_pro`, que casaram com itens já publicados.

## IDs com histórico preservados

| ID oficial (alias) | ID mantido | Mudança para quem já joga |
|---|---|---|
| `common_sandalias_de_couro` | `sandals-leather` | nenhuma: continua peça inicial gratuita (fora das recompensas de missão) |
| `common_cinto_de_corda` | `belt-rope` | nenhuma: continua peça inicial gratuita |
| `chapter_gen_37` | `tunic-joseph` | nenhuma (Gênesis 37) |
| `rare_manto_do_profeta` | `cloak-elijah` | nome "Manto do Profeta"; novos jogadores o obtêm pelo Modo Missão (antes: 1 Reis 19). Quem já tem, mantém |
| `epic_harpa_de_davi` | `harp-psalmist` | nome "Harpa de Davi"; regra passa de "30 salmos" para **1 Samuel 16** |
| `book_1sa` | `sling-david` | épico → **lendário de 1 Samuel**: regra passa de "1 Samuel 17" para **todos os capítulos de 1 Samuel** |
| `book_pro` | `crown-wisdom` | nenhuma (livro de Provérbios) |

Complementares mantidos (têm histórico, não estão no oficial): `sandals-desert`, `staff-moses`,
`cloak-succession`, `cloak-elijah-prophets`, `frame-complete`, `bg-sinai`, `bg-bethlehem` e
`scroll-isaiah` (era o lendário de Isaías no rascunho; o lendário oficial é `book_isa`, então passa a
**raro** com a mesma regra).

## Conflitos e decisões

1. **Peças iniciais no oficial como comuns de missão** (sandálias de couro, cinto de corda): a peça
   continua gratuita para todos; não entra no conjunto de recompensas de missão nem na loja.
2. **Manto da Sucessão e Coleção dos Profetas** dependem do Manto do Profeta, que agora vem do Modo
   Missão. Até lá só quem já possui o manto consegue a evolução (testado com posse legada).
3. **Lendários do rascunho que mudaram de slot** (45 casos, ex.: `legendary-gen` mãos → `book_gen`
   manto): quem tinha o item recebe o oficial, e o visual é re-equipado no slot novo.
4. **Itens do rascunho sem equivalente** (ex.: `purse-coins`, `relic-tongues-fire`): desativados no
   catálogo; quem possuía continua possuindo; saem do visual para nenhum visual ficar inválido.

## Validação bíblica

- Todas as 144 referências apontam para livro e capítulo existentes (66 livros, 1.189 capítulos) e
  cada regra de capítulo aponta para um capítulo real (testado no banco).
- O conteúdo de cada versículo **não** foi conferido automaticamente (não há texto bíblico licenciado
  no projeto). A relação com o texto vem do campo `representacao` do arquivo oficial e é exibida no app:

| Relação | Itens | Como aparece |
|---|---:|---|
| `literal` (descrito no texto) | 40 | "Objeto descrito no texto bíblico" |
| `inspired` | 56 | "Inspirado na passagem (associação interpretativa)" |
| `metaphorical` | 26 | "Metáfora da passagem (associação interpretativa)" |
| `symbolic` (todos os Santos) | 22 | "Representação simbólica (associação interpretativa)" |

### Para revisão editorial

- Nome repetido: **"Rolo do Escriba"** é raro (`rare_rolo_do_escriba`) e lendário de Esdras (`book_ezr`).
- **Estaca de Jael** (épico, mãos, Juízes 4:21): objeto ligado a um ato violento; avaliar se deve ser equipável.
- Passagens compartilhadas por vários itens (lista completa abaixo), ex.: Êxodo 28 ×4, Êxodo 25 ×4,
  Ester 5 ×3, Esdras 7 ×3, Rute 3 ×3, 1 Samuel 17 ×3. Concluir um capítulo concede todos os épicos
  daquele capítulo de uma vez (hoje: Ester 5 concede dois épicos).
- 82 associações não literais (56 inspiradas, 26 metafóricas) e todos os 22 Santos são interpretativos.

---

# Reconciliação: catálogo oficial × catálogo do projeto

- Itens oficiais: 144 (common 22, rare 18, epic 16, legendary 66, holy 22)
- Mesmo ID: 0 · alias já conhecido: 0 · nome com histórico: 5 · referência com histórico: 2 · substituíram rascunho: 68 · novos: 69
- Complementares (com histórico, fora do oficial, continuam ativos): 8 — sandals-desert, staff-moses, cloak-succession, cloak-elijah-prophets, scroll-isaiah, frame-complete, bg-sinai, bg-bethlehem
- Itens do rascunho retirados do app (desativados no banco, nunca apagados): 63
- Conflitos e decisões: 3
  - common_sandalias_de_couro → peça inicial sandals-leather: já é gratuita para todos desde o início (fica fora do conjunto de recompensas de missão)
  - common_cinto_de_corda → peça inicial belt-rope: já é gratuita para todos desde o início (fica fora do conjunto de recompensas de missão)
  - scroll-isaiah: era lendário de Isaías, mas o lendário oficial é outro — passa a raro complementar (mesma regra)

## Notas editoriais

- Nome repetido: "Rolo do Escriba" (rare_rolo_do_escriba, book_ezr)
- Mesma passagem (EXO 28) em 4 itens: Túnica de Linho Cru [common]; Estola Sacerdotal [rare]; Peitoral das Doze Pedras [rare]; Turbante do Sacerdote [rare]
- Mesma passagem (MRK 6) em 2 itens: Sandálias de Couro [common]; Túnica de Trabalhador [common]
- Mesma passagem (1SA 17) em 3 itens: Bolsa do Viajante [common]; Bolsa das Cinco Pedras [epic]; Funda de Davi [legendary]
- Mesma passagem (JER 13) em 2 itens: Cinto de Corda [common]; Faixa de Tecido [common]
- Mesma passagem (2TI 4) em 2 itens: Manto de Viagem [common]; Tocha da Fidelidade [legendary]
- Mesma passagem (RUT 3) em 3 itens: Pano de Cabeça [common]; Capa de Rute [epic]; Manto do Resgate [legendary]
- Mesma passagem (LUK 15) em 2 itens: Sandálias de Corda [common]; Manto de Lã do Pastor [rare]
- Mesma passagem (2CO 4) em 2 itens: Pote de Barro [common]; Vaso de Barro [legendary]
- Mesma passagem (RUT 2) em 2 itens: Ferramenta da Colheita [common]; Cajado de Boaz [epic]
- Mesma passagem (1CH 15) em 2 itens: Faixa dos Levitas [rare]; Harpa dos Levitas [legendary]
- Mesma passagem (MAT 3) em 2 itens: Cinto de Couro de João [rare]; Sinal da Pomba [holy]
- Mesma passagem (EZR 7) em 3 itens: Rolo do Escriba [rare]; Pergaminho de Esdras [epic]; Rolo do Escriba [legendary]
- Mesma passagem (GEN 24) em 2 itens: Bracelete da Corte [rare]; Jarro de Rebeca [epic]
- Mesma passagem (PSA 150) em 2 itens: Instrumento de Cordas [rare]; Harpa do Salmista [legendary]
- Mesma passagem (EXO 25) em 4 itens: Cálice de Bronze [rare]; Arca da Aliança (Representação) [holy]; Candelabro do Tabernáculo [holy]; Mesa dos Pães da Presença [holy]
- Mesma passagem (LEV 8) em 2 itens: Túnica Cerimonial [rare]; Peitoral do Sacerdote [legendary]
- Mesma passagem (EPH 6) em 2 itens: Cinto da Verdade [rare]; Escudo da Fé [legendary]
- Mesma passagem (EST 5) em 3 itens: Vestes Reais de Ester [epic]; Cetro do Rei Assuero [epic]; Cetro de Ouro [legendary]
- Mesma passagem (JDG 7) em 2 itens: Espada de Gideão (Emblema) [epic]; Tocha de Gideão [legendary]
- Mesma passagem (EXO 14) em 2 itens: Cajado do Êxodo [legendary]; Travessia do Mar [holy]
- Mesma passagem (1KI 18) em 2 itens: Emblema do Carmelo [legendary]; Fogo no Carmelo [holy]
- Mesma passagem (2KI 22) em 2 itens: Pergaminho Redescoberto [legendary]; Rolo da Lei Encontrado [holy]
- Mesma passagem (REV 21) em 2 itens: Cenário da Nova Jerusalém [legendary]; Cenário da Nova Criação [holy]

## Itens

| Oficial | ID final | Correspondência | Raridade | Slot | Referência | Representação | Diferenças |
|---|---|---|---|---|---|---|---|
| common_tunica_de_linho_cru | common_tunica_de_linho_cru | novo | common | outfit | Êxodo 28:42 | inspired | — |
| common_sandalias_de_couro | sandals-leather | nome (histórico) | common | feet | Marcos 6:9 | inspired | rarity: "" → "common"; scriptureRef: "" → "Marcos 6:9"; regra: (inicial) → mission_pool:{"pool":"common"} |
| common_vara_de_pastor | common_vara_de_pastor | novo | common | hands | Salmos 23:4 | inspired | — |
| common_bolsa_do_viajante | common_bolsa_do_viajante | novo | common | waist | 1 Samuel 17:40 | inspired | — |
| common_cinto_de_corda | belt-rope | nome (histórico) | common | waist | Jeremias 13:1 | inspired | rarity: "" → "common"; scriptureRef: "" → "Jeremias 13:1"; regra: (inicial) → mission_pool:{"pool":"common"} |
| common_cajado_de_caminhada | common_cajado_de_caminhada | novo | common | hands | Êxodo 12:11 | inspired | — |
| common_cantil_de_agua | common_cantil_de_agua | novo | common | waist | Gênesis 21:14 | inspired | — |
| common_manto_de_viagem | common_manto_de_viagem | novo | common | back | 2 Timóteo 4:13 | inspired | — |
| common_pano_de_cabeca | common_pano_de_cabeca | novo | common | head | Rute 3:15 | inspired | — |
| common_sandalias_de_corda | common_sandalias_de_corda | novo | common | feet | Lucas 15:22 | inspired | — |
| common_faixa_de_tecido | common_faixa_de_tecido | novo | common | waist | Jeremias 13:1 | inspired | — |
| common_cesto_de_junco | common_cesto_de_junco | novo | common | hands | Êxodo 2:3 | inspired | — |
| common_lamparina_de_barro | common_lamparina_de_barro | novo | common | hands | Mateus 5:15 | inspired | — |
| common_pergaminho_simples | common_pergaminho_simples | novo | common | hands | Lucas 4:17 | inspired | — |
| common_pote_de_barro | common_pote_de_barro | novo | common | hands | 2 Coríntios 4:7 | inspired | — |
| common_rede_de_pesca | common_rede_de_pesca | nome (rascunho) (antes: net-fishing) | common | back_item | Lucas 5:4-6 | inspired | slot: "hands" → "back_item"; category: "tool" → "carried"; scriptureRef: "Mateus 4:18" → "Lucas 5:4-6"; regra: chapter_completed:{"book":"MAT","chapter":4} → mission_pool:{"pool":"common"} |
| common_corda_de_trabalho | common_corda_de_trabalho | novo | common | waist | Eclesiastes 4:12 | inspired | — |
| common_tunica_de_trabalhador | common_tunica_de_trabalhador | novo | common | outfit | Marcos 6:9 | inspired | — |
| common_ferramenta_da_colheita | common_ferramenta_da_colheita | novo | common | hands | Rute 2:3 | inspired | — |
| common_bolsa_de_sementes | common_bolsa_de_sementes | novo | common | waist | Mateus 13:3-8 | inspired | — |
| common_cesta_de_paes | common_cesta_de_paes | novo | common | hands | Mateus 14:20 | inspired | — |
| common_sandalias_de_estrada | common_sandalias_de_estrada | novo | common | feet | Atos 12:8 | inspired | — |
| rare_estola_sacerdotal | rare_estola_sacerdotal | novo | rare | outfit | Êxodo 28:6-8 | literal | — |
| rare_peitoral_das_doze_pedras | rare_peitoral_das_doze_pedras | novo | rare | chest | Êxodo 28:15-21 | literal | — |
| rare_turbante_do_sacerdote | rare_turbante_do_sacerdote | novo | rare | head | Êxodo 28:39-40 | literal | — |
| rare_faixa_dos_levitas | rare_faixa_dos_levitas | novo | rare | waist | 1 Crônicas 15:27 | inspired | — |
| rare_manto_do_profeta | cloak-elijah | referência (histórico, interpretativo) | rare | back | 1 Reis 19:19 | inspired | name: "Manto de Elias" → "Manto do Profeta"; regra: chapter_completed:{"book":"1KI","chapter":19} → mission_pool:{"pool":"rare"} |
| rare_cinto_de_couro_de_joao | rare_cinto_de_couro_de_joao | novo | rare | waist | Mateus 3:4 | literal | — |
| rare_flauta_do_musico | rare_flauta_do_musico | novo | rare | hands | 1 Reis 1:40 | inspired | — |
| rare_trombeta_do_atalaia | rare_trombeta_do_atalaia | novo | rare | hands | Ezequiel 33:3-6 | inspired | — |
| rare_rolo_do_escriba | rare_rolo_do_escriba | novo | rare | hands | Esdras 7:6 | inspired | — |
| rare_bracelete_da_corte | rare_bracelete_da_corte | novo | rare | special | Gênesis 24:22 | literal | — |
| rare_anel_de_selo | rare_anel_de_selo | novo | rare | special | Gênesis 41:42 | literal | — |
| rare_manto_de_la_do_pastor | rare_manto_de_la_do_pastor | novo | rare | back | Lucas 15:4-6 | inspired | — |
| rare_instrumento_de_cordas | rare_instrumento_de_cordas | novo | rare | hands | Salmos 150:3-4 | inspired | — |
| rare_calice_de_bronze | rare_calice_de_bronze | novo | rare | hands | Êxodo 25:29 | inspired | — |
| rare_tunica_cerimonial | rare_tunica_cerimonial | novo | rare | outfit | Levítico 8:7 | literal | — |
| rare_bolsa_do_mensageiro | rare_bolsa_do_mensageiro | novo | rare | waist | 2 Reis 5:20-23 | inspired | — |
| rare_sandalias_do_peregrino | rare_sandalias_do_peregrino | novo | rare | feet | Isaías 52:7 | inspired | — |
| rare_cinto_da_verdade | rare_cinto_da_verdade | nome (rascunho) (antes: legendary-eph) | rare | waist | Efésios 6:14 | metaphorical | rarity: "legendary" → "rare"; book: "EPH" → ""; regra: book_completed:{"book":"EPH"} → mission_pool:{"pool":"rare"} |
| epic_vestes_reais_de_ester | epic_vestes_reais_de_ester | nome (rascunho) (antes: robes-esther) | epic | outfit | Ester 5:1 | literal | category: "ceremonial" → "tunic" |
| chapter_1sa_17 | chapter_1sa_17 | novo | epic | waist | 1 Samuel 17:40 | literal | — |
| epic_capa_de_rute | epic_capa_de_rute | novo | epic | back | Rute 3:9 | inspired | — |
| chapter_gen_37 | tunic-joseph | nome (histórico) | epic | outfit | Gênesis 37:3 | literal | — |
| epic_cetro_do_rei_assuero | epic_cetro_do_rei_assuero | novo | epic | hands | Ester 5:2 | literal | — |
| epic_harpa_de_davi | harp-psalmist | referência (histórico, interpretativo) | epic | hands | 1 Samuel 16:23 | literal | name: "Harpa do Salmista" → "Harpa de Davi"; regra: chapters_count:{"book":"PSA","count":30} → chapter_completed:{"book":"1SA","chapter":16} |
| epic_cordao_vermelho_de_raabe | epic_cordao_vermelho_de_raabe | novo | epic | special | Josué 2:18 | literal | — |
| epic_estaca_de_jael | epic_estaca_de_jael | novo | epic | hands | Juízes 4:21 | literal | — |
| epic_jarro_de_rebeca | epic_jarro_de_rebeca | novo | epic | hands | Gênesis 24:15-20 | literal | — |
| epic_manto_de_mardoqueu | epic_manto_de_mardoqueu | novo | epic | back | Ester 8:15 | literal | — |
| epic_espada_de_gideao_emblema | epic_espada_de_gideao_emblema | novo | epic | frame | Juízes 7:20 | inspired | — |
| epic_pergaminho_de_esdras | epic_pergaminho_de_esdras | novo | epic | hands | Esdras 7:10 | inspired | — |
| epic_tenda_de_priscila | epic_tenda_de_priscila | novo | epic | background | Atos 18:2-3 | inspired | — |
| epic_faixa_de_timoteo | epic_faixa_de_timoteo | novo | epic | waist | 1 Timóteo 4:12 | inspired | — |
| epic_cajado_de_boaz | epic_cajado_de_boaz | novo | epic | hands | Rute 2:4 | inspired | — |
| epic_ampola_de_perfume_de_maria | epic_ampola_de_perfume_de_maria | novo | epic | hands | João 12:3 | literal | — |
| book_gen | book_gen | livro (rascunho) (antes: legendary-gen) | legendary | back | Gênesis 12:1-3 | inspired | name: "Cajado dos Patriarcas" → "Manto da Promessa"; slot: "hands" → "back"; category: "tool" → "cloak"; scriptureRef: "Gênesis 32:10" → "Gênesis 12:1-3" |
| book_exo | book_exo | livro (rascunho) (antes: legendary-exo) | legendary | hands | Êxodo 14:15-16 | inspired | name: "Manto do Êxodo" → "Cajado do Êxodo"; slot: "back" → "hands"; category: "cloak" → "tool"; scriptureRef: "Êxodo 12:11" → "Êxodo 14:15-16" |
| book_lev | book_lev | livro (rascunho) (antes: legendary-lev) | legendary | chest | Levítico 8:8 | literal | name: "Vestes de Linho da Expiação" → "Peitoral do Sacerdote"; slot: "outfit" → "chest"; scriptureRef: "Levítico 16:4" → "Levítico 8:8" |
| book_num | book_num | livro (rascunho) (antes: legendary-num) | legendary | back_item | Números 2:2 | literal | slot: "hands" → "back_item"; category: "ceremonial" → "carried" |
| book_deu | book_deu | livro (rascunho) (antes: legendary-deu) | legendary | hands | Deuteronômio 31:24-26 | literal | name: "Filactério de Deuteronômio" → "Pergaminho da Aliança"; slot: "head" → "hands"; category: "headwear" → "scroll"; scriptureRef: "Deuteronômio 6:8" → "Deuteronômio 31:24-26" |
| book_jos | book_jos | livro (rascunho) (antes: legendary-jos) | legendary | hands | Josué 6:4-5 | literal | name: "Sandálias da Terra Prometida" → "Trombeta de Jericó"; slot: "feet" → "hands"; category: "footwear" → "instrument"; scriptureRef: "Josué 1:3" → "Josué 6:4-5" |
| book_jdg | book_jdg | livro (rascunho) (antes: legendary-jdg) | legendary | hands | Juízes 7:16-20 | literal | name: "Manto dos Juízes" → "Tocha de Gideão"; slot: "back" → "hands"; category: "cloak" → "container"; scriptureRef: "Juízes 2:16" → "Juízes 7:16-20" |
| book_rut | book_rut | livro (rascunho) (antes: legendary-rut) | legendary | back | Rute 3:9 | inspired | name: "Feixe de Espigas de Rute" → "Manto do Resgate"; slot: "hands" → "back"; category: "container" → "cloak"; scriptureRef: "Rute 2:17" → "Rute 3:9" |
| book_1sa | sling-david | nome (histórico) | legendary | hands | 1 Samuel 17:40,49 | literal | rarity: "epic" → "legendary"; scriptureRef: "1 Samuel 17:40" → "1 Samuel 17:40,49"; book: "" → "1SA"; regra: chapter_completed:{"book":"1SA","chapter":17} → book_completed:{"book":"1SA"} |
| book_2sa | book_2sa | livro (rascunho) (antes: legendary-2sa) | legendary | head | 2 Samuel 7:12-16 | inspired | name: "Éfode da Dança de Davi" → "Coroa da Aliança Davídica"; slot: "outfit" → "head"; category: "ceremonial" → "headwear"; scriptureRef: "2 Samuel 6:14" → "2 Samuel 7:12-16" |
| book_1ki | book_1ki | livro (rascunho) (antes: legendary-1ki) | legendary | frame | 1 Reis 18:36-39 | inspired | name: "Manto do Templo de Salomão" → "Emblema do Carmelo"; slot: "back" → "frame"; category: "cloak" → "frame"; scriptureRef: "1 Reis 6:14" → "1 Reis 18:36-39" |
| book_2ki | book_2ki | livro (rascunho) (antes: legendary-2ki) | legendary | hands | 2 Reis 22:8 | literal | name: "Cajado de Eliseu" → "Pergaminho Redescoberto"; category: "tool" → "scroll"; scriptureRef: "2 Reis 4:29" → "2 Reis 22:8" |
| book_1ch | book_1ch | livro (rascunho) (antes: legendary-1ch) | legendary | hands | 1 Crônicas 15:16 | literal | name: "Lira dos Cantores" → "Harpa dos Levitas"; scriptureRef: "1 Crônicas 25:1" → "1 Crônicas 15:16" |
| book_2ch | book_2ch | livro (rascunho) (antes: legendary-2ch) | legendary | hands | 2 Crônicas 5:12-13 | literal | name: "Rolo da Lei Reencontrado" → "Trombetas do Templo"; category: "scroll" → "instrument"; scriptureRef: "2 Crônicas 34:15" → "2 Crônicas 5:12-13" |
| book_ezr | book_ezr | livro (rascunho) (antes: legendary-ezr) | legendary | hands | Esdras 7:6,10 | inspired | name: "Pena do Escriba Esdras" → "Rolo do Escriba"; category: "tool" → "scroll"; scriptureRef: "Esdras 7:6" → "Esdras 7:6,10" |
| book_neh | book_neh | livro (rascunho) (antes: legendary-neh) | legendary | hands | Neemias 4:17 | inspired | name: "Cinto do Construtor dos Muros" → "Ferramenta do Reconstrutor"; slot: "waist" → "hands"; category: "belt" → "tool" |
| book_est | book_est | livro (rascunho) (antes: legendary-est) | legendary | hands | Ester 5:2 | literal | category: "ceremonial" → "tool" |
| book_job | book_job | livro (rascunho) (antes: legendary-job) | legendary | back | Jó 42:10-12 | inspired | name: "Manto da Restauração" → "Manto da Perseverança"; scriptureRef: "Jó 42:10" → "Jó 42:10-12" |
| book_psa | book_psa | livro (rascunho) (antes: legendary-psa) | legendary | hands | Salmos 150:3 | literal | name: "Saltério de Dez Cordas" → "Harpa do Salmista"; scriptureRef: "Salmos 33:2" → "Salmos 150:3" |
| book_pro | crown-wisdom | nome (histórico) | legendary | head | Provérbios 4:9 | metaphorical | — |
| book_ecc | book_ecc | livro (rascunho) (antes: legendary-ecc) | legendary | hands | Eclesiastes 3:1-8 | inspired | name: "Ampulheta do Pregador" → "Pergaminho dos Tempos"; category: "tool" → "scroll"; scriptureRef: "Eclesiastes 3:1" → "Eclesiastes 3:1-8" |
| book_sng | book_sng | livro (rascunho) (antes: legendary-sng) | legendary | neck | Cânticos 1:10 | inspired | name: "Coroa de Flores do Cântico" → "Colar da Amada"; slot: "head" → "neck"; category: "headwear" → "jewelry"; scriptureRef: "Cânticos 2:12" → "Cânticos 1:10" |
| book_isa | book_isa | novo | legendary | back | Isaías 6:8 | inspired | — |
| book_jer | book_jer | livro (rascunho) (antes: legendary-jer) | legendary | hands | Jeremias 18:3-6 | literal | name: "Cinto de Linho de Jeremias" → "Vaso do Oleiro"; slot: "waist" → "hands"; category: "belt" → "container"; scriptureRef: "Jeremias 13:1" → "Jeremias 18:3-6" |
| book_lam | book_lam | livro (rascunho) (antes: legendary-lam) | legendary | hands | Lamentações 3:21-23 | metaphorical | name: "Lenço das Misericórdias" → "Lanterna da Esperança"; slot: "neck" → "hands"; category: "accessory" → "container"; scriptureRef: "Lamentações 3:22-23" → "Lamentações 3:21-23" |
| book_ezk | book_ezk | livro (rascunho) (antes: legendary-ezk) | legendary | hands | Ezequiel 3:1-3 | literal | name: "Manto do Vigia" → "Rolo da Visão"; slot: "back" → "hands"; category: "cloak" → "scroll"; scriptureRef: "Ezequiel 33:7" → "Ezequiel 3:1-3" |
| book_dan | book_dan | livro (rascunho) (antes: legendary-dan) | legendary | frame | Daniel 6:16-23 | inspired | name: "Turbante de Daniel" → "Insígnia da Cova dos Leões"; slot: "head" → "frame"; category: "headwear" → "frame"; scriptureRef: "Daniel 1:17" → "Daniel 6:16-23" |
| book_hos | book_hos | livro (rascunho) (antes: legendary-hos) | legendary | neck | Oseias 2:19 | metaphorical | name: "Colar da Aliança Renovada" → "Laço da Fidelidade" |
| book_jol | book_jol | livro (rascunho) (antes: legendary-jol) | legendary | hands | Joel 2:1 | literal | name: "Manto da Chuva Temporã" → "Trombeta de Sião"; slot: "back" → "hands"; category: "cloak" → "instrument"; scriptureRef: "Joel 2:23" → "Joel 2:1" |
| book_amo | book_amo | livro (rascunho) (antes: legendary-amo) | legendary | hands | Amós 7:7-8 | literal | name: "Cajado do Boiadeiro de Tecoa" → "Prumo do Profeta"; scriptureRef: "Amós 7:14" → "Amós 7:7-8" |
| book_oba | book_oba | livro (rascunho) (antes: legendary-oba) | legendary | frame | Obadias 1:17 | metaphorical | name: "Fundo das Montanhas de Edom" → "Insígnia de Sião"; slot: "background" → "frame"; category: "background" → "frame"; scriptureRef: "Obadias 1:21" → "Obadias 1:17" |
| book_jon | book_jon | livro (rascunho) (antes: legendary-jon) | legendary | hands | Jonas 3:2-4 | inspired | name: "Manto do Pregador de Nínive" → "Pergaminho de Nínive"; slot: "back" → "hands"; category: "cloak" → "scroll"; scriptureRef: "Jonas 3:4" → "Jonas 3:2-4" |
| book_mic | book_mic | livro (rascunho) (antes: legendary-mic) | legendary | hands | Miqueias 7:14 | literal | name: "Relha de Arado da Paz" → "Bastão do Pastor"; scriptureRef: "Miqueias 4:3" → "Miqueias 7:14" |
| book_nam | book_nam | livro (rascunho) (antes: legendary-nam) | legendary | feet | Naum 1:15 | metaphorical | — |
| book_hab | book_hab | livro (rascunho) (antes: legendary-hab) | legendary | hands | Habacuque 2:2 | literal | — |
| book_zep | book_zep | livro (rascunho) (antes: legendary-zep) | legendary | special | Sofonias 3:17 | metaphorical | name: "Faixa da Alegria de Sião" → "Emblema do Cântico"; slot: "head" → "special"; category: "headwear" → "insignia" |
| book_hag | book_hag | livro (rascunho) (antes: legendary-hag) | legendary | hands | Ageu 1:8 | literal | name: "Martelo dos Reconstrutores" → "Madeira da Reconstrução"; scriptureRef: "Ageu 1:14" → "Ageu 1:8" |
| book_zec | book_zec | livro (rascunho) (antes: legendary-zec) | legendary | special | Zacarias 4:2 | literal | name: "Cordel de Medir" → "Candelabro da Visão"; slot: "hands" → "special"; category: "tool" → "insignia"; scriptureRef: "Zacarias 2:1" → "Zacarias 4:2" |
| book_mal | book_mal | livro (rascunho) (antes: legendary-mal) | legendary | hands | Malaquias 3:16 | literal | name: "Manto do Refinador" → "Livro da Memória"; slot: "back" → "hands"; category: "cloak" → "scroll"; scriptureRef: "Malaquias 3:3" → "Malaquias 3:16" |
| book_mat | book_mat | livro (rascunho) (antes: legendary-mat) | legendary | background | Mateus 2:2,9-10 | literal | name: "Manto do Sermão do Monte" → "Estrela do Oriente"; slot: "back" → "background"; category: "cloak" → "background"; scriptureRef: "Mateus 5:1" → "Mateus 2:2,9-10" |
| book_mrk | book_mrk | livro (rascunho) (antes: legendary-mrk) | legendary | back | Marcos 10:45 | metaphorical | name: "Sandálias do Caminho" → "Manto do Servo"; slot: "feet" → "back"; category: "footwear" → "cloak"; scriptureRef: "Marcos 10:52" → "Marcos 10:45" |
| book_luk | book_luk | livro (rascunho) (antes: legendary-luk) | legendary | background | Lucas 2:7 | inspired | name: "Bolsa do Bom Samaritano" → "Cenário da Manjedoura"; slot: "waist" → "background"; category: "container" → "background"; scriptureRef: "Lucas 10:34" → "Lucas 2:7" |
| book_jhn | book_jhn | livro (rascunho) (antes: legendary-jhn) | legendary | hands | João 20:30-31 | inspired | name: "Colar da Videira" → "Pergaminho do Testemunho"; slot: "neck" → "hands"; category: "jewelry" → "scroll"; scriptureRef: "João 15:5" → "João 20:30-31" |
| book_act | book_act | livro (rascunho) (antes: legendary-act) | legendary | back | Atos 1:8 | inspired | name: "Sandálias do Missionário" → "Manto do Caminho Missionário"; slot: "feet" → "back"; category: "footwear" → "cloak" |
| book_rom | book_rom | livro (rascunho) (antes: legendary-rom) | legendary | frame | Romanos 5:5 | metaphorical | name: "Faixa da Esperança" → "Emblema da Esperança"; slot: "head" → "frame"; category: "headwear" → "frame"; scriptureRef: "Romanos 15:13" → "Romanos 5:5" |
| book_1co | book_1co | livro (rascunho) (antes: legendary-1co) | legendary | waist | 1 Coríntios 13:4-7 | inspired | name: "Coroa Incorruptível" → "Faixa do Amor"; slot: "head" → "waist"; category: "headwear" → "belt"; scriptureRef: "1 Coríntios 9:25" → "1 Coríntios 13:4-7" |
| book_2co | book_2co | livro (rascunho) (antes: legendary-2co) | legendary | hands | 2 Coríntios 4:7 | literal | name: "Vaso de Barro com Tesouro" → "Vaso de Barro" |
| book_gal | book_gal | livro (rascunho) (antes: legendary-gal) | legendary | special | Gálatas 5:22-23 | metaphorical | name: "Manto da Liberdade" → "Insígnia do Fruto"; slot: "back" → "special"; category: "cloak" → "insignia"; scriptureRef: "Gálatas 5:1" → "Gálatas 5:22-23" |
| book_eph | book_eph | novo | legendary | hands | Efésios 6:16 | metaphorical | — |
| book_php | book_php | livro (rascunho) (antes: legendary-php) | legendary | waist | Filipenses 4:4 | metaphorical | name: "Coroa da Alegria" → "Faixa da Alegria"; slot: "head" → "waist"; category: "headwear" → "belt"; scriptureRef: "Filipenses 4:1" → "Filipenses 4:4" |
| book_col | book_col | livro (rascunho) (antes: legendary-col) | legendary | back | Colossenses 3:12 | metaphorical | name: "Manto do Amor" → "Manto da Compaixão"; scriptureRef: "Colossenses 3:14" → "Colossenses 3:12" |
| book_1th | book_1th | livro (rascunho) (antes: legendary-1th) | legendary | chest | 1 Tessalonicenses 5:8 | metaphorical | name: "Elmo da Esperança" → "Peitoral da Fé e do Amor"; slot: "head" → "chest"; category: "headwear" → "ceremonial" |
| book_2th | book_2th | livro (rascunho) (antes: legendary-2th) | legendary | frame | 2 Tessalonicenses 1:4 | metaphorical | name: "Sandálias da Perseverança" → "Emblema da Perseverança"; slot: "feet" → "frame"; category: "footwear" → "frame"; scriptureRef: "2 Tessalonicenses 3:13" → "2 Tessalonicenses 1:4" |
| book_1ti | book_1ti | livro (rascunho) (antes: legendary-1ti) | legendary | special | 1 Timóteo 6:12 | metaphorical | name: "Faixa do Bom Combate" → "Selo do Bom Combate"; slot: "waist" → "special"; category: "belt" → "insignia" |
| book_2ti | book_2ti | livro (rascunho) (antes: legendary-2ti) | legendary | hands | 2 Timóteo 4:7 | metaphorical | name: "Coroa da Justiça" → "Tocha da Fidelidade"; slot: "head" → "hands"; category: "headwear" → "container"; scriptureRef: "2 Timóteo 4:8" → "2 Timóteo 4:7" |
| book_tit | book_tit | livro (rascunho) (antes: legendary-tit) | legendary | back | Tito 3:8 | metaphorical | name: "Lâmpada do Bom Exemplo" → "Manto das Boas Obras"; slot: "hands" → "back"; category: "container" → "cloak"; scriptureRef: "Tito 2:7" → "Tito 3:8" |
| book_phm | book_phm | livro (rascunho) (antes: legendary-phm) | legendary | special | Filemom 1:15-17 | metaphorical | name: "Cordão da Reconciliação" → "Selo da Reconciliação"; slot: "neck" → "special"; category: "jewelry" → "insignia"; scriptureRef: "Filemom 1:16" → "Filemom 1:15-17" |
| book_heb | book_heb | livro (rascunho) (antes: legendary-heb) | legendary | special | Hebreus 6:19 | metaphorical | name: "Âncora da Esperança" → "Âncora da Alma"; slot: "neck" → "special"; category: "jewelry" → "insignia" |
| book_jas | book_jas | livro (rascunho) (antes: legendary-jas) | legendary | hands | Tiago 1:23-25 | literal | scriptureRef: "Tiago 1:23" → "Tiago 1:23-25" |
| book_1pe | book_1pe | livro (rascunho) (antes: legendary-1pe) | legendary | head | 1 Pedro 5:4 | metaphorical | name: "Pedra Viva" → "Coroa da Glória"; slot: "neck" → "head"; category: "jewelry" → "headwear"; scriptureRef: "1 Pedro 2:5" → "1 Pedro 5:4" |
| book_2pe | book_2pe | livro (rascunho) (antes: legendary-2pe) | legendary | hands | 2 Pedro 1:19 | metaphorical | name: "Lâmpada em Lugar Escuro" → "Lâmpada Profética" |
| book_1jn | book_1jn | livro (rascunho) (antes: legendary-1jn) | legendary | special | 1 João 4:7-8 | metaphorical | name: "Manto da Luz" → "Emblema do Amor"; slot: "back" → "special"; category: "cloak" → "insignia"; scriptureRef: "1 João 1:7" → "1 João 4:7-8" |
| book_2jn | book_2jn | livro (rascunho) (antes: legendary-2jn) | legendary | hands | 2 João 1:4 | metaphorical | name: "Rolo da Verdade e do Amor" → "Pergaminho da Verdade"; scriptureRef: "2 João 1:3" → "2 João 1:4" |
| book_3jn | book_3jn | livro (rascunho) (antes: legendary-3jn) | legendary | waist | 3 João 1:5-8 | metaphorical | name: "Sandálias da Hospitalidade" → "Bolsa da Hospitalidade"; slot: "feet" → "waist"; category: "footwear" → "container"; scriptureRef: "3 João 1:8" → "3 João 1:5-8" |
| book_jud | book_jud | livro (rascunho) (antes: legendary-jud) | legendary | hands | Judas 1:20-21 | metaphorical | name: "Manto da Fé Guardada" → "Escudo da Perseverança"; slot: "back" → "hands"; category: "cloak" → "emblem"; scriptureRef: "Judas 1:20" → "Judas 1:20-21" |
| book_rev | book_rev | livro (rascunho) (antes: legendary-rev) | legendary | background | Apocalipse 21:1-4 | inspired | name: "Coroa da Vida" → "Cenário da Nova Jerusalém"; slot: "head" → "background"; category: "headwear" → "background"; scriptureRef: "Apocalipse 2:10" → "Apocalipse 21:1-4" |
| holy_luz_da_criacao | holy_luz_da_criacao | novo | holy | effect | Gênesis 1:3 | symbolic | — |
| holy_coluna_de_nuvem_e_fogo | holy_coluna_de_nuvem_e_fogo | novo | holy | background | Êxodo 13:21-22 | symbolic | — |
| holy_travessia_do_mar | holy_travessia_do_mar | novo | holy | background | Êxodo 14:21-22 | symbolic | — |
| holy_mana_do_deserto | holy_mana_do_deserto | nome (rascunho) (antes: relic-manna) | holy | relic | Êxodo 16:14-15 | symbolic | scriptureRef: "Êxodo 16:15" → "Êxodo 16:14-15"; regra: chapter_completed:{"book":"EXO","chapter":16} → milestone_reached:{"milestone":"holy_mana_do_deserto","reference":"Êxodo 16:14-15"} |
| holy_tabuas_da_alianca | holy_tabuas_da_alianca | novo | holy | relic | Êxodo 31:18 | symbolic | — |
| holy_arca_da_alianca_representacao | holy_arca_da_alianca_representacao | novo | holy | relic | Êxodo 25:10-22 | symbolic | — |
| holy_candelabro_do_tabernaculo | holy_candelabro_do_tabernaculo | nome (rascunho) (antes: relic-menorah) | holy | relic | Êxodo 25:31-40 | symbolic | scriptureRef: "Êxodo 25:31" → "Êxodo 25:31-40"; regra: chapter_completed:{"book":"EXO","chapter":25} → milestone_reached:{"milestone":"holy_candelabro_do_tabernaculo","reference":"Êxodo 25:31-40"} |
| holy_mesa_dos_paes_da_presenca | holy_mesa_dos_paes_da_presenca | novo | holy | relic | Êxodo 25:23-30 | symbolic | — |
| holy_altar_do_incenso | holy_altar_do_incenso | novo | holy | relic | Êxodo 30:1-10 | symbolic | — |
| holy_fogo_no_carmelo | holy_fogo_no_carmelo | novo | holy | background | 1 Reis 18:36-39 | symbolic | — |
| holy_fogo_da_dedicacao_do_templo | holy_fogo_da_dedicacao_do_templo | novo | holy | background | 2 Crônicas 7:1-3 | symbolic | — |
| holy_rolo_da_lei_encontrado | holy_rolo_da_lei_encontrado | novo | holy | relic | 2 Reis 22:8-11 | symbolic | — |
| holy_livramento_na_fornalha | holy_livramento_na_fornalha | novo | holy | background | Daniel 3:24-27 | symbolic | — |
| holy_sinal_do_cordeiro_de_deus | holy_sinal_do_cordeiro_de_deus | novo | holy | frame | João 1:29 | symbolic | — |
| holy_agua_transformada_em_vinho | holy_agua_transformada_em_vinho | novo | holy | relic | João 2:6-11 | symbolic | — |
| holy_paes_da_multiplicacao | holy_paes_da_multiplicacao | novo | holy | relic | João 6:11-13 | symbolic | — |
| holy_tumulo_vazio | holy_tumulo_vazio | novo | holy | background | Lucas 24:2-6 | symbolic | — |
| holy_cenario_do_monte_da_transfiguracao | holy_cenario_do_monte_da_transfiguracao | novo | holy | background | Mateus 17:1-5 | symbolic | — |
| holy_sinal_da_pomba | holy_sinal_da_pomba | novo | holy | frame | Mateus 3:16 | symbolic | — |
| holy_chamas_de_pentecostes | holy_chamas_de_pentecostes | novo | holy | effect | Atos 2:1-4 | symbolic | — |
| holy_selo_da_promessa | holy_selo_da_promessa | nome (rascunho) (antes: relic-seal) | holy | frame | Efésios 1:13 | symbolic | slot: "relic" → "frame"; category: "relic" → "frame"; regra: chapter_completed:{"book":"EPH","chapter":1} → milestone_reached:{"milestone":"holy_selo_da_promessa","reference":"Efésios 1:13"} |
| holy_cenario_da_nova_criacao | holy_cenario_da_nova_criacao | novo | holy | background | Apocalipse 21:1-5 | symbolic | — |
