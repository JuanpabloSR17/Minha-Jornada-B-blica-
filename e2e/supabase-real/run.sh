#!/usr/bin/env bash
# Validação do percurso leitura → meta diária → compra → inventário num Supabase REAL de testes,
# rodando localmente pela CLI oficial (Postgres do Supabase, Auth/GoTrue, PostgREST e Kong em Docker).
# Fases:
#   1. ambiente limpo com as migrações ANTERIORES ao Mercado + dados reais (contas, metas, escolha)
#   2. aplica o Mercado e as migrações seguintes (ex.: catálogo v7), na ordem, sobre esses dados
#   3. permissões: operações autorizadas, escrita direta bloqueada, isolamento entre contas
#   4. navegador: meta do dia, escolha gratuita, compra, inventário, resposta perdida e saldo disputado
#   5. bateria SQL do repositório (10–70) num banco recém-recriado com todas as migrações
# Requisitos: Docker em execução, Node, Playwright + Chromium (NODE_PATH=$(npm root -g)).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HERE="$ROOT/e2e/supabase-real"
WORK="$(mktemp -d)"
MARKET=20261119000100_travelers_market.sql
# o Mercado e tudo o que vem depois dele ficam para a fase 2 (aplicados na ordem do repositório)
LATER=()
for f in "$ROOT"/supabase/migrations/*.sql; do
  b=$(basename "$f"); [[ "$b" > "$MARKET" || "$b" == "$MARKET" ]] && LATER+=("$b")
done
export SHOTS_DIR="${SHOTS_DIR:-$ROOT/e2e/screenshots}"
mkdir -p "$SHOTS_DIR"
SB=(npx --yes supabase@3.1.0)
SERVER=""
restore() {
  for b in "${LATER[@]}"; do [ -f "$WORK/$b" ] && mv "$WORK/$b" "$ROOT/supabase/migrations/"; done
  [ -n "$SERVER" ] && kill "$SERVER" 2>/dev/null || true
}
trap restore EXIT
cd "$ROOT"

echo "→ 1. Supabase local limpo, sem o Mercado e as migrações seguintes: ${LATER[*]}"
"${SB[@]}" stop --no-backup >/dev/null 2>&1 || true
for b in "${LATER[@]}"; do mv "supabase/migrations/$b" "$WORK/"; done
"${SB[@]}" start >/dev/null
"${SB[@]}" status -o json 2>/dev/null > "$WORK/status.json"
export SUPABASE_URL="$(node -e "console.log(require('$WORK/status.json').API_URL)")"
export SUPABASE_ANON_KEY="$(node -e "console.log(require('$WORK/status.json').ANON_KEY)")"
export DB_URL="$(node -e "console.log(require('$WORK/status.json').DB_URL)")"
export STATE_FILE="$WORK/state.json"
node "$HERE/seed-pre-market.cjs"

echo "→ 2. Mercado e migrações seguintes sobre os dados existentes"
for b in "${LATER[@]}"; do mv "$WORK/$b" "supabase/migrations/"; done
"${SB[@]}" migration up >/dev/null
node "$HERE/verify-upgrade.cjs"

echo "→ 3. permissões"
node "$HERE/permissions.cjs"

echo "→ 4. navegador (app web apontando para este Supabase)"
EXPO_OFFLINE=1 CI=1 EXPO_PUBLIC_SUPABASE_URL="$SUPABASE_URL" EXPO_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  npx expo export -p web --output-dir "$WORK/dist" --clear >/dev/null
node "$ROOT/e2e/static-server.mjs" "$WORK/dist" 8081 & SERVER=$!
sleep 1
node "$HERE/flow.cjs"

echo "→ 5. bateria SQL do repositório num banco recriado (todas as migrações)"
"${SB[@]}" db reset >/dev/null
DB_CONTAINER="supabase_db_$(sed -n 's/^project_id = "\(.*\)"/\1/p' supabase/config.toml)"
OKS=0
for t in supabase/tests/[1-9]*.sql; do
  OUT=$(docker exec -i "$DB_CONTAINER" psql -U postgres -X -q -v ON_ERROR_STOP=1 -o /dev/null < "$t" 2>&1) || { echo "$OUT" | grep -v NOTICE; echo "✘ $(basename "$t")"; exit 1; }
  N=$(echo "$OUT" | grep -c "ok " || true)
  OKS=$((OKS + N))
  echo "  ✔ $(basename "$t"): $N verificações"
done
echo "  ✔ bateria SQL no Postgres do Supabase: $OKS verificações"
echo "✔ Validação no Supabase de testes concluída."
