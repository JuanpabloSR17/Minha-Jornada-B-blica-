-- Executado em paralelo (2 sessões) por run-local.sh: primeiro salvamento simultâneo.
begin;
select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);
set local role authenticated;
select pg_sleep(0.2);
select public.save_avatar(
  '{"bodyId":"body-a","skinToneId":"skin-1","eyesId":"eyes-joy","browsId":"brows-thick","expressionId":"expr-calm","beardId":"beard-none","hairStyleId":"hair-bun","hairColorId":"haircolor-gray"}',
  '{"outfit":"tunic-sky"}');
commit;
