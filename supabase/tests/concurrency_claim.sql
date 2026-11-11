-- Executado em paralelo por run-local.sh: dois resgates simultâneos da escolha da meta (:item).
select set_config('request.jwt.claim.sub', 'e5555555-0000-0000-0000-000000000005', false);
set role authenticated;
\set ON_ERROR_STOP 0
select public.claim_daily_goal_item(private_day.d, :'item') from (select (now() at time zone 'America/Sao_Paulo')::date d) private_day;
