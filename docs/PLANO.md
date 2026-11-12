# Plano de implementação — Personagens 2D

Baseado em *Jornada Bíblica — PRD e especificação para Claude Code* (v1.0, 11/11/2026).

## Análise do repositório (início do Marco 1)

O repositório estava **vazio** (sem commits). Seguindo a §14 da especificação, foi criada a base
sugerida: **Expo + TypeScript + Expo Router + Supabase**.

| Área | Decisão |
|---|---|
| Navegação | Expo Router com `Stack.Protected` por estado: visitante → onboarding → abas |
| Autenticação | Supabase Auth (e-mail/senha, PKCE, recuperação por link). Google/Apple **não** ativados: exigem credenciais reais |
| Dados | PostgreSQL com RLS; escrita só por RPC `SECURITY DEFINER` |
| Tema | Tokens claro/escuro próprios, fonte Cinzel para títulos |
| Avatar | SVG em camadas (`react-native-svg`) com manifest versionado; aceita PNG/WebP depois |
| Estado | `useReducer` para o rascunho do editor (sem biblioteca extra) |
| Textos | `src/i18n/pt-BR.ts`, prontos para outros idiomas |
| Bibliotecas adicionadas | `@supabase/supabase-js`, `react-native-svg`, `@react-native-async-storage/async-storage`, `react-native-url-polyfill`, `@expo-google-fonts/cinzel`; dev: `jest-expo`, `pg` (testes) |

### Ajustes em relação às sugestões do PRD

- `cosmetic_items.id` é um texto estável (ex.: `tunic-linen`) em vez de UUID + `slug`: o mesmo ID
  é usado no app, no manifest de arte e no banco, gerado a partir de um único JSON.
- `avatar_appearances` ganhou `brows_id` (sobrancelhas aparecem no Passo 2 da spec).
- Ordem de camadas refinada (permitido pela §5.1): braços e mangas ficam acima da túnica para
  as mãos aparecerem, e o pescoço fica acima do manto dianteiro.
- Rotas: a aba Início é `/home` (grupo `(tabs)`), seguindo a convenção do Expo Router.

## Marcos

### Marco 1 — Fundação funcional ✅

- [x] Tipos, catálogo inicial (3 corpos, 6 tons, 6 olhos, 4 sobrancelhas, 5 expressões, 6 barbas,
      12 cabelos, 8 cores, 8 túnicas, 5 mantos, 6 calçados, 6 cintos, 9 acessórios, 1 fundo)
- [x] Manifest de arte + `AvatarRenderer` com placeholders consistentes e fallback
- [x] Autenticação real (Supabase) e migrações com RLS
- [x] Onboarding: identidade → personagem em 4 passos → ritmo
- [x] Aleatório (só peças gratuitas compatíveis), Restaurar com confirmação, seleção mantida ao voltar
- [x] Status de sincronização honesto (rascunho local × salvo na conta × erro)
- [x] Persistência e retorno após novo login / outro aparelho
- [x] Editor inicial com Salvar/Descartar e conflito de versão
- [x] Testes: domínio (34), banco (65), ponta a ponta (fluxo completo)

### Correção de direção artística (Opção B) — em validação

- [x] Nova geometria: canvas 1024×1536, ~5,6 cabeças, 3 silhuetas distintas, âncoras fixas
- [x] Renderizador misto (vetor + PNG/WebP com tingimento de pele/cabelo) e camada de mãos
- [x] Conjunto de validação em vetor detalhado: 3 corpos, 3 olhos, 3 sobrancelhas, 3 expressões,
      2 barbas, 3 cabelos, 3 túnicas, 2 mantos, 2 calçados, Túnica de José, fundo
- [x] Novo criador de RPG (palco grande, zoom no rosto, carrossel, transição, prévia bloqueada)
- [x] Catálogo v2 (Túnica de José + regra Gn 37) e visuais sugeridos
- [ ] **Aprovação visual do conjunto de validação**
- [ ] Ilustração final pintada (ver `docs/ARTE.md` §6) e expansão do catálogo

### Marco 2 — Personalização completa ✅ (aguardando revisão)

- [x] Guarda-roupa (P03) com 10 categorias, filtros, busca, prévia, equipar/remover, Salvar/Descartar
- [x] Detalhe do item (P04) com referência, desbloqueio, situação, coleção e variantes
- [x] Inventário persistente e itens bíblicos (catálogo v3) — todos gratuitos
- [x] Equipamentos evolutivos como itens próprios (`variant_of`)
- [x] Coleções (P05) Moisés, Davi e Profetas, com recompensa conferida no servidor
- [x] Visuais salvos (P06): 3 grátis / 10 Premium, com regra sem perda de dados ao cancelar
- [x] Motor de recompensas por eventos (idempotente, validado na Bíblia canônica)
- [x] Avatar em três tamanhos; Início, Perfil, perfil público e aba Amigos
- [x] Pipeline de ilustrações (validador, registro, política de variantes, moldes, prompts)
- [ ] Ilustrações finais (dependem de ferramenta de imagem; nada foi gerado aqui)
- [ ] Validação num projeto Supabase real
- [ ] Integração de pagamento (webhook → `user_entitlements`)

### Sistema de itens e raridades ✅ (aguardando aprovação)

- [x] Cinco raridades (tabela de referência) e série de 144 itens (22/18/16/66/22) — rascunho substituído pelo catálogo oficial
- [x] Raridade, slot e obtenção independentes; slot `relic` não equipável
- [x] Um lendário por livro (todos os capítulos); BOOK_COMPLETED recusado sem os capítulos
- [x] Santuário das Conquistas (obras do Pai, de Jesus Cristo e do Espírito Santo; Biblioteca Lendária)
- [x] Contrato para Modo Missão: MISSION_COMPLETED, MILESTONE_REACHED, WORLD_COMPLETED + `reward_triggers`
- [x] Importador do catálogo oficial
- [x] Catálogo oficial integrado (v5): 144 itens, aliases de ID, migração de posse/visuais, backfill,
  `get_reading_progress` — ver `docs/catalogo-oficial/RECONCILIACAO.md`
- [ ] Ilustrações dos 144 itens
- [ ] Modo Missão com cronômetro e leitura (próxima etapa, após aprovação)

### Modo Missão de leitura ✅ (aguardando revisão)

- [x] Escolher livro/capítulo, Bíblia física com cronômetro, pausar/retomar, restaurar ao reabrir
- [x] `complete_reading_mission` idempotente; XP (provisório); Lendário por livro; releitura sem duplicar
- [x] Missão curada do Manto do Profeta (1 Reis 19); progressão até a Coleção dos Profetas
- [ ] Leitor digital (texto licenciado), Siclos, meta diária com escolha de Comum, missões dos outros
  17 Raros e marcos dos 22 Santos — dependem de conteúdo/regra de produto (docs/MODO-MISSAO.md)

### Meta diária v1 ✅ (aguardando revisão)

- [x] Primeiro capítulo inédito do dia: 40 Siclos + escolha de 1 entre até 3 Comuns (servidor)
- [x] Fuso do perfil (padrão America/Sao_Paulo), virada do dia testada, proteção contra troca de fuso
- [x] Escolha pendente persistente, resgate idempotente, concorrência testada
- [x] v2: recompensa ao completar a meta pessoal (snapshot por dia, mudança vale amanhã, ritmo livre
  com missão do dia, 40 XP por capítulo + 20 de bônus, fuso do aparelho só como sugestão)
- [x] Mercado dos Viajantes v1 (docs/MERCADO.md)

### Marco 3 — Leitura e recompensas

- Catálogo canônico de livros/capítulos (66 livros, 1.189 capítulos) e adaptador de conteúdo licenciado.
- `chapter_completions`, `xp_ledger`, `reward_events` e RPC `complete_chapter` idempotente
  (chaves únicas por usuário/capítulo/evento; reexecução sem duplicatas; controle de abuso).
- Regras de desbloqueio: Túnica de José (Gn 37), Sandálias do Deserto (Êx 3), Funda de Davi (1Sm 17),
  Manto de Elias (1Rs 19) → Manto da Sucessão (2Rs 2 + pré-requisito), Harpa do Salmista (30 salmos),
  Coroa da Sabedoria (Provérbios), Moldura Jornada Completa (1.189 capítulos).
- Tela B02 (recompensa pós-leitura, `Equipar agora`), coleções iniciais, missões, XP e sequência não punitiva.

### Marco 4 — Social e acabamento

- Projeção pública mínima do perfil/avatar respeitando `privacy_mode`, amigos, bloqueio e denúncia.
- Mural de 6 conquistas, títulos, molduras, animações de conquista (com movimento reduzido).
- Auditoria de acessibilidade, performance (pré-carregamento/cache de assets) e dispositivos reais.

## Decisões de arte pendentes (para o time de ilustração)

- Estilo final, paleta e proporções (os placeholders usam cabeça grande, estilo "chibi" de RPG).
- Exportar cada peça em PNG/WebP transparente 720×1080 alinhado à mesma âncora (centro x=360).
- Mantos em duas camadas (traseira/dianteira); cabelos em duas camadas (traseira/frontal).
- Versões por corpo onde a silhueta mudar (A esguio, B médio, C robusto).
- Miniaturas leves para listas/rankings e versão alta para o editor.

## Checklist de testes (critérios §12 cobertos no Marco 1)

| Critério | Como foi verificado |
|---|---|
| Criar personagem, preview imediato, mesmo avatar após reiniciar | e2e: reload + comparação pixel a pixel |
| Trocar pele/cabelo/roupa nunca mistura camadas | testes de `resolveLayers` e `setEquipped` |
| Descartar não persiste | e2e + teste do reducer |
| Não equipa item bloqueado, de outro usuário ou no slot errado | testes SQL (`item_not_owned`, `item_slot_mismatch`, gatilhos) |
| Avatar igual em dois aparelhos | e2e: segundo contexto de navegador com login |
| Privacidade / RLS sobre dados alheios | testes SQL com dois usuários |
| UI em celular pequeno, claro/escuro | capturas 320×568, 390×844, 1280×800, tema escuro |
| Rede lenta / offline | rascunho local + mensagem; **não testado em dispositivo real** |
