// Fase 4: permissões reais do Supabase (PostgREST + RLS + grants) com contas comuns.
const assert = require('node:assert/strict');
const { client, signIn, rpc, db, loadState, ok } = require('./lib.cjs');

const denied = (res) => !!res.error || (Array.isArray(res.data) && res.data.length === 0);

(async () => {
  const s = loadState();
  const ana = await signIn(s.ana.email);
  const bia = await signIn(s.bia.email);
  const conn = db();
  await conn.connect();
  const totals = async () => (await conn.query(
    `select (select coalesce(sum(amount),0)::int from siclos_ledger) siclos, (select count(*)::int from user_items) items,
            (select count(*)::int from market_purchases) purchases, (select count(*)::int from daily_goals where chosen_item is not null) chosen`)).rows[0];

  // ---------------------------------------------------------------- operações autorizadas
  for (const fn of ['get_market', 'get_daily_goal_status', 'get_mission_overview', 'get_wardrobe', 'get_reading_progress']) {
    const r = await rpc(ana.c, fn, {});
    assert.equal(r.code, null, `${fn}: ${r.code}`);
  }
  // Bia compra pelo app (operação autorizada) — usada abaixo para o teste entre contas
  const biaMarket = (await rpc(bia.c, 'get_market', {})).data;
  const biaItem = biaMarket.items.find((x) => !x.owned && x.price <= biaMarket.siclosBalance);
  const biaPurchaseId = crypto.randomUUID();
  const bp = await rpc(bia.c, 'purchase_market_item', { p_purchase_id: biaPurchaseId, p_item: biaItem.itemId });
  assert.equal(bp.code, null, bp.code);
  assert.equal(bp.data.siclosBalance, biaMarket.siclosBalance - biaItem.price);
  ok(`conta comum usa as operações autorizadas (vitrine, metas, progresso, guarda-roupa) e compra pelo RPC: Bia comprou ${biaItem.itemId} por ${biaItem.price}`);

  // ---------------------------------------------------------------- escrita direta bloqueada
  const before = await totals();
  const attempts = [
    ['saldo: inserir crédito', ana.c.from('siclos_ledger').insert({ user_id: ana.uid, event_type: 'HACK', source_event_id: 'x', amount: 9999 })],
    ['saldo: alterar lançamento', ana.c.from('siclos_ledger').update({ amount: 9999 }).eq('user_id', ana.uid).select()],
    ['saldo: apagar débito', ana.c.from('siclos_ledger').delete().eq('user_id', ana.uid).select()],
    ['posse: inserir item', ana.c.from('user_items').insert({ user_id: ana.uid, item_id: 'rare_flauta_do_musico', source_event_id: 'hack' })],
    ['posse: trocar item', ana.c.from('user_items').update({ item_id: 'rare_flauta_do_musico' }).eq('user_id', ana.uid).select()],
    ['posse: apagar item', ana.c.from('user_items').delete().eq('user_id', ana.uid).select()],
    ['compra: registrar', ana.c.from('market_purchases').insert({ id: crypto.randomUUID(), user_id: ana.uid, item_id: 'rare_flauta_do_musico', requested_item_id: 'x', price: 1, result: {} })],
    ['compra: alterar preço pago', ana.c.from('market_purchases').update({ price: 1 }).eq('user_id', bia.uid).select()],
    ['compra: apagar', bia.c.from('market_purchases').delete().eq('user_id', bia.uid).select()],
    ['meta: reabrir escolha', ana.c.from('daily_goals').update({ chosen_item: null }).eq('user_id', ana.uid).select()],
    ['XP: inserir', ana.c.from('xp_ledger').insert({ user_id: ana.uid, event_type: 'HACK', source_event_id: 'x', amount: 9999 })],
    ['preço: alterar catálogo', ana.c.from('cosmetic_items').update({ shop_price_suggested: 1 }).eq('id', 'rare_flauta_do_musico').select()],
    ['regras de economia', ana.c.from('economy_rules').update({ value: 9999 }).eq('key', 'siclos_daily_goal').select()],
  ];
  for (const [label, q] of attempts) {
    const res = await q;
    assert.ok(denied(res), `deveria ser bloqueado: ${label} → ${JSON.stringify(res.data)}`);
  }
  assert.deepEqual(await totals(), before, 'nenhuma escrita direta mudou saldo, posse, compras ou metas');
  ok(`Supabase bloqueia escrita direta (${attempts.length} tentativas: saldo, posse, compras, metas, XP, preços, regras); banco inalterado`);

  // ---------------------------------------------------------------- isolamento entre contas
  for (const t of ['siclos_ledger', 'user_items', 'market_purchases', 'daily_goals', 'daily_targets', 'reading_sessions', 'xp_ledger', 'reading_preferences', 'avatar_loadouts']) {
    const { data, error } = await ana.c.from(t).select('*').eq('user_id', bia.uid);
    assert.ok(!error && data.length === 0, `Ana não lê ${t} de Bia`);
  }
  const { data: profs } = await ana.c.from('profiles').select('id');
  assert.deepEqual(profs.map((p) => p.id), [ana.uid], 'Ana só lê o próprio perfil');
  const reuse = await rpc(ana.c, 'purchase_market_item', { p_purchase_id: biaPurchaseId, p_item: biaItem.itemId });
  assert.equal(reuse.code, 'invalid_purchase', 'Ana não reaproveita a compra de Bia');
  const biaGoal = (await conn.query(`select day::text as d, options from daily_goals where user_id = $1 and chosen_item is null order by day limit 1`, [bia.uid])).rows[0];
  const anaDays = (await conn.query(`select day::text as d from daily_goals where user_id = $1`, [ana.uid])).rows.map((r) => r.d);
  const steal = await rpc(ana.c, 'claim_daily_goal_item', { p_day: biaGoal.d, p_item: biaGoal.options[0] });
  assert.ok(steal.code && ['goal_not_found', 'invalid_goal_choice', 'goal_choice_already_made', 'item_already_owned'].includes(steal.code), `Ana não resgata a escolha de Bia (${steal.code})`);
  assert.ok(anaDays.length > 0);
  assert.deepEqual(await totals(), before, 'tentativas entre contas não mudaram nada');
  ok('isolamento: Ana não lê saldo, itens, compras, metas, sessões, XP, preferências nem visuais de Bia, e não reaproveita a compra nem a escolha dela');

  // ---------------------------------------------------------------- visitante sem login
  const anon = client();
  const a1 = await rpc(anon, 'purchase_market_item', { p_purchase_id: crypto.randomUUID(), p_item: 'common_cantil_de_agua' });
  const a2 = await anon.from('siclos_ledger').select('*');
  assert.ok(a1.code, 'visitante não compra');
  assert.ok(a2.error || a2.data.length === 0, 'visitante não lê saldos');
  ok(`visitante sem login: compra recusada (${a1.code}) e saldos invisíveis`);
  await conn.end();
})().catch((e) => { console.error('✘', e); process.exit(1); });
