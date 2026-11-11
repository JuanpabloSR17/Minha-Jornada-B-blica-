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

### Marco 2 — Guarda-roupa e inventário (próximo)

- Telas P03 (guarda-roupa por slot, filtros Todos/Obtidos/Equipados/raridade/livro/coleção, busca)
  e P04 (detalhe do item: raridade, referência bíblica, condição de desbloqueio, status).
- Guias Fundo e Moldura no editor.
- RPCs `equip_item` / `unequip_slot` por loadout, `create_loadout`, `rename_loadout`,
  `activate_loadout`, `delete_loadout` com limite de 3 (grátis) / 10 (premium) **validado no servidor**.
- Itens não iniciais + função de servidor para conceder item de teste.
- Regra previsível ao cancelar Premium (loadouts excedentes ficam somente leitura, sem perda).

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
