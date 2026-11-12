-- Executado em paralelo por run-local.sh: compra (:pid, :item) ou escolha gratuita (:pid = 'claim') do jogador :uid.
select set_config('request.jwt.claim.sub', :'uid', false);
set role authenticated;
\set ON_ERROR_STOP 0
select case when :'pid' = 'claim'
  then public.claim_daily_goal_item((select day from public.daily_goals where user_id = auth.uid() limit 1), :'item')
  else public.purchase_market_item(:'pid'::uuid, :'item') end;
