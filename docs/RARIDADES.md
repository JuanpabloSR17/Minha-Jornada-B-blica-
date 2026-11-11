# Sistema de itens e raridades

> **Catálogo rascunho.** Os arquivos `Jornada_Biblica_Raridades_144_Itens_Claude_Code.md` e
> `catalogo_raridades_144_itens_v2.json` estão no computador do autor e não estavam acessíveis neste
> ambiente. O catálogo atual (série `rarities-v1`) foi escrito a partir das regras da especificação
> enviada na conversa e deve ser substituído pelo oficial com o importador (seção 5).

## 1. Raridades

| Raridade | Quantidade | O que é | Cor |
|---|---:|---|---|
| Comum | 22 | Equipamentos do dia a dia: túnicas, sandálias, cajados, bolsas, cintos, cordas e recipientes | cinza |
| Raro | 18 | Itens de sacerdotes, profetas e funções especiais, mantos e vestes cerimoniais | azul |
| Épico | 16 | Itens ligados a personagens e acontecimentos marcantes (Túnica de José, Vestes de Ester, Harpa…) | roxo |
| Lendário | 66 | Um equipamento exclusivo por livro, ganho **gratuitamente** ao concluir todos os capítulos | laranja-ouro |
| Santo | 22 | Artefatos sagrados e representações simbólicas das obras de Deus (Arca, Maná, Candelabro…) | ouro |

Total da série: **144 itens**. Somam-se as 35 peças iniciais gratuitas (série `starter`), que não fazem
parte da contagem de raridades. Nenhum item da série é Premium.

As raridades ficam na tabela `public.rarities` (referência obrigatória de `cosmetic_items.rarity`).
Raridade é **só visual**: não dá poder, XP nem vantagem.

## 2. Campos de cada item

| Campo | Coluna | Observação |
|---|---|---|
| Identificador | `id` | estável; IDs antigos nunca mudam |
| Nome, descrição | `name`, `description` | |
| Raridade | `rarity` | independente do slot e da obtenção |
| Categoria | `category` | túnica, manto, calçado, cinto, instrumento, rolo, recipiente, cerimonial, relíquia… |
| Slot | `slot` | `outfit`, `back`, `feet`, `waist`, `neck`, `head`, `hands`, `background`, `frame` ou **`relic`** |
| Referência bíblica | `scripture_ref` | |
| Regra de obtenção | `item_unlock_rules` | tipo + parâmetros + requisitos |
| Método de obtenção | `acquisition` | `starter`, `reading`, `collection`, `mission`, `milestone`, `event` |
| Propriedade | `user_items` | só o servidor escreve |
| Asset visual | `asset_manifest_key` | `{slot}/{id}`; sem arte = emblema da raridade + "Arte em produção" |
| Livro (lendários) | `book_code` | no máximo um lendário por livro (índice único) |
| Série | `series` | `starter`, `rarities-v1`… (permite expansão) |

## 3. Relíquias santas e Santuário das Conquistas

Itens Santos usam o slot `relic`: o jogador os **possui** (inventário) e eles aparecem no
**Santuário das Conquistas** (`/avatar/sanctuary`), mas **não podem ser equipados**
(`item_not_equippable` no servidor; o cliente também bloqueia).

As 22 relíquias formam três coleções: **Obras do Pai** (8), **Obras de Jesus Cristo** (8) e
**Obras do Espírito Santo** (6). As pessoas divinas não são representadas como itens: as relíquias
lembram sinais e acontecimentos (ex.: Línguas de Fogo de Pentecostes, Talhas de Caná), nunca as pessoas.

O Santuário também mostra a **Biblioteca Lendária**: os 66 livros, com o lendário de cada um.

## 4. Regras de obtenção e Modo Missão

Contrato completo: [`src/features/rewards/contract.ts`](../src/features/rewards/contract.ts) e
[`docs/RECOMPENSAS.md`](RECOMPENSAS.md).

| O que a leitura informará | Evento | Regra que avalia |
|---|---|---|
| Capítulo concluído | `CHAPTER_COMPLETED` | `chapter_completed`, `chapters_count`, `book_completed` |
| Livro concluído | `BOOK_COMPLETED` (recusado se faltar capítulo) | lendários: todos os capítulos registrados |
| Mundo concluído | `WORLD_COMPLETED` | `world_completed` |
| Missão concluída | `MISSION_COMPLETED` | `mission_completed` |
| Marco especial | `MILESTONE_REACHED` | `milestone_reached` |

Missões, mundos e marcos precisam estar cadastrados em `public.reward_triggers` (ativo) — hoje a
tabela está **vazia** de propósito: eventos com IDs desconhecidos são recusados (`unknown_trigger`).
Quatro itens comuns já apontam para missões futuras e aparecem como "Modo Missão, em breve".
**Nenhum item real foi concedido por evento fictício**: concessões só existem nos bancos de teste.

## 5. Trocar o rascunho pelo catálogo oficial

```bash
node scripts/import-rarities-catalog.mjs caminho/catalogo_raridades_144_itens_v2.json          # valida
node scripts/import-rarities-catalog.mjs caminho/catalogo_raridades_144_itens_v2.json --write  # grava
# depois: aumente "version" em catalog.json, adicione o prefixo em scripts/generate-catalog-sql.mjs
npm run catalog:sql && npm test && npm run test:db
```

O importador aceita campos em português ou inglês, confere as quantidades por raridade, um lendário
por livro, campos obrigatórios, regras e IDs duplicados, e **mantém** IDs antigos que o arquivo não
trouxer (podem estar no inventário de alguém).
