-- Executado em paralelo por run-local.sh: finalizações simultâneas (:sid, capítulo :ch) do mesmo jogador.
select set_config('request.jwt.claim.sub', 'e5555555-0000-0000-0000-000000000005', false);
set role authenticated;
select public.complete_reading_mission(:'sid'::uuid, 'MRK', :ch, 'physical', now() - interval '5 minutes', 200);
