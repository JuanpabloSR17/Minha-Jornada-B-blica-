# Jornada Bíblica

App de leitura bíblica gamificada com personagens 2D ilustrados.
Este repositório contém o **Marco 1 — Fundação funcional** do módulo de personagens
(ver [`docs/PLANO.md`](docs/PLANO.md)).

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
   - pelo SQL Editor, colando os arquivos em ordem de nome (`20261111…` e depois `20261112…`).
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
| `npm test` | 38 testes de domínio: catálogo, conjunto de validação da arte, visuais sugeridos, aleatório, ordem de camadas, fallback de asset, store de edição, sincronia catálogo ↔ SQL |
| `npm run test:db` | 70 verificações num Postgres 16 descartável: RLS, privilégios, RPCs, posse/slot, versão, idempotência, concorrência e item bíblico bloqueado |
| `npm run test:e2e` | Fluxo completo no navegador (cadastro → identidade → 4 etapas → prévia bloqueada da Túnica de José → ritmo → reabrir → outro aparelho → editar/descartar/salvar → conflito → username duplicado) |

`test:db` e `test:e2e` precisam do Postgres 16 instalado localmente (`/usr/lib/postgresql/16/bin`).
`test:e2e` também precisa do Playwright com Chromium disponível
(`NODE_PATH=$(npm root -g) npm run test:e2e` se ele estiver instalado globalmente).

Como não há Docker neste ambiente, os testes usam `supabase/tests/00_supabase_shim.sql`
(papéis `anon`/`authenticated`, `auth.uid()` e privilégios padrão do Supabase) e, no e2e,
`e2e/fake-supabase.mjs`, que imita **apenas as rotas HTTP** de Auth/PostgREST usadas pelo app
e executa as consultas e funções **reais** das migrações como papel `authenticated`.
Ambos são somente para teste. Ainda não houve execução contra um projeto Supabase real.

## Estrutura

```text
app/                       rotas (Expo Router)
  welcome, auth/, try      públicas (sem sessão)
  onboarding/              identity → avatar → pace
  (tabs)/                  home, journey, read, friends, profile
  avatar/editor            editor com Salvar/Descartar
  settings/pace            alterar meta
src/
  features/avatar/
    catalog/catalog.json      fonte única de IDs, visuais sugeridos e regras de desbloqueio
    domain/                   tipos, regras, camadas (funções puras, testadas)
    art/                      manifest versionado, geometria, artes placeholder
    components/               AvatarRenderer, AvatarStage, AppearanceOptionPicker…
    screens/                  CharacterCreatorScreen (onboarding, experimentar, edição)
    services/                 chamadas ao Supabase e rascunho local
    state/                    store draft/saved (applyPreview, save, discard)
  features/auth, profile, onboarding
  i18n/pt-BR.ts              todos os textos da interface
  theme/                     tokens claro/escuro
  ui/                        componentes base reutilizáveis
supabase/migrations/       SQL versionado
supabase/tests/            testes de banco
e2e/                       teste ponta a ponta
scripts/generate-catalog-sql.mjs
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
