// Fase 2 (depois de aplicar a migração do Mercado sobre os dados existentes).
const assert = require('node:assert/strict');
const { signIn, rpc, db, loadState, ok } = require('./lib.cjs');

(async () => {
  const s = loadState();
  const conn = db();
  await conn.connect();
  const migrated = (await conn.query(`select version from supabase_migrations.schema_migrations order by version`)).rows.map((r) => r.version);
  const local = require('node:fs').readdirSync(require('node:path').join(__dirname, '../../supabase/migrations'))
    .filter((f) => f.endsWith('.sql')).map((f) => f.split('_')[0]).sort();
  assert.deepEqual(migrated, local, 'todas as migrações do repositório registradas, na ordem');
  assert.ok(migrated.includes('20261119000100'), 'migração do Mercado registrada');
  for (const who of ['ana', 'bia']) {
    const now = (await conn.query(
      `select (select coalesce(sum(amount),0)::int from siclos_ledger where user_id = $1) siclos,
              (select count(*)::int from user_items where user_id = $1) items,
              (select count(*)::int from daily_goals where user_id = $1) goals`, [s[who].uid])).rows[0];
    assert.deepEqual(now, s.before[who], `${who}: saldo, itens e metas preservados`);
  }
  const v = (await conn.query(`select max(catalog_version)::int v from cosmetic_items`)).rows[0].v;
  const kinds = (await conn.query(`select kind, count(*)::int n from reward_triggers where is_active and book_code is not null group by kind`)).rows;
  const count = (k) => kinds.find((x) => x.kind === k)?.n ?? 0;
  const missions = count('mission');
  const milestones = count('milestone');
  const catalog = require('../../src/features/avatar/catalog/catalog.json');
  assert.equal(v, catalog.version, 'banco no mesmo catálogo do app');
  assert.equal(missions, catalog.missions.filter((m) => m.kind === 'mission').length, 'missões dos Raros cadastradas');
  assert.equal(milestones, catalog.missions.filter((m) => m.kind === 'milestone').length, 'marcos dos Santos cadastrados');
  await conn.end();
  ok(`catálogo v${v} com ${missions} missões dos Raros e ${milestones} marcos dos Santos ativos`);
  ok(`atualização: ${migrated.length} migrações registradas (até ${migrated.at(-1)}); saldos (Ana ${s.before.ana.siclos}, Bia ${s.before.bia.siclos}), itens e metas preservados`);

  const { c } = await signIn(s.ana.email);
  const m = await rpc(c, 'get_market', {});
  assert.equal(m.code, null, m.code);
  assert.equal(m.data.siclosBalance, s.before.ana.siclos);
  assert.equal(m.data.items.length, 25);
  const claimed = m.data.items.find((x) => x.itemId === s.claimed);
  if (claimed) assert.equal(claimed.owned, true, 'item da escolha gratuita aparece como obtido na vitrine');
  ok(`vitrine após a atualização: 25 itens, saldo ${m.data.siclosBalance}; item resgatado antes do Mercado aparece como obtido`);
})().catch((e) => { console.error('✘', e); process.exit(1); });
