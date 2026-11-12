# Marcos dos 22 Santos

> **Situação (catálogo v8):** **20 marcos cadastrados para os 22 Santos** (Êxodo 25 tem um marco com
> Arca, Mesa dos Pães e Candelabro; Maná do Deserto usa Êxodo 16). Decisões aplicadas: S-01 com
> **escolha explícita do marco** na aba Ler; S-02 opção A; S-03 e S-06 aceitos (recompensas
> combinadas e Lendário quando o capítulo completa o livro); S-04 disponíveis desde o início; S-05
> Êxodo 16; S-07 textos de sinal/cenário inspirados nas passagens; S-08 coleções sem prêmio adicional;
> S-09 todos liberados. Em 2 Reis 22, o Santo e o Lendário têm significados diferentes na tela
> (`catalog.json#editorialOverrides`), com IDs e referências preservados.
>
> **Correção:** os documentos anteriores diziam “7 relíquias e 15 itens de personalização”. O catálogo
> oficial tem **9 Santos só em exibição** (os 7 artefatos + Água Transformada em Vinho e Pães da
> Multiplicação) e **13 de personalização** (fundo, moldura ou efeito). Os usos do catálogo foram mantidos.

## Como o marco é cumprido

1. Na aba Ler, em **Marcos dos Santos**, o jogador escolhe o marco; a tela mostra os itens que ele concede.
2. A sessão leva o ID do marco (guardado no aparelho: sobrevive a pausar, fechar o app e reenviar).
3. Ao finalizar, `complete_reading_mission(..., p_milestone)` confere que o marco existe, está ativo e é
   do mesmo capítulo (`invalid_milestone`), grava o vínculo em `reading_sessions.milestone_id` e registra
   `MILESTONE_REACHED` uma vez por jogador; a regra `milestone_reached` concede os Santos que faltam.
   Reenviar a sessão com outro marco ou sem ele é recusado (`invalid_session`).
4. Uma leitura comum do mesmo capítulo segue só as recompensas habituais. Se o capítulo já foi lido,
   o marco é cumprido por releitura, sem XP de leitura, capítulo novo ou avanço na meta diária.

# Proposta original para revisão editorial

Base: catálogo vigente v7 (`src/features/avatar/catalog/catalog.json`), commit `f330461`. **Nada foi cadastrado**: os marcos dependem das decisões no fim do documento.

## O que o mecanismo de marcos curados já verifica

- **Marco de um capítulo:** um marco em `reward_triggers` com `kind = milestone`, ID igual ao do Santo e vínculo `book_code`/`chapter` é cumprido ao finalizar a leitura desse capítulo no Modo Missão, na primeira leitura ou numa releitura (sem XP, sem capítulo novo e sem meta diária na releitura). Gera `MILESTONE_REACHED` uma vez por jogador, e a regra `milestone_reached { milestone: <ID do item> }` concede o item. Isso está testado com um marco de teste em Êxodo 16.
- **Ainda não verificável:** marcos com vários capítulos (missão temática), marcos disparados pela conclusão de um livro, por sequência de dias, por coleção ou por conteúdo extra (reflexão, pergunta). Não há evento para essas condições.
- **Sem marco cadastrado, nenhum Santo é concedido.** Ler a passagem sozinho não basta, e `reward_triggers` não tem nenhum marco hoje.

## Regras preservadas

- Aquisição `milestone` (marco bíblico especial validado pelo servidor); nunca vendidos, sorteados nem negociáveis (o banco recusa colocar um Santo à venda).
- Exibição (corrigido): 9 Santos só em exibição no Santuário (7 artefatos + Água Transformada em Vinho e Pães da Multiplicação); 13 podem ser usados como fundo, moldura ou efeito. Nenhum representa uma pessoa divina; todos indicam o referente.
- As regras já existentes no catálogo (`milestone_reached` com o ID do item) não mudam: cadastrar um marco é só incluir a linha do marco com o capítulo.

## Comprovação no servidor (igual para todos)

Finalização no Modo Missão do capítulo → marco ativo em `reward_triggers` (tipo `milestone`, ID = ID do item, livro e capítulo) → evento `MILESTONE_REACHED` (uma vez por jogador) → regra `milestone_reached` do item concede o Santo.

## Tabela

| Item | ID | Referência | Significado (catálogo) | Uso | Referente | Inspiração na referência | Condição proposta | Verificável hoje? | Efeito da mesma leitura | Decisão |
|---|---|---|---|---|---|---|---|---|---|---|
| Luz da Criação | `holy_luz_da_criacao` | Gênesis 1:3 | A luz criada por Deus no princípio | Efeito do personagem + Santuário | Pai · obra | “Haja luz”: a primeira palavra criadora de Deus, mostrada como um efeito de luz. | Finalizar Gênesis 1 no Modo Missão | Sim | — | S-04 |
| Coluna de Nuvem e Fogo | `holy_coluna_de_nuvem_e_fogo` | Êxodo 13:21-22 | A condução de Israel no deserto | Fundo + Santuário | Pai · obra | Deus guiava o povo de dia numa coluna de nuvem e de noite numa coluna de fogo. | Finalizar Êxodo 13 no Modo Missão | Sim | — | — |
| Travessia do Mar | `holy_travessia_do_mar` | Êxodo 14:21-22 | A abertura do mar na narrativa do Êxodo | Fundo + Santuário | Pai · obra | As águas se dividem e Israel atravessa em terra seca. | Finalizar Êxodo 14 no Modo Missão | Sim | Na primeira leitura, também a Vara de Moisés (Raro complementar, regra de capítulo). Se Êx 14 for o último capítulo que falta, também o Lendário Cajado do Êxodo. | S-03 |
| Maná do Deserto | `holy_mana_do_deserto` | Êxodo 16:14-15 | O alimento providenciado no deserto | Santuário (relíquia, não equipável) | Pai · artefato | O pão que Deus deu no deserto, representado como relíquia de exposição. | Finalizar Êxodo 16 (agora) ou missão temática da provisão no deserto (depois) no Modo Missão | Sim, com Êxodo 16. A missão temática depende de marcos com vários capítulos (indisponível) | — | S-05 |
| Tábuas da Aliança | `holy_tabuas_da_alianca` | Êxodo 31:18 | As tábuas do testemunho | Santuário (relíquia) | Pai · artefato | As duas tábuas de pedra escritas pelo dedo de Deus, entregues a Moisés. | Finalizar Êxodo 31 no Modo Missão | Sim | — | — |
| Arca da Aliança (Representação) | `holy_arca_da_alianca_representacao` | Êxodo 25:10-22 | Modelo ilustrado da arca descrita no Tabernáculo | Santuário (relíquia) | Pai · artefato | As instruções para a arca e o propiciatório. Representação, não o objeto histórico. | Finalizar Êxodo 25 no Modo Missão | Sim | Êx 25 concede os 3 artefatos (Arca, Mesa e Candelabro) numa só leitura. O Cálice de Bronze (Raro, Êx 25) está pendente e não é afetado. | S-02 |
| Mesa dos Pães da Presença | `holy_mesa_dos_paes_da_presenca` | Êxodo 25:23-30 | Mesa do Tabernáculo | Santuário (relíquia) | Pai · artefato | A mesa com os pães colocados continuamente diante do Senhor. | Finalizar Êxodo 25 no Modo Missão | Sim | Ver Arca: 3 Santos na mesma leitura. | S-02 |
| Candelabro do Tabernáculo | `holy_candelabro_do_tabernaculo` | Êxodo 25:31-40 | O candelabro sagrado descrito na construção | Santuário (relíquia) | Pai · artefato | O candelabro de ouro com sete lâmpadas. | Finalizar Êxodo 25 no Modo Missão | Sim | Ver Arca: 3 Santos na mesma leitura. | S-02 |
| Altar do Incenso | `holy_altar_do_incenso` | Êxodo 30:1-10 | Altar do Tabernáculo | Santuário (relíquia) | Pai · artefato | O altar de ouro onde se queimava incenso diante do véu. | Finalizar Êxodo 30 no Modo Missão | Sim | — | — |
| Fogo no Carmelo | `holy_fogo_no_carmelo` | 1 Reis 18:36-39 | A resposta de Deus no Monte Carmelo | Fundo + Santuário | Pai · obra | O fogo que desce do céu em resposta à oração de Elias. | Finalizar 1 Reis 18 no Modo Missão | Sim | Se 1 Rs 18 for o último capítulo que falta, também o Lendário Emblema do Carmelo. | S-06 |
| Fogo da Dedicação do Templo | `holy_fogo_da_dedicacao_do_templo` | 2 Crônicas 7:1-3 | O fogo na dedicação do templo | Fundo + Santuário | Pai · obra | O fogo desce do céu quando Salomão termina de orar, e a glória enche o templo. | Finalizar 2 Crônicas 7 no Modo Missão | Sim | — | — |
| Rolo da Lei Encontrado | `holy_rolo_da_lei_encontrado` | 2 Reis 22:8-11 | A descoberta do Livro da Lei no templo | Santuário (relíquia) | Pai · artefato | Hilquias encontra o Livro da Lei; Josias rasga as vestes ao ouvi-lo. | Finalizar 2 Reis 22 no Modo Missão | Sim | Se 2 Rs 22 for o último capítulo que falta, também o Lendário Pergaminho Redescoberto, que se refere à mesma passagem. | S-06 |
| Livramento na Fornalha | `holy_livramento_na_fornalha` | Daniel 3:24-27 | O livramento narrado no episódio da fornalha | Fundo + Santuário | Pai · obra | Os três jovens saem da fornalha sem cheiro de fogo. | Finalizar Daniel 3 no Modo Missão | Sim | — | — |
| Sinal do Cordeiro de Deus | `holy_sinal_do_cordeiro_de_deus` | João 1:29 | Símbolo do testemunho acerca de Jesus | Moldura + Santuário | Filho · símbolo | “Eis o Cordeiro de Deus”: o testemunho de João Batista sobre Jesus, mostrado como sinal, sem personificação. | Finalizar João 1 no Modo Missão | Sim | — | S-04 |
| Água Transformada em Vinho | `holy_agua_transformada_em_vinho` | João 2:6-11 | Sinal de Jesus em Caná, representado pelos jarros | Santuário (relíquia) | Filho · obra | O primeiro sinal de Jesus em Caná, representado pelas talhas de pedra. | Finalizar João 2 no Modo Missão | Sim | — | S-04 |
| Pães da Multiplicação | `holy_paes_da_multiplicacao` | João 6:11-13 | A multiplicação dos pães | Santuário (relíquia) | Filho · obra | Os pães que alimentaram a multidão e as doze cestas que sobraram. | Finalizar João 6 no Modo Missão | Sim | — | — |
| Túmulo Vazio | `holy_tumulo_vazio` | Lucas 24:2-6 | Símbolo da ressurreição de Jesus | Fundo + Santuário | Filho · obra | “Não está aqui, mas ressuscitou”: a pedra removida e o túmulo vazio. | Finalizar Lucas 24 no Modo Missão | Sim | Lc 24 é o último capítulo de Lucas: para quem lê em ordem, a mesma leitura costuma conceder também o Lendário Cenário da Manjedoura. | S-06 |
| Cenário do Monte da Transfiguração | `holy_cenario_do_monte_da_transfiguracao` | Mateus 17:1-5 | Representação do cenário da transfiguração sem personificar Deus como item | Fundo + Santuário | Filho · obra | O monte e a nuvem luminosa da transfiguração, sem representar pessoas divinas. | Finalizar Mateus 17 no Modo Missão | Sim | — | S-07 |
| Sinal da Pomba | `holy_sinal_da_pomba` | Mateus 3:16 | Símbolo da descida do Espírito no batismo de Jesus | Moldura + Santuário | Espírito Santo · símbolo | O Espírito desce “como pomba” no batismo: sinal, não personificação. | Finalizar Mateus 3 no Modo Missão | Sim | Mt 3 já tem a missão “A voz que clama no deserto”: uma leitura concede o Raro Cinto de Couro de João e este Santo. | S-03 |
| Chamas de Pentecostes | `holy_chamas_de_pentecostes` | Atos 2:1-4 | Sinal visual das línguas como de fogo | Efeito do personagem + Santuário | Espírito Santo · obra | As línguas “como de fogo” que pousaram sobre cada um em Pentecostes. | Finalizar Atos 2 no Modo Missão | Sim | — | — |
| Selo da Promessa | `holy_selo_da_promessa` | Efésios 1:13 | Representação simbólica do Espírito como selo | Moldura + Santuário | Espírito Santo · símbolo | “Selados com o Espírito Santo da promessa”: imagem do selo como garantia. | Finalizar Efésios 1 no Modo Missão | Sim | — | — |
| Cenário da Nova Criação | `holy_cenario_da_nova_criacao` | Apocalipse 21:1-5 | Representação artística da promessa de todas as coisas novas | Fundo + Santuário | Deus Triúno · obra | “Novo céu e nova terra”: a promessa de que todas as coisas serão feitas novas. | Finalizar Apocalipse 21 no Modo Missão | Sim | O Lendário de Apocalipse (Cenário da Nova Jerusalém, Ap 21) vem só ao concluir o livro; Ap 21 não é o último capítulo. É o único item da coleção Obras do Deus Triúno, que não tem recompensa. | S-08 |

## Decisões editoriais em aberto

| # | Tema | Situação | Decisão pedida |
|---|---|---|---|
| S-01 | Regra geral dos marcos | Proposta: o marco de cada Santo é cumprido ao finalizar no Modo Missão o capítulo da referência, na primeira leitura ou numa releitura, uma vez por jogador. É a mesma regra das missões dos Raros e o mecanismo atual já verifica. | Aprovar, ou exigir algo além da leitura (reflexão, pergunta, conteúdo curado). Isso dependeria de conteúdo e de um evento que ainda não existem. |
| S-02 | Êxodo 25 concede 3 Santos | Arca, Mesa dos Pães e Candelabro estão no mesmo capítulo. Opção A: um capítulo, três Santos. Opção B: distribuir por outras passagens que descrevem os mesmos objetos (por exemplo Arca — Êx 25; Mesa — Lv 24:5-9; Candelabro — Lv 24:1-4, que ficariam juntos em Lv 24; ou Êx 37 e Êx 40, que também os reúnem). | Escolher A ou B. Não existe uma distribuição de um objeto por capítulo sem mudar referências. |
| S-03 | Santo junto com outras recompensas | Mateus 3 concede o Raro Cinto de Couro de João (missão já cadastrada) e o Sinal da Pomba. Êxodo 14 concede a Vara de Moisés na primeira leitura e a Travessia do Mar. | Aceitar recompensas combinadas para Santos ou mover o marco para outro capítulo da mesma narrativa. |
| S-04 | Santos no início dos livros mais lidos | Gênesis 1 (Luz da Criação), João 1 e João 2 costumam ser lidos nos primeiros dias, então o jogador ganharia um Santo muito cedo. | Aceitar, ou reservar esses Santos para marcos temáticos com vários capítulos (mecanismo ainda inexistente). |
| S-05 | Maná do Deserto | O catálogo oficial cita uma “missão temática sobre a provisão no deserto”. Com o mecanismo atual, só Êxodo 16 é verificável. Uma missão temática (por exemplo Êx 16 + Nm 11 + Jo 6) precisaria de marcos com vários capítulos. | Cadastrar com Êxodo 16 agora ou aguardar o mecanismo temático. |
| S-06 | Santo e Lendário na mesma leitura | Se Lucas 24, 1 Reis 18 ou 2 Reis 22 forem o último capítulo que falta do livro, a leitura concede também o Lendário. Em 2 Reis 22, o Santo (Rolo da Lei Encontrado) e o Lendário (Pergaminho Redescoberto) tratam da mesma descoberta. | Aceitar e revisar os textos dos dois itens de 2 Reis 22 para não parecerem duplicados. |
| S-07 | Textos sem personificação | Transfiguração, Sinal da Pomba, Cordeiro de Deus e Nova Criação precisam de textos de tela que tratem os itens como cenário ou sinal, nunca como pessoa divina. As propostas da tabela seguem isso. | Aprovar os textos dos marcos antes do cadastro. |
| S-08 | Coleções das obras | Obras do Pai (13), de Jesus Cristo (5), do Espírito Santo (3) e do Deus Triúno (1) não têm item de recompensa. Os marcos só fazem as coleções avançarem; a do Deus Triúno fica completa com um único marco. | Manter sem recompensa ou definir uma recompensa (conteúdo novo). |
| S-09 | Liberação | Os 22 marcos podem ser cadastrados de uma vez ou em etapas, conforme a revisão de arte e texto. | Definir a ordem de liberação. |

## Depois da revisão (implementação prevista)

1. Catálogo v8: marcos em `catalog.json#missions` com `kind: milestone` e o ID do Santo (o gerador já cadastra `reward_triggers` com livro e capítulo).
2. Testes por marco: primeira leitura, releitura sem XP, recompensas combinadas (Êx 25, Mt 3, Êx 14), Santo + Lendário no último capítulo e exibição no Santuário.
