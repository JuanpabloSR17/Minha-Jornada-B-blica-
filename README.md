# Jornada Bíblica

App de leitura bíblica gamificada com personagens 2D ilustrados.
Este repositório contém os **Marcos 1 e 2** do módulo de personagens: fundação (contas, onboarding,
criador) e personalização completa (guarda-roupa, inventário, visuais salvos, coleções e motor de
recompensas). Plano em [`docs/PLANO.md`](docs/PLANO.md).

**Stack:** Expo SDK 58 · React Native 0.88 · TypeScript · Expo Router · Supabase (Auth + PostgreSQL com RLS) · `react-native-svg`.

## O que já funciona

- Cadastro e login com e-mail/senha, recuperação de senha por link, sessão persistida.
- Onboarding: **Identidade** (nome + username único, perfil privado) → **Criador de personagem em 4 etapas** (Corpo → Rosto → Cabelo → Visual) → **Ritmo de leitura** (1/2/3/5/personalizado/sem meta).
- Avatar 2D em estilo **RPG ilustrado** (~5,6 cabeças), renderizado **por camadas** num canvas 1024×1536,
  pronto para receber ilustrações finais em PNG/WebP.
- Criador de personagem de RPG: personagem grande no centro, zoom de câmera no rosto, categorias com ícone,
  carrossel de peças em cartões, transição suave ao trocar peças, visuais sugeridos e prévia de itens bloqueados.
- Item bíblico de validação: **Túnica de José** (Gn 37:3), épica, com regra de desbloqueio por leitura.
- Persistência no Supabase via funções de servidor que validam opções, posse de itens e slots; itens iniciais são concedidos pelo servidor.
- Editor do perfil com **Salvar/Descartar**, controle de versão entre aparelhos (conflito detectado, nada sobrescrito).
- Modo **Experimentar** sem conta (salvo só no aparelho) que é aproveitado ao criar a conta.
- Tema claro/escuro, layout mobile-first que se adapta a tablet/desktop, rótulos de acessibilidade.

### Marco 2

- **Guarda-roupa** com personagem em destaque, 10 categorias (Túnicas, Mantos, Calçados, Cabelos,
  Cabeça e pescoço, Itens de mão, Cintura, Especiais, Fundos, Molduras), filtros e busca, itens
  obtidos e bloqueados, prévia ao vivo, equipar/remover, Salvar/Descartar e raridade visual.
- **Inventário persistente** no servidor e **detalhe do item** com referência bíblica, objetivo de
  desbloqueio, situação, coleção e **aparências evoluídas** (Manto de Elias → Sucessão → Edição dos Profetas).
- **Coleções** de Moisés, Davi e Profetas com progresso e recompensa conferidos no servidor.
- **Visuais salvos**: 3 grátis / 10 Premium, criar, renomear, usar, editar e excluir; Premium vem
  só de estado confiável no servidor; ao cancelar, nada é apagado (excedentes ficam só leitura).
- **Motor de recompensas** por eventos de leitura, idempotente e validado contra os 66 livros
  (detalhes em [`docs/RECOMPENSAS.md`](docs/RECOMPENSAS.md)). Sem leitura real ainda: só cenários de teste.
- **Avatar em todo o app** em três tamanhos (pequeno, médio, grande): Início, Perfil, perfil
  público (`/users/[username]`, com controle de privacidade) e aba Amigos.
- **Pipeline de ilustrações**: validador + registro automático de PNG/WebP, moldes de alinhamento e prompts.

### Itens e raridades

- **Catálogo oficial integrado**: cinco raridades (Comum, Raro, Épico, Lendário, Santo) e **144 itens**
  (22/18/16/66/22) de [`docs/catalogo-oficial/`](docs/catalogo-oficial/) — regras em
  [`docs/RARIDADES.md`](docs/RARIDADES.md), diferenças em
  [`RECONCILIACAO.md`](docs/catalogo-oficial/RECONCILIACAO.md).
- IDs com histórico preservados; IDs oficiais e do rascunho resolvidos por **aliases** (banco e app).
- Um **lendário por livro**, gratuito ao concluir todos os capítulos; épicos gratuitos por capítulo.
- **Itens Santos** nunca vendidos: relíquias só em exibição no **Santuário das Conquistas**; obras e
  sinais simbólicos como fundo, moldura ou efeito. Coleções das obras do Pai, de Jesus Cristo, do
  Espírito Santo e do Deus Triúno, e a Biblioteca Lendária.
- Novos slots: peitoral, emblema, efeito e costas. Detalhe do item mostra a relação com o texto
  (literal ou associação interpretativa) e o significado.
- Progresso bíblico calculado no servidor (`get_reading_progress`).

### Modo Missão de leitura

- Aba **Ler**: escolher livro e capítulo, Bíblia física (cronômetro) — a digital aguarda texto licenciado.
- Pausar/retomar contando só o tempo ativo; sessão restaurada ao bloquear a tela ou reabrir o app.
- Finalização confirmada pelo servidor (`complete_reading_mission`), idempotente: queda de conexão
  deixa a missão pendente para nova tentativa sem duplicar. Tela de recompensa com XP (provisório),
  progresso e itens concedidos. Lendário ao concluir o livro; missão especial de 1 Reis 19 dá o Manto
  do Profeta. Detalhes e regras pendentes: [`docs/MODO-MISSAO.md`](docs/MODO-MISSAO.md).
- **Meta diária**: a recompensa sai ao completar a **meta pessoal** do dia (1, 2, 3, 5 ou N capítulos
  inéditos; no ritmo livre, a missão escolhida antes de começar): 40 Siclos + 20 XP de bônus + escolha
  de 1 entre até 3 Comuns. Cada capítulo inédito dá 40 XP. A meta de cada dia é fixada (snapshot);
  mudanças valem no dia seguinte. Fuso de leitura do perfil (padrão America/Sao_Paulo; o aparelho só
  sugere). O Início mostra meta, capítulos de hoje, barra, recompensa prevista e quanto falta.
- **Mercado dos Viajantes**: 25 itens cosméticos (20 Comuns e 5 Raros) com os preços em Siclos do
  catálogo oficial; débito e item na mesma transação, compra idempotente e recuperável após queda de
  conexão, posse reconhecida por ID antigo. Detalhes e preços: [`docs/MERCADO.md`](docs/MERCADO.md).
- Contrato para o futuro Modo Missão (missões, marcos, mundos) — sem cronômetro e sem leitura ainda.

Telas ainda não implementadas (Jornada, Ler, Amigos, missões/XP, inventário, conquistas)
aparecem **sinalizadas como "Em construção"** — nada nelas é contabilizado.

> **Arte:** o conjunto atual é um **protótipo vetorial** da nova direção (proporção, silhueta,
> encaixe e experiência). O acabamento pintado da referência exige ilustração profissional:
> a especificação completa e a lista de assets estão em [`docs/ARTE.md`](docs/ARTE.md).
> Os PNG/WebP finais entram registrando a mesma chave no manifest, sem mudar o renderizador.

## Configuração

### 1. Dependências

```bash
npm install
```

### 2. Projeto Supabase

1. Crie um projeto em supabase.com.
2. Aplique as migrações de `supabase/migrations/` **em ordem**:
   - com a CLI: `supabase link --project-ref <ref>` e `supabase db push`; ou
   - pelo SQL Editor, colando os arquivos em ordem de nome (`20261111…`, `20261112…`, `20261113…`).
   Nunca edite migrações já aplicadas; crie novas.
3. Em **Authentication → URL Configuration**, adicione às *Redirect URLs*:
   - `jornadabiblica://auth/callback` (app nativo)
   - `http://localhost:8081/auth/callback` (web em desenvolvimento)
4. Em **Authentication → Providers → Email**, decida se exige confirmação de e-mail
   (o app trata os dois casos).

### 3. Variáveis de ambiente

```bash
cp .env.example .env
# preencha EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY
```

Use **somente a chave pública** (anon/publishable). Nunca coloque a service role key no app.
Sem essas variáveis, o app abre normalmente, avisa que o Supabase não está configurado e
deixa usar apenas o modo Experimentar.

### 4. Rodar

```bash
npm start          # Expo (Android/iOS via Expo Go ou dev build)
npm run web        # navegador
```

## Testes

| Comando | O que verifica |
|---|---|
| `npm run typecheck` | TypeScript estrito |
| `npm test` | 88 testes: sessão do Modo Missão (tempo ativo, pausa, reabrir, pendente, UUID), catálogo oficial (144 itens, SHA-256, aliases, compatibilidade de visuais antigos e do AvatarRenderer), importador e reimportação idempotente, catálogo, conjunto de validação da arte, aleatório, camadas, assets ausentes, pipeline de imagens (PNG sintéticos), inventário, filtros, variantes, coleções, estado do guarda-roupa, sincronia catálogo ↔ SQL |
| `npm run test:db` | 407 verificações (inclui Mercado: compra, reenvio, saldo insuficiente, fora da loja, preço pendente, posse por ID legado, compra × escolha gratuita, saldo disputado em dois aparelhos; meta diária v2: metas 1, 2, 3, 5 e 7, ritmo livre, mudança de meta durante o dia, capítulos além da meta, releitura, virada do dia em São Paulo e Tóquio, fuso sugerido × escolhido, regra v1 preservada, todos os Comuns obtidos, resgate duplo; Modo Missão: idempotência, releitura, Lendário no último capítulo, Manto do Profeta até a Coleção dos Profetas, finalizações simultâneas, catálogo oficial, aliases e conflitos de ID, migração de posse e visuais do rascunho, backfill sem duplicar, progresso bíblico, lendários por livro, Santos fora da loja, relíquias não equipáveis, missões/marcos sem eventos fictícios, reversões) num Postgres 16 descartável: RLS, privilégios, posse/slot, versões e conflitos, limites gratuito/Premium/expirado, motor de recompensas, evolução, coleções, perfil público, concorrência e reversão da migração |
| `npm run test:e2e` | Fluxo completo no navegador (39 etapas; inclui Mercado: Siclos da meta → compra → inventário, compra × escolha gratuita e resposta perdida; Início com a meta pessoal, mudança de meta agendada, meta 6 cumprida com animação, escolha pendente após reabrir e em outro aparelho, queda de conexão no resgate; Modo Missão físico com pausa, reabrir, queda de conexão, Lendário, releitura e Manto do Profeta; cadastro → criador → reabrir/outro aparelho → conflito → guarda-roupa → item bloqueado → recompensas → variantes → coleções → limite de visuais → perfil público entre dois usuários), com capturas em 320, 390 e 1280 px |
| `npm run assets:check` | Arquivos de `assets/avatars/` válidos e registro em dia |

`test:db` e `test:e2e` precisam do Postgres 16 instalado localmente (`/usr/lib/postgresql/16/bin`).
`test:e2e` também precisa do Playwright com Chromium disponível
(`NODE_PATH=$(npm root -g) npm run test:e2e` se ele estiver instalado globalmente).

Como não há Docker neste ambiente, os testes usam `supabase/tests/00_supabase_shim.sql`
(papéis `anon`/`authenticated`, `auth.uid()` e privilégios padrão do Supabase) e, no e2e,
`e2e/fake-supabase.mjs`, que imita **apenas as rotas HTTP** de Auth/PostgREST usadas pelo app
e executa as consultas e funções **reais** das migrações como papel `authenticated`.
Ambos são somente para teste. **Ainda não houve execução contra um projeto Supabase real.**

### Validar num projeto Supabase real (pendente)

1. Aplique todas as migrações (acima) num projeto de teste.
2. Crie dois usuários pelo app e conclua o onboarding com os dois.
3. No SQL Editor (como `postgres`), simule leitura **só no projeto de teste**:
   `select private.record_event('<id do usuário>', 'CHAPTER_COMPLETED', 'chapter:GEN.37', '{"book":"GEN","chapter":37}');`
4. No app, confira a Túnica de José como obtida no guarda-roupa e equipe.
5. Para testar Premium: `insert into public.user_entitlements (user_id, plan, status, current_period_end)
   values ('<id>', 'premium', 'active', now() + interval '30 days');` e crie mais de 3 visuais.
6. Confira com o segundo usuário que o perfil só aparece quando o primeiro o torna público.

## Estrutura

```text
app/                       rotas (Expo Router)
  welcome, auth/, try      públicas (sem sessão)
  onboarding/              identity → avatar → pace
  (tabs)/                  home, journey, read, friends, profile
  avatar/editor            aparência com Salvar/Descartar
  avatar/wardrobe          guarda-roupa
  avatar/item/[id]         detalhe do item
  avatar/collections       coleções
  avatar/loadouts          visuais salvos
  users/[username]         perfil público
  settings/pace            alterar meta
src/
  features/avatar/
    catalog/catalog.json      fonte única de IDs, visuais sugeridos e regras de desbloqueio
    domain/                   tipos, regras, camadas (funções puras, testadas)
    art/                      manifest versionado, geometria, artes placeholder
    components/               AvatarRenderer, AvatarStage, AppearanceOptionPicker…
    screens/                  CharacterCreatorScreen (onboarding, experimentar, edição)
    services/                 chamadas ao Supabase (avatar, guarda-roupa) e rascunho local
    state/                    store draft/saved do criador (applyPreview, save, discard)
    domain/wardrobe.ts        inventário, filtros, variantes e estado do guarda-roupa
  features/auth, profile, onboarding
  i18n/pt-BR.ts              todos os textos da interface
  theme/                     tokens claro/escuro
  ui/                        componentes base reutilizáveis
supabase/migrations/       SQL versionado
supabase/tests/            testes de banco
e2e/                       teste ponta a ponta
assets/avatars/            ilustrações finais (vazio até a arte ser produzida)
supabase/rollbacks/        reversões manuais
scripts/generate-catalog-sql.mjs
scripts/avatar-assets.mjs  validador/registro das ilustrações
```

## Segurança

- RLS em todas as tabelas. O cliente só **lê** os próprios dados e o catálogo.
- Nenhuma escrita direta do cliente: `claim_profile`, `save_avatar` e `set_reading_preferences`
  são funções `SECURITY DEFINER` que usam `auth.uid()` e validam tudo no servidor.
- `user_items` só é preenchida pelo servidor (itens iniciais via regras `starter`, idempotente).
- Gatilhos garantem integridade mesmo para escritas privilegiadas (item precisa ser do slot e do dono; aparência precisa ser válida).
- Perfis nascem privados; nada é exposto publicamente neste marco.

## Arte

Especificação completa em [`docs/ARTE.md`](docs/ARTE.md): canvas 1024×1536, âncoras por corpo,
ordem de camadas, nomes de arquivo, tingimento de pele/cabelo e lista de assets finais.

- `art/manifest.ts` declara em quais camadas cada aparência/item desenha. Opções do catálogo sem
  arte na versão atual ficam ocultas no criador (o banco continua aceitando e a posse é mantida).
- `art/registry.tsx` liga cada chave a uma arte vetorial ou a um PNG/WebP (`kind: 'image'`).
- Avatares salvos com opções ainda não ilustradas usam a arte padrão da categoria.
- `/dev/avatar-lab`: ferramenta interna com grade de variações e guias de ancoragem
  (só em desenvolvimento ou com `EXPO_PUBLIC_AVATAR_LAB=1`; não faz parte da experiência).

## Catálogo

Edite `src/features/avatar/catalog/catalog.json` e rode `npm run catalog:sql`. Cada `version` do
catálogo gera uma migração **nova** (`…_avatar_catalog_vN.sql`; defina o prefixo em
`scripts/generate-catalog-sql.mjs`). Migrações antigas nunca são editadas. Um teste falha se o JSON
e a migração da versão atual divergirem.
