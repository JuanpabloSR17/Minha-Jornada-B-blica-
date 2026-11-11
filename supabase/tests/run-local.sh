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
# Reaplicar a migração mais recente do catálogo precisa ser idempotente
# (migrações antigas nunca são reaplicadas depois das novas em produção).
LATEST_CATALOG="$(ls "$ROOT"/supabase/migrations/*_avatar_catalog_v*.sql | sort | tail -1)"
"${PSQL[@]}" -d jb_test -o /dev/null -f "$LATEST_CATALOG"

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
echo "→ concorrência no motor de recompensas (mesmo capítulo em paralelo)"
"${PSQL[@]}" -d jb_test -c "insert into auth.users (id) values ('a7777777-0000-0000-0000-000000000007');
  insert into public.profiles (id, username, display_name) values ('a7777777-0000-0000-0000-000000000007', 'paralelo', 'Paralelo');" >/dev/null
"${PSQL[@]}" -d jb_test -o /dev/null -f "$ROOT/supabase/tests/concurrency_rewards.sql" & P1=$!
"${PSQL[@]}" -d jb_test -o /dev/null -f "$ROOT/supabase/tests/concurrency_rewards.sql" & P2=$!
wait $P1; wait $P2
R=$("${PSQL[@]}" -d jb_test -At -c "select (select count(*) from private.domain_events where user_id='a7777777-0000-0000-0000-000000000007') || ',' ||
  (select count(*) from public.reward_events where user_id='a7777777-0000-0000-0000-000000000007') || ',' ||
  (select count(*) from public.user_items where user_id='a7777777-0000-0000-0000-000000000007')")
if [ "$R" != "1,1,1" ]; then echo "✘ concorrência de recompensas: eventos,recompensas,itens=$R (esperado 1,1,1)"; exit 1; fi
echo "  ok  requisições simultâneas do mesmo capítulo geram 1 evento, 1 recompensa e 1 item"

echo "→ concorrência no Modo Missão (mesma finalização em paralelo e duas sessões do mesmo capítulo)"
"${PSQL[@]}" -d jb_test -c "insert into auth.users (id) values ('c3333333-0000-0000-0000-000000000003');
  insert into public.profiles (id, username, display_name) values ('c3333333-0000-0000-0000-000000000003', 'missao_paralela', 'Paralela');" >/dev/null
SID=11111111-aaaa-4aaa-8aaa-111111111111
"${PSQL[@]}" -d jb_test -o /dev/null -v sid=$SID -f "$ROOT/supabase/tests/concurrency_missions.sql" & P1=$!
"${PSQL[@]}" -d jb_test -o /dev/null -v sid=$SID -f "$ROOT/supabase/tests/concurrency_missions.sql" & P2=$!
"${PSQL[@]}" -d jb_test -o /dev/null -v sid=22222222-bbbb-4bbb-8bbb-222222222222 -f "$ROOT/supabase/tests/concurrency_missions.sql" & P3=$!
wait $P1; wait $P2; wait $P3
R=$("${PSQL[@]}" -d jb_test -At -c "select (select count(*) from public.reading_sessions where user_id='c3333333-0000-0000-0000-000000000003') || ',' ||
  (select count(*) from public.reading_sessions where user_id='c3333333-0000-0000-0000-000000000003' and not is_reread) || ',' ||
  (select count(*) from public.xp_ledger where user_id='c3333333-0000-0000-0000-000000000003') || ',' ||
  (select count(*) from public.user_items where user_id='c3333333-0000-0000-0000-000000000003' and item_id = 'tunic-joseph')")
if [ "$R" != "2,1,1,1" ]; then echo "✘ concorrência do Modo Missão: sessões,inéditas,xp,itens=$R (esperado 2,1,1,1)"; exit 1; fi
echo "  ok  finalizações simultâneas: 1 capítulo inédito, 1 XP e 1 item; a outra sessão vira releitura"

echo "→ concorrência na meta diária (dois capítulos inéditos ao mesmo tempo; dois resgates ao mesmo tempo)"
"${PSQL[@]}" -d jb_test -c "insert into auth.users (id) values ('e5555555-0000-0000-0000-000000000005');
  insert into public.profiles (id, username, display_name) values ('e5555555-0000-0000-0000-000000000005', 'meta_paralela', 'Paralela');" >/dev/null
"${PSQL[@]}" -d jb_test -o /dev/null -v sid=aaaaaaaa-0000-4000-8000-000000000001 -v ch=1 -f "$ROOT/supabase/tests/concurrency_goal.sql" & P1=$!
"${PSQL[@]}" -d jb_test -o /dev/null -v sid=aaaaaaaa-0000-4000-8000-000000000002 -v ch=2 -f "$ROOT/supabase/tests/concurrency_goal.sql" & P2=$!
"${PSQL[@]}" -d jb_test -o /dev/null -v sid=aaaaaaaa-0000-4000-8000-000000000003 -v ch=3 -f "$ROOT/supabase/tests/concurrency_goal.sql" & P3=$!
wait $P1; wait $P2; wait $P3
R=$("${PSQL[@]}" -d jb_test -At -c "select (select count(*) from public.daily_goals where user_id='e5555555-0000-0000-0000-000000000005') || ',' ||
  (select coalesce(sum(amount),0) from public.siclos_ledger where user_id='e5555555-0000-0000-0000-000000000005') || ',' ||
  (select count(*) from public.reading_sessions where user_id='e5555555-0000-0000-0000-000000000005' and (result -> 'dailyGoal' ->> 'achievedNow')::boolean)")
if [ "$R" != "1,40,1" ]; then echo "✘ concorrência da meta: metas,siclos,sessões que cumpriram=$R (esperado 1,40,1)"; exit 1; fi
OPTS=$("${PSQL[@]}" -d jb_test -At -c "select options[1] || ' ' || options[2] from public.daily_goals where user_id='e5555555-0000-0000-0000-000000000005'")
read -r O1 O2 <<< "$OPTS"
"${PSQL[@]}" -d jb_test -o /dev/null -v item=$O1 -f "$ROOT/supabase/tests/concurrency_claim.sql" 2>/dev/null & P1=$!
"${PSQL[@]}" -d jb_test -o /dev/null -v item=$O1 -f "$ROOT/supabase/tests/concurrency_claim.sql" 2>/dev/null & P2=$!
"${PSQL[@]}" -d jb_test -o /dev/null -v item=$O2 -f "$ROOT/supabase/tests/concurrency_claim.sql" 2>/dev/null & P3=$!
wait $P1; wait $P2; wait $P3
R=$("${PSQL[@]}" -d jb_test -At -c "select (select count(*) from public.user_items ui join public.daily_goals g on g.user_id = ui.user_id and ui.item_id = any (g.options)
    where ui.user_id='e5555555-0000-0000-0000-000000000005') || ',' ||
  (select count(*) from public.daily_goals where user_id='e5555555-0000-0000-0000-000000000005' and chosen_item is not null)")
if [ "$R" != "1,1" ]; then echo "✘ concorrência do resgate: itens,escolhas=$R (esperado 1,1)"; exit 1; fi
echo "  ok  finalizações simultâneas cumprem a meta uma vez (40 Siclos); resgates simultâneos concedem um único item"

echo "→ reversão manual do Marco 2 (banco até o catálogo v3) e reaplicação"
"${PSQL[@]}" -c "create database jb_rollback" postgres
"${PSQL[@]}" -d jb_rollback -f "$ROOT/supabase/tests/00_supabase_shim.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do
  case "$(basename "$f")" in 20261114*|20261115*|20261116*|20261117*) continue ;; esac
  "${PSQL[@]}" -d jb_rollback -f "$f"
done
"${PSQL[@]}" -d jb_rollback -f "$ROOT/supabase/rollbacks/20261113000100_marco2_wardrobe.down.sql"
LEFT=$("${PSQL[@]}" -d jb_rollback -At -c "select count(*) from pg_proc where proname in ('get_wardrobe','record_event') ")
ITEMS=$("${PSQL[@]}" -d jb_rollback -At -c "select count(*) from public.cosmetic_items")
if [ "$LEFT" != "0" ] || [ "$ITEMS" = "0" ]; then echo "✘ reversão: funções restantes=$LEFT itens=$ITEMS"; exit 1; fi
"${PSQL[@]}" -d jb_rollback -f "$ROOT/supabase/migrations/20261113000100_marco2_wardrobe.sql"
"${PSQL[@]}" -d jb_rollback -f "$ROOT/supabase/migrations/20261113000200_avatar_catalog_v3.sql"
echo "  ok  reversão do Marco 2 não apaga o catálogo, e a migração pode ser reaplicada"

echo "→ reversão manual das raridades (banco completo) e reaplicação"
"${PSQL[@]}" -c "create database jb_rollback2" postgres
"${PSQL[@]}" -d jb_rollback2 -f "$ROOT/supabase/tests/00_supabase_shim.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do
  case "$(basename "$f")" in 20261115*|20261116*|20261117*) continue ;; esac
  "${PSQL[@]}" -d jb_rollback2 -f "$f"
done
"${PSQL[@]}" -d jb_rollback2 -f "$ROOT/supabase/rollbacks/20261114000100_rarities_and_triggers.down.sql"
LEFT=$("${PSQL[@]}" -d jb_rollback2 -At -c "select count(*) from pg_tables where tablename = 'reward_triggers'")
ITEMS=$("${PSQL[@]}" -d jb_rollback2 -At -c "select count(*) from public.cosmetic_items")
if [ "$LEFT" != "0" ] || [ "$ITEMS" != "179" ]; then echo "✘ reversão das raridades: gatilhos=$LEFT itens=$ITEMS"; exit 1; fi
"${PSQL[@]}" -d jb_rollback2 -f "$ROOT/supabase/migrations/20261114000100_rarities_and_triggers.sql" 2>/dev/null
"${PSQL[@]}" -d jb_rollback2 -f "$ROOT/supabase/migrations/20261114000200_avatar_catalog_v4.sql"
echo "  ok  reversão das raridades mantém os 179 itens, e as migrações podem ser reaplicadas"

echo "→ reversão manual do catálogo oficial (banco completo) e reaplicação"
"${PSQL[@]}" -c "create database jb_rollback3" postgres
"${PSQL[@]}" -d jb_rollback3 -f "$ROOT/supabase/tests/00_supabase_shim.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do
  case "$(basename "$f")" in 20261116*|20261117*) continue ;; esac
  "${PSQL[@]}" -d jb_rollback3 -o /dev/null -f "$f"
done
BEFORE=$("${PSQL[@]}" -d jb_rollback3 -At -c "select count(*) from public.cosmetic_items")
"${PSQL[@]}" -d jb_rollback3 -f "$ROOT/supabase/rollbacks/20261115000100_official_catalog_support.down.sql"
LEFT=$("${PSQL[@]}" -d jb_rollback3 -At -c "select count(*) from pg_tables where tablename = 'cosmetic_item_aliases'")
ITEMS=$("${PSQL[@]}" -d jb_rollback3 -At -c "select count(*) from public.cosmetic_items")
if [ "$LEFT" != "0" ] || [ "$ITEMS" != "$BEFORE" ]; then echo "✘ reversão do catálogo oficial: aliases=$LEFT itens=$ITEMS (antes $BEFORE)"; exit 1; fi
"${PSQL[@]}" -d jb_rollback3 -o /dev/null -f "$ROOT/supabase/migrations/20261115000100_official_catalog_support.sql" 2>/dev/null
"${PSQL[@]}" -d jb_rollback3 -o /dev/null -f "$ROOT/supabase/migrations/20261115000200_avatar_catalog_v5.sql"
ALIASES=$("${PSQL[@]}" -d jb_rollback3 -At -c "select count(*) from public.cosmetic_item_aliases")
if [ "$ALIASES" = "0" ]; then echo "✘ reaplicação do catálogo oficial sem aliases"; exit 1; fi
echo "  ok  reversão do catálogo oficial mantém os $BEFORE itens, e as migrações podem ser reaplicadas"

echo "→ reversão manual do Modo Missão (banco completo) e reaplicação"
"${PSQL[@]}" -c "create database jb_rollback4" postgres
"${PSQL[@]}" -d jb_rollback4 -f "$ROOT/supabase/tests/00_supabase_shim.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do
  case "$(basename "$f")" in 20261117*) continue ;; esac
  "${PSQL[@]}" -d jb_rollback4 -o /dev/null -f "$f"
done
BEFORE=$("${PSQL[@]}" -d jb_rollback4 -At -c "select count(*) from public.cosmetic_items")
"${PSQL[@]}" -d jb_rollback4 -f "$ROOT/supabase/rollbacks/20261116000100_reading_missions.down.sql"
LEFT=$("${PSQL[@]}" -d jb_rollback4 -At -c "select count(*) from pg_proc where proname in ('complete_reading_mission','get_mission_overview')")
ITEMS=$("${PSQL[@]}" -d jb_rollback4 -At -c "select count(*) from public.cosmetic_items")
if [ "$LEFT" != "0" ] || [ "$ITEMS" != "$BEFORE" ]; then echo "✘ reversão do Modo Missão: funções=$LEFT itens=$ITEMS (antes $BEFORE)"; exit 1; fi
"${PSQL[@]}" -d jb_rollback4 -o /dev/null -f "$ROOT/supabase/migrations/20261116000100_reading_missions.sql"
"${PSQL[@]}" -d jb_rollback4 -o /dev/null -f "$ROOT/supabase/migrations/20261116000200_avatar_catalog_v6.sql"
M=$("${PSQL[@]}" -d jb_rollback4 -At -c "select count(*) from public.reward_triggers where is_active and book_code = '1KI'")
if [ "$M" != "1" ]; then echo "✘ reaplicação do Modo Missão sem a missão curada"; exit 1; fi
echo "  ok  reversão do Modo Missão mantém os $BEFORE itens, e as migrações podem ser reaplicadas"

echo "→ reversão manual da meta diária (banco completo) e reaplicação"
"${PSQL[@]}" -c "create database jb_rollback5" postgres
"${PSQL[@]}" -d jb_rollback5 -f "$ROOT/supabase/tests/00_supabase_shim.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do "${PSQL[@]}" -d jb_rollback5 -o /dev/null -f "$f"; done
"${PSQL[@]}" -d jb_rollback5 -f "$ROOT/supabase/rollbacks/20261117000100_daily_goal.down.sql"
"${PSQL[@]}" -d jb_rollback5 -o /dev/null -f "$ROOT/supabase/migrations/20261116000100_reading_missions.sql" 2>/dev/null || true
LEFT=$("${PSQL[@]}" -d jb_rollback5 -At -c "select count(*) from pg_tables where tablename in ('daily_goals','siclos_ledger')")
if [ "$LEFT" != "0" ]; then echo "✘ reversão da meta diária: tabelas restantes=$LEFT"; exit 1; fi
"${PSQL[@]}" -d jb_rollback5 -o /dev/null -f "$ROOT/supabase/migrations/20261117000100_daily_goal.sql"
G=$("${PSQL[@]}" -d jb_rollback5 -At -c "select count(*) from public.economy_rules where key = 'siclos_daily_goal' and value = 40")
if [ "$G" != "1" ]; then echo "✘ reaplicação da meta diária"; exit 1; fi
echo "  ok  reversão da meta diária remove só as tabelas da meta, e a migração pode ser reaplicada"
echo "✔ Todos os testes de banco passaram."
