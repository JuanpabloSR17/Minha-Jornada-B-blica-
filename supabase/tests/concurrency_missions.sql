-- Executado em paralelo por run-local.sh: mesma sessão (:sid) finalizada duas vezes ao mesmo tempo.
select set_config('request.jwt.claim.sub', 'c3333333-0000-0000-0000-000000000003', false);
set role authenticated;
select public.complete_reading_mission(:'sid'::uuid, 'GEN', 37, 'physical', now() - interval '5 minutes', 200);
