#!/usr/bin/env bash
# Validação num projeto Supabase HOSPEDADO de testes da Jornada Bíblica (nunca produção).
# Aplica as migrações pendentes na ordem do repositório e roda, com contas comuns, as fases
# de verificação, permissões e o percurso no navegador. Não roda a bateria SQL (ela altera dados).
#
# Variáveis obrigatórias (segredos do ambiente, nunca no repositório):
#   JB_TEST_PROJECT=1          confirmação explícita de que o projeto é de testes
#   SUPABASE_PROJECT_REF       ref do projeto de testes
#   SUPABASE_ACCESS_TOKEN      token da CLI (supabase link / db push)
#   SUPABASE_DB_PASSWORD       senha do banco do projeto de testes
#   SUPABASE_URL               https://<ref>.supabase.co
#   SUPABASE_ANON_KEY          chave pública
#   DB_URL                     conexão Postgres do projeto de testes (datas controladas e conferências)
# Requisitos do projeto: "Confirm email" desligado; rede liberando api.supabase.com,
# <ref>.supabase.co e o host do banco (5432/6543); Docker não é necessário.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HERE="$ROOT/e2e/supabase-real"
MISSING=()
for v in JB_TEST_PROJECT SUPABASE_PROJECT_REF SUPABASE_ACCESS_TOKEN SUPABASE_DB_PASSWORD SUPABASE_URL SUPABASE_ANON_KEY DB_URL; do
  [ -n "${!v:-}" ] || MISSING+=("$v")
done
if [ ${#MISSING[@]} -gt 0 ]; then echo "✘ faltam variáveis: ${MISSING[*]} (ver docs/VALIDACAO-SUPABASE.md)"; exit 2; fi
[ "$JB_TEST_PROJECT" = "1" ] || { echo "✘ JB_TEST_PROJECT=1 é obrigatório (projeto de testes)"; exit 2; }
SB=(npx --yes supabase@3.1.0)
WORK="$(mktemp -d)"; SERVER=""
trap '[ -n "$SERVER" ] && kill "$SERVER" 2>/dev/null || true' EXIT
cd "$ROOT"

echo "→ 1. migrações pendentes, na ordem do repositório"
"${SB[@]}" link --project-ref "$SUPABASE_PROJECT_REF" -p "$SUPABASE_DB_PASSWORD" >/dev/null
"${SB[@]}" migration list
"${SB[@]}" db push --password "$SUPABASE_DB_PASSWORD"

echo "→ 2. contas comuns, metas com datas controladas e conferência do catálogo"
export STATE_FILE="$WORK/state.json" PRE_MARKET=0
node "$HERE/seed-pre-market.cjs"
node "$HERE/verify-upgrade.cjs"

echo "→ 3. permissões"
node "$HERE/permissions.cjs"

echo "→ 4. navegador (app web apontando para o projeto de testes)"
EXPO_OFFLINE=1 CI=1 EXPO_PUBLIC_SUPABASE_URL="$SUPABASE_URL" EXPO_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  npx expo export -p web --output-dir "$WORK/dist" --clear >/dev/null
node "$ROOT/e2e/static-server.mjs" "$WORK/dist" 8081 & SERVER=$!
sleep 1
node "$HERE/flow.cjs"
echo "✔ Validação no projeto hospedado de testes concluída."
