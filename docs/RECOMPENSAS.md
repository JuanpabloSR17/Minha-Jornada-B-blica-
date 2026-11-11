# Motor de recompensas, inventário e visuais salvos (Marco 2)

Migração: `supabase/migrations/20261113000100_marco2_wardrobe.sql`
(reversão manual: `supabase/rollbacks/20261113000100_marco2_wardrobe.down.sql`).

## Princípios

- **Só o servidor concede itens.** O cliente não escreve em `user_items`, `reward_events`,
  `user_entitlements` nem no catálogo (RLS + privilégios revogados; testado).
- **Idempotência:** um evento é único por `(usuário, tipo, source_event_id)`; cada regra recompensa
  cada usuário no máximo uma vez (`unique (user_id, rule_id)`); eventos do mesmo usuário são
  serializados com lock consultivo. Testado com requisições simultâneas.
- **Validação de domínio:** capítulos e livros são conferidos contra `bible_books`
  (66 livros, 1.189 capítulos). Payload inválido é recusado.
- **Nada de progresso simulado.** Enquanto a leitura real não existe (Marco 3), eventos só são
  criados por cenários isolados de teste (`supabase/tests/20_marco2_wardrobe.sql` e o e2e).

## Eventos

| Tipo | Payload | Exemplo de `source_event_id` |
|---|---|---|
| `CHAPTER_COMPLETED` | `{ "book": "GEN", "chapter": 37 }` | `chapter:GEN.37` |
| `BOOK_COMPLETED` | `{ "book": "PRO" }` | `book:PRO` |
| `WORLD_COMPLETED` | `{ "world": "patriarcas" }` | `world:patriarcas` |
| `READING_STREAK_REACHED` | `{ "days": 7 }` | `streak:7:2026-11-20` |
| `ACHIEVEMENT_UNLOCKED` | `{ "achievement": "primeiro-livro" }` | `achievement:primeiro-livro` |
| `MISSION_COMPLETED` | `{ "mission": "mission-lost-coin" }` (cadastrada em `reward_triggers`) | `mission:mission-lost-coin` |
| `MILESTONE_REACHED` | `{ "milestone": "..." }` (cadastrado em `reward_triggers`) | `milestone:...` |
| `COLLECTION_COMPLETED` | `{ "collection": "prophets" }` | gerado pelo próprio motor |

Entrada única: `private.record_event(user_id, tipo, source_event_id, payload)` → 
`{ duplicate, eventId, granted: [itemIds] }`. Fica no schema `private` (não exposto pela API).
No Marco 3, a RPC autenticada `complete_chapter` validará a leitura e chamará esta função.
`COLLECTION_COMPLETED` não pode ser "declarado": o servidor confere se o usuário possui todos os itens.

## Regras de desbloqueio (`item_unlock_rules`)

| `rule_type` | `rule_payload` | Cumprida quando |
|---|---|---|
| `chapter_completed` | `{ book, chapter }` | o capítulo foi concluído |
| `book_completed` | `{ book }` | **todos** os capítulos do livro concluídos (`BOOK_COMPLETED` sem eles é recusado) |
| `mission_completed` | `{ mission }` | missão cadastrada e concluída |
| `milestone_reached` | `{ milestone }` | marco cadastrado e alcançado |
| `chapters_count` | `{ count, book? }` | nº de capítulos **distintos** (releitura não conta) |
| `world_completed` | `{ world }` | mundo concluído |
| `reading_streak` | `{ days }` | sequência ≥ dias |
| `achievement_unlocked` | `{ achievement }` | conquista obtida |
| `collection_completed` | `{ collection }` | possui todos os itens da coleção |
| `mission_pool` | `{ pool }` | **nunca automático**: comuns/raros oferecidos pelo futuro Modo Missão |

Regras têm `is_active`: ao trocar a regra de um item, a antiga fica inativa (histórico preservado).

`requirements`: lista de `{ "type": "item_owned", "item": "..." }`. A cada evento o motor reavalia
**todas** as regras ainda não concedidas, em rodadas, então requisitos cumpridos depois também
liberam recompensas pendentes (ex.: ler 2 Reis 2 antes de 1 Reis 19).

## Itens bíblicos do catálogo v3 (regras atuais após o catálogo oficial; ver docs/RARIDADES.md)

| Item | Regra | Referência |
|---|---|---|
| Túnica de José | Gênesis 37 | Gênesis 37:3 |
| Sandálias do Deserto | Êxodo 3 | Êxodo 3:5 |
| Vara de Moisés | Êxodo 14 | Êxodo 14:16 |
| Funda de Davi (lendário de 1 Samuel) | livro de 1 Samuel | 1 Samuel 17:40,49 |
| Harpa de Davi | 1 Samuel 16 | 1 Samuel 16:23 |
| Manto do Profeta | Modo Missão (missão especial, em breve) | 1 Reis 19:19 |
| Manto da Sucessão (variante) | 2 Reis 2 + possuir Manto de Elias | 2 Reis 2:13-14 |
| Manto de Elias — Edição dos Profetas (variante) | Coleção dos Profetas | 1 Reis 19:19; 2 Reis 2:13-14 |
| Rolo de Isaías (raro complementar) | livro de Isaías | Lucas 4:17 |
| Coroa da Sabedoria | livro de Provérbios | Provérbios 4:9 |
| Moldura Jornada Completa | 1.189 capítulos | Salmos 119:105 |
| Fundo do Monte Sinai | Coleção de Moisés | Êxodo 19:20 |
| Fundo dos Campos de Belém | Coleção de Davi | 1 Samuel 16:11 |

Todos são **gratuitos**. Itens são simbólicos e cosméticos.

## Evoluções

Cada aparência evoluída é um **item próprio** com `variant_of` apontando para a base. A base nunca é
removida; o jogador equipa a aparência que preferir. O detalhe do item mostra a família.

## Visuais salvos e plano

- Gratuito: 3 visuais. Premium: 10. Validado no servidor (`create_loadout`).
- Premium vem de `user_entitlements`, escrita **somente** pelo servidor (webhook do provedor de
  pagamento, com a service role, fora do app). Conta como Premium: `plan = 'premium'`,
  `status in ('active','past_due')` e `current_period_end` no futuro.
- Ao perder o Premium, **nenhum visual é apagado**: os que passam do limite (por ordem de criação)
  ficam só leitura — podem ser vistos e excluídos, mas não editados, renomeados nem ativados.
- Cada visual tem `version`; salvar com versão antiga retorna `version_conflict`.

### Integração do pagamento (pendente)

Não há provedor configurado. Quando houver: crie uma Edge Function que valide a assinatura do
webhook do provedor e faça `upsert` em `user_entitlements` com a service role. Nunca exponha a
service role no app e nunca aceite o plano vindo do cliente.

## RPCs para o app

`get_wardrobe`, `save_wardrobe`, `equip_item`, `unequip_slot`, `create_loadout`, `rename_loadout`,
`activate_loadout`, `delete_loadout`, `get_collections`, `get_public_avatar`, `set_privacy_mode`, `get_reading_progress`
(além de `save_avatar`, redefinida com versão do visual, bloqueio de excedentes e compatibilidade de corpo).

## Perfil público

`get_public_avatar(username)` devolve só `username`, `displayName`, `appearance`, `equipment` e flags.
Perfil `private` (padrão) não mostra o avatar a outros; `public` mostra a qualquer usuário logado;
`friends` por enquanto equivale a privado (amizades chegam no Marco 4).
