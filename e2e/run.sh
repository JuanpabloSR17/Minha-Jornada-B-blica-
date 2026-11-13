#!/usr/bin/env bash
# Teste ponta a ponta do Marco 1 contra o banco real (Postgres local + migrações)
# usando e2e/fake-supabase.mjs no lugar do gateway HTTP do Supabase.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
WORK="$(mktemp -d)"
export PGPORT="${PGPORT_TEST:-54330}" PGHOST="$WORK" PGDATABASE=jb_test
export SHOTS_DIR="${SHOTS_DIR:-$ROOT/e2e/screenshots}"
PIDS=()
cleanup() {
  for p in "${PIDS[@]:-}"; do kill "$p" 2>/dev/null || true; done
  "${RUNAS[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true
}
trap cleanup EXIT
RUNAS=()
if [ "$(id -u)" = "0" ]; then chown -R postgres "$WORK"; chmod 755 "$WORK"; RUNAS=(runuser -u postgres --); fi

"${RUNAS[@]}" "$PGBIN/initdb" -D "$WORK/data" -U postgres --auth=trust -E UTF8 >/dev/null
"${RUNAS[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -o "-p $PGPORT -k $WORK -c listen_addresses=''" -l "$WORK/log" -w start >/dev/null
PSQL=(psql -X -q -v ON_ERROR_STOP=1 -h "$WORK" -p "$PGPORT" -U postgres)
"${PSQL[@]}" -c "create database jb_test" postgres
"${PSQL[@]}" -d jb_test -f "$ROOT/supabase/tests/00_supabase_shim.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do "${PSQL[@]}" -d jb_test -f "$f"; done

# a porta 54321 também é a do Supabase local (npx supabase start): os dois não podem rodar juntos
if (exec 3<>/dev/tcp/127.0.0.1/54321) 2>/dev/null; then
  echo "✘ a porta 54321 já está em uso (Supabase local ligado?). Rode: npx supabase stop"; exit 1
fi
node "$ROOT/e2e/fake-supabase.mjs" & PIDS+=($!)

echo "→ build web apontando para o fake-supabase"
( cd "$ROOT" && EXPO_OFFLINE=1 CI=1 EXPO_PUBLIC_AVATAR_LAB=1 \
  EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321 \
  EXPO_PUBLIC_SUPABASE_ANON_KEY=chave-publica-de-teste-local-0000000000 \
  npx expo export -p web --output-dir "$WORK/dist" --clear >/dev/null )
node "$ROOT/e2e/static-server.mjs" "$WORK/dist" 8081 & PIDS+=($!)
sleep 1
mkdir -p "$SHOTS_DIR"
node "$ROOT/e2e/${FLOW:-marco1}.flow.cjs"
