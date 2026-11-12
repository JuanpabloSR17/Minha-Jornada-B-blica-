# Missões especiais dos Raros — proposta para revisão editorial

Base: catálogo vigente v6 (`src/features/avatar/catalog/catalog.json`), commit `f6cca4d`. Nada foi cadastrado:
as missões propostas dependem das decisões no fim deste documento.

## Como a missão do Manto do Profeta funciona hoje

- **Cadastro:** `catalog.json#missions` → `public.reward_triggers` (`missao_manto_do_profeta`, tipo `mission`, `1KI` 19), gerado na migração do catálogo v6; a regra do item é `mission_completed { mission: missao_manto_do_profeta }`.
- **Conclusão:** `public.complete_reading_mission` registra `MISSION_COMPLETED` (origem `mission:<id>`, uma vez por jogador) quando uma missão de 1 Reis 19 é finalizada — primeira leitura **ou releitura** — e o motor concede o item.
- **Coleção dos Profetas:** Manto do Profeta + Manto da Sucessão (2 Reis 2, exige o manto) + Rolo de Isaías (livro de Isaías) → concede o Manto de Elias — Edição dos Profetas.
- **Na tela:** a aba Ler lista as “Missões especiais” (tocar seleciona o capítulo); a tela de recompensa mostra “Missão especial concluída: …” e o item.
- **Quem já leu a passagem:** cumpre a missão relendo no Modo Missão e recebe o item, **sem** os 40 XP da primeira leitura e sem contar capítulo novo (teste em `supabase/tests/50_reading_missions.sql`). A releitura não conta para a meta diária.

## Mecanismo para as propostas

Todas as propostas usam **um capítulo** por missão: o gatilho atual (`reward_triggers.book_code/chapter`) verifica a condição sem mudança de banco. Vários itens podem apontar para a mesma missão (regras `mission_completed` com o mesmo ID); o importador do catálogo hoje liga só um item por missão e precisaria aceitar uma lista (ajuste pequeno). Missões com vários capítulos não são suportadas.

Evento que confirma todas as missões: `MISSION_COMPLETED` (origem `mission:<id da missão>`), emitido ao finalizar uma missão de leitura do capítulo.

## Tabela (18 Raros do catálogo oficial)

| Item | ID vigente | Referência | Relação com o texto | Obtenção atual | Missão | Capítulo | O que o jogador vê | O mecanismo atual verifica? | Efeito da mesma conclusão |
|---|---|---|---|---|---|---|---|---|---|
| Estola Sacerdotal | `rare_estola_sacerdotal` | Êxodo 28:6-8 | literal | Nenhuma ativa (regra “missão especial, em breve”) | Proposta: M-01 · As vestes do sumo sacerdote | Êxodo 28 | “Missão especial: As vestes do sumo sacerdote — Êxodo 28”. Ao concluir: “Missão especial concluída” e os três itens. | Sim (gatilho de capítulo existente) | A mesma missão concede Estola, Peitoral e Turbante (D-02). A Túnica de Linho Cru (Comum, Êx 28:42) não muda. |
| Peitoral das Doze Pedras | `rare_peitoral_das_doze_pedras` | Êxodo 28:15-21 | literal | Nenhuma ativa | Proposta: M-01 · As vestes do sumo sacerdote | Êxodo 28 | Mesma missão M-01. | Sim (gatilho de capítulo existente) | Ver M-01 (3 Raros numa conclusão). |
| Turbante do Sacerdote | `rare_turbante_do_sacerdote` | Êxodo 28:39-40 | literal | Nenhuma ativa | Proposta: M-01 · As vestes do sumo sacerdote | Êxodo 28 | Mesma missão M-01. | Sim (gatilho de capítulo existente) | Ver M-01 (3 Raros numa conclusão). |
| Faixa dos Levitas | `rare_faixa_dos_levitas` | 1 Crônicas 15:27 | inspirado | Nenhuma ativa | Proposta: M-02 · A arca sobe a Jerusalém | 1 Crônicas 15 | “Leia 1 Crônicas 15 no Modo Missão: Davi e os levitas vestidos de linho levam a arca.” | Sim (gatilho de capítulo existente) | Se 1 Cr 15 for o último capítulo que falta do livro, a mesma finalização também concede o Lendário Harpa dos Levitas (regra do livro, já existente). |
| Manto do Profeta | `cloak-elijah` | 1 Reis 19:19 | inspirado | Missão cadastrada (fora da loja) | **Cadastrada:** missao_manto_do_profeta · Missão especial: o chamado de Eliseu | 1 Reis 19 | Card “Missões especiais” na aba Ler; ao tocar, seleciona 1 Reis 19. Ao concluir: “Missão especial concluída: …” e o manto. | Sim (gatilho de capítulo existente) — testado | Funciona hoje: finalizar uma missão de 1 Rs 19 (primeira leitura ou releitura) concede o manto uma vez. Libera o Manto da Sucessão se 2 Rs 2 já foi lido e conta para a Coleção dos Profetas (com Sucessão e Rolo de Isaías → Manto de Elias — Edição dos Profetas). |
| Cinto de Couro de João | `rare_cinto_de_couro_de_joao` | Mateus 3:4 | literal | Nenhuma ativa | Proposta: M-03 · A voz que clama no deserto | Mateus 3 | “Leia Mateus 3 no Modo Missão: João Batista, vestido de pelos de camelo e cinto de couro.” | Sim (gatilho de capítulo existente) | O Santo Sinal da Pomba (Mt 3:16) não é concedido: continua dependendo de um marco curado, ainda não cadastrado. |
| Flauta do Músico | `rare_flauta_do_musico` | 1 Reis 1:40 | inspirado | Mercado: 400 Siclos | Proposta: M-04 · A unção de Salomão | 1 Reis 1 | “Leia 1 Reis 1 no Modo Missão: o povo celebra com flautas a unção de Salomão.” | Sim (gatilho de capítulo existente) | Loja mantida. Quem já comprou cumpre a missão sem receber o item de novo (D-04). |
| Trombeta do Atalaia | `rare_trombeta_do_atalaia` | Ezequiel 33:3-6 | inspirado | Nenhuma ativa | Proposta: M-05 · O atalaia | Ezequiel 33 | “Leia Ezequiel 33 no Modo Missão: o atalaia toca a trombeta para avisar o povo.” | Sim (gatilho de capítulo existente) | — |
| Rolo do Escriba | `rare_rolo_do_escriba` | Esdras 7:6 | inspirado | Nenhuma ativa | Proposta: M-06 · Esdras, o escriba | Esdras 7 | “Leia Esdras 7 no Modo Missão: Esdras, escriba versado na Lei.” | Sim (gatilho de capítulo existente) | Na primeira leitura, a mesma finalização concede também o Épico Pergaminho de Esdras (regra de capítulo). O nome repete o Lendário de Esdras (D-06). |
| Bracelete da Corte | `rare_bracelete_da_corte` | Gênesis 24:22 | literal | Nenhuma ativa | Proposta: M-07 · Uma noiva para Isaque | Gênesis 24 | “Leia Gênesis 24 no Modo Missão: o servo de Abraão presenteia Rebeca com braceletes.” | Sim (gatilho de capítulo existente) | Na primeira leitura, concede também o Épico Jarro de Rebeca (regra de capítulo): 2 itens numa conclusão. |
| Anel de Selo | `rare_anel_de_selo` | Gênesis 41:42 | literal | Nenhuma ativa | Proposta: M-08 · José diante de Faraó | Gênesis 41 | “Leia Gênesis 41 no Modo Missão: Faraó entrega seu anel de selo a José.” | Sim (gatilho de capítulo existente) | — |
| Manto de Lã do Pastor | `rare_manto_de_la_do_pastor` | Lucas 15:4-6 | inspirado (simbólico) ⚑ | Mercado: 400 Siclos | Proposta: M-09 · A ovelha perdida | Lucas 15 | “Leia Lucas 15 no Modo Missão. Item inspirado na parábola da ovelha perdida.” | Sim (gatilho de capítulo existente) | Loja mantida. A parábola não descreve um manto: relação simbólica (D-09). |
| Instrumento de Cordas | `rare_instrumento_de_cordas` | Salmos 150:3-4 | inspirado | Mercado: 450 Siclos | Proposta: M-10 · Tudo o que tem fôlego | Salmos 150 | “Leia Salmos 150 no Modo Missão: louvem com harpa e lira.” | Sim (gatilho de capítulo existente) | Loja mantida. Se for o último salmo que falta, também concede o Lendário Harpa do Salmista. |
| Cálice de Bronze | `rare_calice_de_bronze` | Êxodo 25:29 | inspirado ⚑ | Nenhuma ativa | Proposta: M-11 · A mesa do tabernáculo | Êxodo 25 | “Leia Êxodo 25 no Modo Missão: os utensílios da mesa do tabernáculo.” | Sim (gatilho de capítulo existente) | Os Santos de Êx 25 (Arca, Candelabro, Mesa) não são concedidos: dependem de marcos curados. O texto fala de utensílios de ouro puro, não de bronze (D-07). |
| Túnica Cerimonial | `rare_tunica_cerimonial` | Levítico 8:7 | literal | Nenhuma ativa | Proposta: M-12 · A consagração de Arão | Levítico 8 | “Leia Levítico 8 no Modo Missão: Moisés veste Arão com a túnica.” | Sim (gatilho de capítulo existente) | — |
| Bolsa do Mensageiro | `rare_bolsa_do_mensageiro` | 2 Reis 5:20-23 | inspirado ⚑ | Mercado: 350 Siclos | **Pendente:** M-13 · aguarda D-08 | 2 Reis 5 (se mantida) | Texto depende da decisão D-08. | Sim, se mantida em 2 Reis 5 | Loja mantida. A passagem narra a mentira e a cobiça de Geazi para obter prata: associação a revisar antes de virar missão. |
| Sandálias do Peregrino | `rare_sandalias_do_peregrino` | Isaías 52:7 | metafórico (catalogado como inspirado) ⚑ | Mercado: 400 Siclos | Proposta: M-14 · Os pés do mensageiro | Isaías 52 | “Leia Isaías 52 no Modo Missão. Item inspirado em ‘como são belos os pés dos que anunciam boas-novas’.” | Sim (gatilho de capítulo existente) | Loja mantida. Se Is 52 for o último capítulo de Isaías que falta, concede também o Lendário Manto do Chamado e o Rolo de Isaías, e pode completar a Coleção dos Profetas. |
| Cinto da Verdade | `rare_cinto_da_verdade` | Efésios 6:14 | metafórico ⚑ | Nenhuma ativa | Proposta: M-15 · A armadura de Deus | Efésios 6 | “Leia Efésios 6 no Modo Missão. Item simbólico da ‘armadura de Deus’.” | Sim (gatilho de capítulo existente) | Ef 6 é o último capítulo do livro: para quem lê em ordem, a mesma finalização costuma conceder também o Lendário Escudo da Fé. |

⚑ relação simbólica ou metafórica entre a passagem e o item.

Fora da contagem de 18: seis Raros complementares com histórico (Sandálias do Deserto, Vara de Moisés, Manto da Sucessão, Rolo de Isaías, Fundo do Monte Sinai, Fundo dos Campos de Belém) já têm regras de leitura ou de coleção e não mudam.

## Rotas preservadas

- Manto do Profeta: missão de 1 Reis 19 (sem mudança).
- Mercado: os 5 Raros à venda continuam à venda com o mesmo preço; a missão é uma rota adicional.
- Lendários, Épicos e Santos dos mesmos capítulos seguem as próprias regras; nenhum Raro entra na escolha gratuita da meta.

## Decisões para aprovação antes do cadastro

| # | Tema | Situação | Decisão pedida |
|---|---|---|---|
| D-01 | Regra geral das missões | Capítulo da missão = capítulo da referência do item. A missão é cumprida ao finalizar uma missão desse capítulo no Modo Missão, na primeira leitura ou numa releitura. Na releitura não há XP nem capítulo novo (testado), e ela não conta para a meta diária. | Aprovar (recomendado) ou exigir primeira leitura, o que impediria quem já leu a passagem de cumprir a missão. |
| D-02 | Êxodo 28 concentra 3 Raros | Opção A (recomendada): uma missão, “As vestes do sumo sacerdote”, concede Estola, Peitoral e Turbante. Opção B: distribuir por capítulos que também descrevem as vestes (Estola — Êx 28; Peitoral — Êx 39:8-21; Turbante — Lv 8:9, junto com a Túnica Cerimonial), o que muda o capítulo da missão em relação à referência do item. | Escolher A ou B. Uma missão com vários capítulos exigiria um mecanismo novo. |
| D-03 | Vários itens numa só conclusão | Gênesis 24 (Bracelete + Jarro de Rebeca) e Esdras 7 (Rolo do Escriba + Pergaminho de Esdras) concedem dois itens na primeira leitura; Êxodo 28 concede três (D-02). | Aceitar ou separar as missões. |
| D-04 | Itens também vendidos no Mercado (5) | Flauta, Manto de Lã, Instrumento de Cordas, Bolsa do Mensageiro e Sandálias do Peregrino continuam na loja. Quem comprou antes cumpre a missão sem receber nada a mais. | Aceitar (v1) ou definir uma compensação (exigiria regra e mecanismo novos). |
| D-05 | Fim do rótulo “em breve” | As 17 regras “missão especial, em breve” viram regras de missão. Não há sorteio nem escolha gratuita de Raros hoje, então nenhuma rota existente é perdida. | Confirmar que Raros não entram na escolha gratuita da meta diária. |
| D-06 | Nome repetido | “Rolo do Escriba” é o Raro e também o Lendário de Esdras, e os dois ficam em Esdras 7. | Renomear um dos dois. |
| D-07 | Cálice de Bronze × Êxodo 25:29 | O versículo fala de utensílios de ouro puro. | Renomear o item, trocar a referência ou manter como “inspirado em”. |
| D-08 | Bolsa do Mensageiro × 2 Reis 5:20-23 | A passagem é a mentira e a cobiça de Geazi. | Trocar a referência (por exemplo, um mensageiro em outra passagem) ou manter com texto de advertência. A missão M-13 só é cadastrada depois. |
| D-09 | Relações simbólicas | Manto de Lã do Pastor (parábola), Sandálias do Peregrino (Is 52:7, metáfora), Cinto da Verdade (Ef 6, metáfora) e Cálice de Bronze. | Aprovar os textos “inspirado em” das missões e corrigir a representação das Sandálias do Peregrino para “metafórico”. |
| D-10 | Coleção nova (opcional) | Uma coleção “Vestes do sumo sacerdote” (Estola, Peitoral, Turbante, Túnica Cerimonial) com recompensa própria. | Decidir se cria; exigiria um item de recompensa novo. |

## Depois da aprovação (implementação prevista)

1. Catálogo v7: missões em `catalog.json#missions` (com lista de itens por missão), regras `mission_completed` no lugar de “em breve”, ajustes editoriais aprovados.
2. Importador: aceitar vários itens por missão; reimportação continua idempotente.
3. Migração gerada do catálogo v7 (sem mudança de esquema) e testes por missão: primeira leitura, releitura sem XP, item já comprado, efeitos combinados (Gn 24, Ed 7, Êx 28).
