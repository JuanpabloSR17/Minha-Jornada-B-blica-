# Jornada Bíblica

App de leitura bíblica gamificada com personagens 2D ilustrados.
Este repositório contém o **Marco 1 — Fundação funcional** do módulo de personagens
(ver [`docs/PLANO.md`](docs/PLANO.md)).

**Stack:** Expo SDK 58 · React Native 0.88 · TypeScript · Expo Router · Supabase (Auth + PostgreSQL com RLS) · `react-native-svg`.

## O que já funciona

- Cadastro e login com e-mail/senha, recuperação de senha por link, sessão persistida.
- Onboarding: **Identidade** (nome + username único, perfil privado) → **Criador de personagem em 4 etapas** (Corpo → Rosto → Cabelo → Visual) → **Ritmo de leitura** (1/2/3/5/personalizado/sem meta).
- Avatar 2D renderizado **por camadas** num canvas lógico 720×1080, com prévia ao vivo e miniaturas de cada opção.
- Persistência no Supabase via funções de servidor que validam opções, posse de itens e slots; itens iniciais são concedidos pelo servidor.
- Editor do perfil com **Salvar/Descartar**, controle de versão entre aparelhos (conflito detectado, nada sobrescrito).
- Modo **Experimentar** sem conta (salvo só no aparelho) que é aproveitado ao criar a conta.
- Tema claro/escuro, layout mobile-first que se adapta a tablet/desktop, rótulos de acessibilidade.

Telas ainda não implementadas (Jornada, Ler, Amigos, missões/XP, inventário, conquistas)
aparecem **sinalizadas como "Em construção"** — nada nelas é contabilizado.

> A arte do personagem é **provisória**: placeholders vetoriais próprios e consistentes,
> desenhados em código. As ilustrações finais entram registrando PNG/WebP no manifest,
> sem mudar o renderizador (ver "Arte" abaixo).

## Configuração

### 1. Dependências

```bash
npm install
```

### 2. Projeto Supabase

1. Crie um projeto em supabase.com.
2. Aplique as migrações de `supabase/migrations/` **em ordem**:
   - com a CLI: `supabase link --project-ref <ref>` e `supabase db push`; ou
   - pelo SQL Editor, colando `20261111000100_marco1_core.sql` e depois `20261111000200_avatar_catalog_v1.sql`.
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
| `npm test` | 34 testes de domínio: catálogo, validação, aleatório, ordem de camadas, fallback de asset, store de edição, sincronia catálogo ↔ SQL |
| `npm run test:db` | 65 verificações num Postgres 16 descartável: RLS, privilégios, RPCs, posse/slot, versão, idempotência e concorrência |
| `npm run test:e2e` | Fluxo completo no navegador (cadastro → identidade → 4 etapas → ritmo → reabrir → outro aparelho → editar/descartar/salvar → conflito → username duplicado) |

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
    catalog/catalog.v1.json   fonte única de IDs (gera a migração do catálogo)
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

- `src/features/avatar/art/manifest.ts` declara, para cada aparência/item, em quais camadas desenha.
- `LAYER_ORDER` define a ordem: fundo → sombra → manto traseiro → cabelo traseiro → corpo → rosto →
  calçados → túnica → cinto → braços → mangas → manto dianteiro → pescoço → barba → boca →
  cabelo frontal → cabeça → item na mão → moldura.
- Para trocar uma peça pela ilustração final: exporte PNG/WebP transparente 720×1080 alinhado ao
  canvas e registre a chave em `art/registry.tsx` como `{ kind: 'image', source: require(...) }`
  (com `perBody: true` para versões por modelo de corpo).
- Itens sem asset publicado ou incompatíveis com o corpo usam arte substituta, sem perder a posse.

## Catálogo

Edite `src/features/avatar/catalog/catalog.v1.json` e rode `npm run catalog:sql` para regenerar
`supabase/migrations/20261111000200_avatar_catalog_v1.sql`. Um teste falha se os dois divergirem.
Para um catálogo já publicado em produção, crie uma **nova** migração em vez de editar a antiga.
