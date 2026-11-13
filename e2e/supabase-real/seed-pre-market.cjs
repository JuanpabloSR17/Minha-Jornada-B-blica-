// Fase 1 (banco ANTES da migração do Mercado): contas comuns criadas pela API de Auth, perfil,
// personagem e meta pelo app; metas dos dias anteriores pelo mesmo caminho do servidor
// (private.complete_reading_mission_at) com datas controladas; escolha gratuita resgatada.
const assert = require('node:assert/strict');
const { client, rpc, db, saveState, ok, PASSWORD } = require('./lib.cjs');

const APPEARANCE = { bodyId: 'body-a', skinToneId: 'skin-2', eyesId: 'eyes-round', browsId: 'brows-soft', expressionId: 'expr-smile', beardId: 'beard-none', hairStyleId: 'hair-curly', hairColorId: 'haircolor-black' };

async function player(tag, username, display, pastDays) {
  const email = `${tag}+${Date.now()}@jornada.test`;
  const c = client();
  const { data, error } = await c.auth.signUp({ email, password: PASSWORD });
  if (error) throw error;
  assert.ok(data.session, 'cadastro sem confirmação de e-mail: desligue "Confirm email" no projeto de testes');
  const uid = data.user.id;
  for (const [fn, args] of [
    ['claim_profile', { p_username: username, p_display_name: display }],
    ['save_avatar', { p_appearance: APPEARANCE, p_equipment: { outfit: 'tunic-linen' }, p_expected_version: null }],
    ['set_reading_preferences', { p_plan_mode: 'daily_goal', p_target: 1 }],
  ]) {
    const r = await rpc(c, fn, args);
    assert.equal(r.code, null, `${fn}: ${r.code}`);
  }
  // metas dos dias anteriores (datas controladas: 09:00 em São Paulo de cada dia)
  const conn = db();
  await conn.connect();
  for (let k = pastDays; k >= 1; k--) {
    await conn.query(
      `select private.complete_reading_mission_at($1, gen_random_uuid(), 'GEN', $2, 'physical', t - interval '6 minutes', 300, t)
       from (select (((now() at time zone 'America/Sao_Paulo')::date - $3::int) + time '09:00') at time zone 'America/Sao_Paulo' as t) x`,
      [uid, pastDays - k + 1, k]);
  }
  await conn.end();
  return { email, uid, c };
}

(async () => {
  const ana = await player('ana', 'ana_testes', 'Ana Testes', 6);
  const bia = await player('bia', 'bia_testes', 'Bia Testes', 3);
  // Ana resgata a escolha gratuita do primeiro dia (posse registrada antes do Mercado)
  const st = await rpc(ana.c, 'get_daily_goal_status', {});
  assert.equal(st.code, null);
  assert.equal(st.data.siclosBalance, 240);
  const first = st.data.pending[0];
  const claim = await rpc(ana.c, 'claim_daily_goal_item', { p_day: first.day, p_item: first.available[0] });
  assert.equal(claim.code, null, claim.code);
  const conn = db();
  await conn.connect();
  const snap = async (uid) => (await conn.query(
    `select (select coalesce(sum(amount),0)::int from siclos_ledger where user_id = $1) siclos,
            (select count(*)::int from user_items where user_id = $1) items,
            (select count(*)::int from daily_goals where user_id = $1) goals`, [uid])).rows[0];
  const before = { ana: await snap(ana.uid), bia: await snap(bia.uid) };
  const market = (await conn.query(`select to_regclass('public.market_purchases') is not null as exists`)).rows[0].exists;
  await conn.end();
  // no Supabase local a fase 1 roda antes do Mercado; num projeto hospedado já atualizado, use PRE_MARKET=0
  if (process.env.PRE_MARKET !== '0') assert.equal(market, false, 'esta fase roda antes da migração do Mercado');
  saveState({ ana: { email: ana.email, uid: ana.uid }, bia: { email: bia.email, uid: bia.uid }, claimed: claim.data.itemId, before });
  ok(`pré-Mercado: Ana ${before.ana.siclos} Siclos, ${before.ana.goals} metas, ${before.ana.items} itens (inclui escolha gratuita ${claim.data.itemId}); Bia ${before.bia.siclos} Siclos`);
})().catch((e) => { console.error('✘', e); process.exit(1); });
