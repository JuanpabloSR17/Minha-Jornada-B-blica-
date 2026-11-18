-- Executado em paralelo por run-local.sh: compra da skin :skin com o ID :pid pelo jogador :uid.
select set_config('request.jwt.claim.sub', :'uid', false);
set role authenticated;
\set ON_ERROR_STOP 0
select public.purchase_skin(:'pid'::uuid, :'skin', null, null);
