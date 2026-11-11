#!/usr/bin/env bash
# Sobe um Postgres 16 descartável, aplica o shim do Supabase + migrações e roda os testes SQL.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
WORK="$(mktemp -d)"
PORT="${PGPORT_TEST:-54329}"
cleanup() { "$PGBIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT

RUNAS=()
if [ "$(id -u)" = "0" ]; then
  chown -R postgres "$WORK" 2>/dev/null || true
  chmod 755 "$WORK"
  RUNAS=(runuser -u postgres --)
fi

"${RUNAS[@]}" "$PGBIN/initdb" -D "$WORK/data" -U postgres --auth=trust -E UTF8 >/dev/null
"${RUNAS[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -o "-p $PORT -k $WORK -c listen_addresses=''" -l "$WORK/log" -w start >/dev/null

PSQL=(psql -X -q -v ON_ERROR_STOP=1 -h "$WORK" -p "$PORT" -U postgres)
"${PSQL[@]}" -c "create database jb_test" postgres
"${PSQL[@]}" -d jb_test -f "$ROOT/supabase/tests/00_supabase_shim.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "→ migração $(basename "$f")"
  "${PSQL[@]}" -d jb_test -f "$f"
done
# Reaplicar a migração do catálogo precisa ser idempotente.
for f in "$ROOT"/supabase/migrations/*_avatar_catalog_v*.sql; do "${PSQL[@]}" -d jb_test -f "$f"; done

for t in "$ROOT"/supabase/tests/[1-9]*.sql; do
  echo "→ teste $(basename "$t")"
  "${PSQL[@]}" -d jb_test -o /dev/null -f "$t" 2>&1 | sed -e "s/^psql:[^ ]* NOTICE:  /  /"
done
echo "→ teste de concorrência (2 primeiros salvamentos simultâneos)"
"${PSQL[@]}" -d jb_test -c "insert into auth.users (id) values ('33333333-3333-3333-3333-333333333333');
  set role authenticated; select set_config('request.jwt.claim.sub','33333333-3333-3333-3333-333333333333',false);
  select public.claim_profile('concorrente','Concorrente');" >/dev/null
"${PSQL[@]}" -d jb_test -o /dev/null -f "$ROOT/supabase/tests/concurrency.sql" & P1=$!
"${PSQL[@]}" -d jb_test -o /dev/null -f "$ROOT/supabase/tests/concurrency.sql" & P2=$!
wait $P1; wait $P2
RESULT=$("${PSQL[@]}" -d jb_test -At -c "select (select count(*) from avatar_loadouts l join profiles p on p.id=l.user_id where p.username='concorrente') || ',' ||
  (select count(*) from avatar_appearances a join profiles p on p.id=a.user_id where p.username='concorrente') || ',' ||
  (select count(*) from user_items ui join profiles p on p.id=ui.user_id where p.username='concorrente') || ',' ||
  (select count(*) from cosmetic_items where is_starter and is_active)")
IFS=, read -r LOADOUTS APPS ITEMS STARTERS <<< "$RESULT"
if [ "$LOADOUTS" != "1" ] || [ "$APPS" != "1" ] || [ "$ITEMS" != "$STARTERS" ]; then
  echo "✘ concorrência: loadouts=$LOADOUTS aparências=$APPS itens=$ITEMS (esperado 1,1,$STARTERS)"; exit 1
fi
echo "  ok  salvamentos simultâneos geram 1 visual, 1 aparência e itens sem duplicar"
echo "✔ Todos os testes de banco passaram."
