# Validação no Supabase de testes

## Ambiente usado nesta validação

- **Não havia projeto Supabase hospedado configurado** neste ambiente: nenhuma URL, chave pública ou
  conexão de banco, e a rede não libera hosts `*.supabase.co`.
- A validação rodou num **Supabase de testes local, oficial**, pela CLI (`supabase@3.1.0`) em Docker:
  imagem `supabase/postgres:17.11.0.018` (PostgreSQL 17.11), Auth (GoTrue), PostgREST e Kong — os
  mesmos componentes do Supabase hospedado, com RLS, papéis `anon`/`authenticated` e privilégios
  padrão reais. Configuração: `supabase/config.toml` (projeto `jornada-biblica-testes`; Studio,
  Storage, Realtime, e-mail e funções desligados; cadastro sem confirmação de e-mail).
- Antes disso, os testes de banco usavam um Postgres 16 com uma imitação do Supabase
  (`supabase/tests/00_supabase_shim.sql`); essa bateria continua em `npm run test:db`.

## Roteiro reproduzível

```bash
# requisitos: Docker em execução, Node, Playwright + Chromium
NODE_PATH=$(npm root -g) bash e2e/supabase-real/run.sh
```

| Fase | O que faz | Arquivo |
|---|---|---|
| 1 | Recria o ambiente **só com as migrações anteriores ao Mercado** (o Mercado e as seguintes, como o catálogo v7, ficam para a fase 2), cria duas contas comuns pela API de Auth (cadastro, identidade, personagem e meta 1 pelo app) e registra metas de dias anteriores pelo caminho do servidor com **datas controladas** (`private.complete_reading_mission_at`, 09:00 de São Paulo de cada dia); Ana resgata uma escolha gratuita | `seed-pre-market.cjs` |
| 2 | Aplica o Mercado e as migrações seguintes, na ordem (`supabase migration up`), confere que todas as migrações do repositório estão registradas, que o banco está no mesmo catálogo do app (v7, 14 missões) e que saldos, itens e metas foram preservados | `verify-upgrade.cjs` |
| 3 | Conta comum: operações autorizadas; escrita direta bloqueada (saldo, posse, compras, metas, XP, preços, regras); isolamento entre contas; visitante sem login | `permissions.cjs` |
| 4 | App web apontando para este Supabase: meta do dia pela tela, escolha gratuita, compra, saldo, guarda-roupa, resposta perdida, duas compras disputando o saldo em dois aparelhos, a missão de Êxodo 28 com o Peitoral já obtido e o marco de Êxodo 25 com a Mesa já obtida (resposta perdida e reenvio) — interface + banco | `flow.cjs` |
| 5 | Bateria SQL do repositório (`supabase/tests/10`–`70`) num banco recriado com todas as 15 migrações | `run.sh` |

## Resultado — catálogo v8 (última execução completa, 18 migrações)

| Cenário | Resultado |
|---|---|
| Migrações | ✔ 14 antes do Mercado; depois Mercado, v7, sessões com marco e v8 (18 registradas); banco no catálogo v8 com 14 missões e 20 marcos |
| Atualização, permissões, meta, compra, resposta perdida, saldo disputado, Êxodo 28 | ✔ iguais à execução v7 |
| Marco de Êxodo 25 com a Mesa já obtida | ✔ escolhido na aba Ler; resposta perdida; vínculo mostrado ao reabrir; reenvio concede só Arca e Candelabro (1 sessão vinculada, 1 marco, 2 recompensas); Santuário 3 de 13 |
| Bateria SQL no Postgres do Supabase | ✔ 449 verificações (10–90) |

## Resultado — catálogo v7 (16 migrações)

| Cenário | Resultado |
|---|---|
| Migrações | ✔ 14 antes do Mercado; depois Mercado e catálogo v7 sobre os dados (16 registradas, iguais às do repositório); banco no catálogo v7 com 14 missões |
| Atualização com saldo e itens | ✔ Ana 240 / 6 metas / 36 itens e Bia 120 preservados; vitrine com 25 itens |
| Permissões e isolamento | ✔ iguais à execução anterior (13 escritas diretas bloqueadas, nenhuma leitura entre contas, visitante sem acesso) |
| Meta, compra, inventário, resposta perdida, saldo disputado | ✔ iguais à execução anterior |
| Êxodo 28 com o Peitoral já obtido | ✔ tela mostra só Estola e Turbante; banco: 1 sessão, 1 missão, 2 recompensas, 40 XP; resposta perdida + reenvio sem duplicar |
| Bateria SQL no Postgres do Supabase | ✔ 422 verificações (10–80) |

## Resultado da execução anterior (catálogo v6, commit f6cca4d)

| Cenário | Resultado |
|---|---|
| Migrações na ordem do repositório (15) | ✔ aplicadas no Postgres 17 do Supabase |
| Atualização a partir da versão anterior ao Mercado, com saldo e itens | ✔ Ana 240 Siclos / 6 metas / 36 itens e Bia 120 Siclos preservados; vitrine com 25 itens |
| Meta diária pelo app | ✔ Gênesis 7 → +40 Siclos (240 → 280), +20 XP, escolha gratuita resgatada |
| Compra e inventário | ✔ Túnica de Linho Cru por 80 → saldo 200 na tela e no banco; "Obtido" no guarda-roupa |
| Resposta perdida | ✔ 1 compra e 1 débito; pendência sobrevive a reabrir o app; "Verificar compra" recupera |
| Duas compras disputando o saldo (2 aparelhos, 120 Siclos, dois itens de 120) | ✔ uma comprou, a outra recebeu "saldo insuficiente"; saldo final 0 |
| Escrita direta pela conta comum (13 tentativas) | ✔ todas bloqueadas; banco inalterado |
| Isolamento entre contas | ✔ nenhuma leitura de dados da outra conta; compra e escolha alheias recusadas |
| Visitante sem login | ✔ não executa nenhuma função nem lê saldos |
| Auditoria de privilégios | ✔ `anon` sem nenhuma função; `private` inacessível; nenhuma tabela com escrita direta; todas com RLS; 26 RPCs do app para `authenticated` |
| Bateria SQL no Postgres do Supabase | ✔ 395 verificações (10–70) |

### Divergências encontradas e corrigidas

1. **Diálogo de compra mostrava saldo negativo ao fechar** (interface).
   Reproduzir: duas sessões da mesma conta com 120 Siclos confirmam ao mesmo tempo dois itens de 120;
   durante a animação de fechar, o diálogo recalculava com o saldo novo ("Saldo: 0 → -120 Siclos").
   Nenhum saldo negativo era gravado. Correção: o diálogo guarda o saldo do momento em que foi aberto
   (`MarketScreen.tsx`); o roteiro agora verifica que nenhum valor negativo aparece. Reexecutado: ✔.
2. **Teste 10 assumia banco vazio** (`posse mantida quando item é desativado` contava a posse de
   todos os jogadores). Falhava num Supabase de testes com outras contas. Correção: conta só a conta
   do teste. Reexecutado: ✔.
3. **Conflito de porta**: `npm run test:e2e` usa a porta 54321, a mesma do Supabase local. O
   `e2e/run.sh` agora para com uma mensagem clara (`npx supabase stop`) em vez de falhar adiante.

## Para rodar num projeto Supabase hospedado de testes (o que falta configurar)

1. **Projeto de testes** dedicado à Jornada Bíblica (nunca produção) e seu `project-ref`.
2. **Rede do ambiente**: liberar `api.supabase.com` e `<ref>.supabase.co`; para o banco,
   `db.<ref>.supabase.co` (ou o pooler `aws-0-<região>.pooler.supabase.com`) na porta 5432/6543.
3. **Credenciais** (como segredos do ambiente, nunca no repositório):
   - `SUPABASE_ACCESS_TOKEN` (CLI) e a senha do banco, para `supabase link` e `supabase db push`;
   - `SUPABASE_URL` e `SUPABASE_ANON_KEY` (chave pública) para o app e os scripts;
   - `DB_URL` (conexão Postgres do projeto de testes) para as datas controladas e as conferências.
4. **Auth**: desligar "Confirm email" no projeto de testes (ou usar contas já confirmadas).
5. Comandos:
   ```bash
   npx supabase link --project-ref <ref>
   # atualização a partir da versão anterior ao Mercado: aplique até 20261118000100, rode a fase 1,
   # e só então aplique o Mercado
   npx supabase db push            # aplica as migrações pendentes, na ordem do repositório
   export SUPABASE_URL=... SUPABASE_ANON_KEY=... DB_URL=... STATE_FILE=/tmp/jb-state.json
   node e2e/supabase-real/seed-pre-market.cjs   # antes do Mercado
   npx supabase db push                          # aplica o Mercado
   node e2e/supabase-real/verify-upgrade.cjs
   node e2e/supabase-real/permissions.cjs
   EXPO_PUBLIC_SUPABASE_URL=$SUPABASE_URL EXPO_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY npx expo export -p web --output-dir /tmp/jb-web
   node e2e/static-server.mjs /tmp/jb-web 8081 & NODE_PATH=$(npm root -g) node e2e/supabase-real/flow.cjs
   ```
   A fase 5 (bateria SQL) cria e altera dados de teste; rode-a só num projeto que possa ser recriado.
