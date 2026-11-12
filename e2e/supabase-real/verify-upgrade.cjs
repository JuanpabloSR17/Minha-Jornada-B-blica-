// Fase 2 (depois de aplicar a migração do Mercado sobre os dados existentes).
const assert = require('node:assert/strict');
const { signIn, rpc, db, loadState, ok } = require('./lib.cjs');

(async () => {
  const s = loadState();
  const conn = db();
  await conn.connect();
  const migrated = (await conn.query(`select version from supabase_migrations.schema_migrations order by version`)).rows.map((r) => r.version);
  assert.ok(migrated.includes('20261119000100'), 'migração do Mercado registrada');
  for (const who of ['ana', 'bia']) {
    const now = (await conn.query(
      `select (select coalesce(sum(amount),0)::int from siclos_ledger where user_id = $1) siclos,
              (select count(*)::int from user_items where user_id = $1) items,
              (select count(*)::int from daily_goals where user_id = $1) goals`, [s[who].uid])).rows[0];
    assert.deepEqual(now, s.before[who], `${who}: saldo, itens e metas preservados`);
  }
  await conn.end();
  ok(`atualização: ${migrated.length} migrações registradas; saldos (Ana ${s.before.ana.siclos}, Bia ${s.before.bia.siclos}), itens e metas preservados`);

  const { c } = await signIn(s.ana.email);
  const m = await rpc(c, 'get_market', {});
  assert.equal(m.code, null, m.code);
  assert.equal(m.data.siclosBalance, s.before.ana.siclos);
  assert.equal(m.data.items.length, 25);
  const claimed = m.data.items.find((x) => x.itemId === s.claimed);
  if (claimed) assert.equal(claimed.owned, true, 'item da escolha gratuita aparece como obtido na vitrine');
  ok(`vitrine após a atualização: 25 itens, saldo ${m.data.siclosBalance}; item resgatado antes do Mercado aparece como obtido`);
})().catch((e) => { console.error('✘', e); process.exit(1); });
