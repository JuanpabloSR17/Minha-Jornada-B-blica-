# Sistema de itens e raridades

> **Catálogo oficial integrado (v5).** Fonte: [`docs/catalogo-oficial/`](catalogo-oficial/) —
> `catalogo_raridades_144_itens_v2.json` e `Jornada_Biblica_Raridades_144_Itens_Claude_Code.md`, com
> `SHA256SUMS.txt` (conferido por teste). O rascunho anterior (série `rarities-v1`) foi substituído sem
> apagar nada: veja [RECONCILIACAO.md](catalogo-oficial/RECONCILIACAO.md).

## 1. Raridades

| Raridade | Quantidade | O que é | Como se obtém |
|---|---:|---|---|
| Comum | 22 | Equipamentos do dia a dia | Recompensa do Modo Missão (em breve); 2 já são peças iniciais gratuitas |
| Raro | 18 | Sacerdotes, profetas, funções especiais | Missão especial (em breve) |
| Épico | 16 | Personagens e acontecimentos marcantes | **Gratuito**: concluir o capítulo da passagem |
| Lendário | 66 | Um por livro da Bíblia | **Gratuito**: concluir todos os capítulos do livro |
| Santo | 22 | Artefatos sagrados e representações simbólicas das obras de Deus | Marco bíblico curado, validado pelo servidor |

Total oficial: **144 itens** (série `oficial-v2`). Somam-se 33 peças iniciais gratuitas (`starter`) e
8 itens complementares com histórico (`complementar`), fora da contagem. Nenhum item é Premium nem
negociável. Raridade é **só visual**: não dá poder, XP nem vantagem.

## 2. Campos de cada item

| Campo | Coluna | Observação |
|---|---|---|
| Identificador | `id` | canônico e estável; IDs antigos viram **aliases** (`cosmetic_item_aliases`) |
| Nome, descrição | `name`, `description` | descrição = significado + relação com o texto + referência |
| Raridade | `rarity` | independente do slot e da obtenção |
| Slot | `slot` | `outfit`, `back` (manto), `feet`, `waist`, `neck`, `head`, `hands`, `background`, `frame`, `chest`, `special`, `effect`, `back_item` ou **`relic`** |
| Referência bíblica | `scripture_ref` | livro e capítulo validados contra os 66 livros |
| Relação com o texto | `representation` | `literal` (descrito no texto) ou `inspired`/`metaphorical`/`symbolic` (**associação interpretativa**, exibida como tal) |
| Significado | `meaning` | do arquivo oficial |
| Referente (Santos) | `referent`, `holy_subtype` | Pai, Filho, Espírito Santo ou Deus Triúno; artefato, obra ou símbolo |
| Loja futura | `shop_eligible`, `shop_price_suggested` | **só metadado** (não há loja); Santos nunca (CHECK no banco) |
| Regra de obtenção | `item_unlock_rules` | com `is_active`: trocar a regra não apaga o histórico |
| Propriedade | `user_items` | só o servidor escreve; posse nunca é apagada |
| Livro (lendários) | `book_code` | um lendário **ativo** por livro (índice único) |

Mapeamento de slots do arquivo oficial: `cloak`→`back`, `back`→`back_item`, `hand`→`hands`,
`sanctuary`→`relic`; os demais têm o mesmo nome.

## 3. Itens Santos e Santuário das Conquistas

- **Artefatos** (7, slot `relic`): só em exibição no Santuário — o servidor recusa equipá-los
  (`item_not_equippable`) e o app também.
- **Obras e sinais** (15): representações simbólicas usadas como fundo, moldura ou efeito, como o
  arquivo oficial define. Nenhum representa uma pessoa divina; todos indicam o referente.
- Nunca vendidos, sorteados ou comercializados (CHECK `cosmetic_items_holy_not_for_sale`).
- Coleções: **Obras do Pai** (13), **Obras de Jesus Cristo** (5), **Obras do Espírito Santo** (3),
  **Obras do Deus Triúno** (1). O Santuário também mostra a **Biblioteca Lendária** (66 livros).

## 4. Regras de obtenção

| Origem oficial (`desbloqueio`) | Regra no banco | Quem concede |
|---|---|---|
| `capitulo_concluido` | `chapter_completed` | motor, ao registrar `CHAPTER_COMPLETED` |
| `livro_concluido` | `book_completed` | motor, quando **todos** os capítulos do livro estão registrados |
| `missao_ou_loja` / `missao_especial_ou_loja` | `mission_pool` (comum/raro) | **nunca automático** — escolha do Modo Missão |
| `marco_biblico_especial` | `milestone_reached` (id = item) | só com o marco cadastrado em `reward_triggers` |

`reward_triggers` está **vazia** em produção: nenhum item real é concedido por evento fictício.
Progresso bíblico calculado no servidor: `public.get_reading_progress()` (capítulos distintos,
% da Bíblia, livros concluídos, lendário de cada livro, recompensas de leitura e quanto falta).

## 5. IDs, aliases e migração de dados

- **IDs com histórico são preservados** (peças iniciais e itens das migrações v1–v3): o ID oficial
  vira alias. Ex.: `chapter_gen_37`→`tunic-joseph`, `book_1sa`→`sling-david`,
  `book_pro`→`crown-wisdom`, `common_sandalias_de_couro`→`sandals-leather`.
- **IDs só do rascunho** (v4) dão lugar ao ID oficial; o ID do rascunho
  vira alias (`legendary-gen`→`book_gen`) e o item antigo é **desativado, nunca apagado**.
- `private.apply_item_aliases()` (roda na migração v5, idempotente): dá a posse do item canônico a quem
  tinha o antigo, mantém a posse antiga, re-equipa no slot oficial e tira do visual itens desativados
  (a túnica volta para a inicial) — nenhum visual fica inválido.
- `equip_item` aceita ID canônico, oficial ou do rascunho. O app resolve aliases em `getItem`,
  na posse (`itemView`) e no desenho (`resolveEquipmentIds`).
- Backfill: a migração reavalia as recompensas de quem já tem eventos de leitura (idempotente).

## 6. Reimportar / atualizar o catálogo oficial

```bash
node scripts/import-rarities-catalog.mjs docs/catalogo-oficial/catalogo_raridades_144_itens_v2.json --report relatorio.md
node scripts/import-rarities-catalog.mjs <arquivo> --write   # grava catalog.json (versão + 1)
# adicione o prefixo da nova versão em scripts/generate-catalog-sql.mjs
npm run catalog:sql && npm test && npm run test:db
```

O importador valida quantidades, um lendário por livro, referências (livro/capítulo existentes),
IDs duplicados, nada negociável e nenhum Santo na loja. A reconciliação casa cada item oficial nesta
ordem: mesmo ID → alias conhecido → mesmo nome com histórico → mesma raridade+slot+passagem com
histórico → rascunho (lendário pelo livro, demais pelo nome) → novo. Reimportar o mesmo arquivo não
muda nada (testado).
