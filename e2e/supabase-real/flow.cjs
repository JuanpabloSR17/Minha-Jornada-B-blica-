// Fase 5: percurso no navegador contra o Supabase real — leitura, meta diária, escolha gratuita,
// compra, inventário, resposta perdida e duas compras disputando o mesmo saldo (dois aparelhos).
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { db, loadState, ok, PASSWORD } = require('./lib.cjs');

const APP = process.env.APP_URL ?? 'http://localhost:8081';
const SHOTS = process.env.SHOTS_DIR;
const shot = async (page, name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png` });
const CATEGORY = { neck: 'head' };

async function phone(browser) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'America/Sao_Paulo' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('pageerror:', e));
  return { ctx, page };
}
async function login(page, email) {
  await page.goto(APP);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).last().click();
  await page.getByText('Paz, Ana Testes!').waitFor();
}

(async () => {
  const s = loadState();
  const conn = db();
  await conn.connect();
  const uid = s.ana.uid;
  const balance = async () => Number((await conn.query(`select coalesce(sum(amount),0) b from siclos_ledger where user_id = $1`, [uid])).rows[0].b);
  const owns = async (item) => Number((await conn.query(`select count(*) from user_items where user_id = $1 and item_id = $2`, [uid, item])).rows[0].count);
  const unowned = async (max) => (await conn.query(
    `select i.id, i.name, i.slot, i.shop_price_suggested::int price from cosmetic_items i
     where i.shop_eligible and i.is_active and not i.is_starter and i.rarity <> 'holy' and i.shop_price_suggested <= $2
       and not private.owns_canonical($1, i.id) order by i.shop_price_suggested desc, i.id`, [uid, max])).rows;
  const browser = await chromium.launch();
  try {
    const A = await phone(browser);
    const page = A.page;
    await login(page, s.ana.email);

    // ------------------------------------------------ meta diária pelo app
    const start = await balance();
    await page.getByText('Meta pessoal: 1 capítulo por dia').waitFor();
    await page.getByText('Hoje: 0 de 1 capítulos').waitFor();
    await page.getByText('Recompensa: 40 Siclos · 20 XP de bônus · 1 Comum à escolha').waitFor();
    await shot(page, 'real-01-home');
    await page.getByRole('button', { name: 'Começar leitura' }).click();
    await page.getByRole('radio', { name: /^Gênesis,/ }).click();
    await page.getByRole('radio', { name: 'Capítulo 7', exact: true }).click();
    await page.getByRole('button', { name: 'Iniciar missão: Gênesis 7' }).click();
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Finalizar missão' }).click();
    await page.getByRole('button', { name: 'Concluí a leitura' }).click();
    await page.getByTestId('goal-celebration').waitFor();
    await page.getByText('Meta diária cumprida! +40 Siclos · +20 XP').waitFor();
    await page.getByText(`Saldo: ${start + 40} Siclos`).first().waitFor();
    assert.equal(await balance(), start + 40, 'crédito de 40 Siclos registrado no banco');
    await shot(page, 'real-02-goal');
    const option = page.getByRole('radio').first();
    const optionName = (await option.getAttribute('aria-label')).split(',')[0];
    await option.click();
    await page.getByRole('button', { name: `Receber ${optionName}` }).click();
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await page.getByText(`${optionName} foi adicionado ao seu inventário.`).waitFor();
    const today = (await conn.query(`select siclos, xp_bonus, chosen_item from daily_goals where user_id = $1 and day = (now() at time zone 'America/Sao_Paulo')::date`, [uid])).rows[0];
    assert.equal(today.siclos, 40);
    assert.equal(today.xp_bonus, 20);
    assert.ok(today.chosen_item);
    ok(`meta do dia pelo app: Gênesis 7 → 40 Siclos (saldo ${start} → ${start + 40}), 20 XP de bônus e ${optionName} pela escolha gratuita`);

    // ------------------------------------------------ compra e inventário
    await page.goto(`${APP}/home`);
    await page.getByRole('button', { name: 'Mercado dos Viajantes' }).click();
    const b1 = await balance();
    await page.getByText(`Saldo: ${b1} Siclos`).first().waitFor();
    const x = (await unowned(b1)).at(-1); // o mais barato disponível
    await page.getByRole('button', { name: `Comprar ${x.name}` }).click();
    await page.getByText(`por ${x.price} Siclos. Saldo: ${b1} → ${b1 - x.price} Siclos.`, { exact: false }).waitFor();
    await page.getByRole('button', { name: `Pagar ${x.price} Siclos` }).click();
    await page.getByText(`${x.name} foi adicionado ao seu inventário. Saldo: ${b1 - x.price} Siclos.`).waitFor();
    assert.equal(await balance(), b1 - x.price);
    assert.equal(await owns(x.id), 1);
    await shot(page, 'real-03-bought');
    await page.goto(`${APP}/avatar/wardrobe?category=${CATEGORY[x.slot] ?? x.slot}`);
    await page.getByRole('radio', { name: new RegExp(`^${x.name},.*Obtido`) }).waitFor();
    await shot(page, 'real-04-wardrobe');
    ok(`compra: ${x.name} por ${x.price} → saldo ${b1 - x.price} (interface e banco) e item obtido no guarda-roupa`);

    // ------------------------------------------------ resposta perdida
    const b2 = await balance();
    const y = (await unowned(b2)).at(-1);
    await page.goto(`${APP}/market`);
    await page.route('**/rest/v1/rpc/purchase_market_item', async (r) => { await r.fetch(); await r.abort('connectionreset'); });
    await page.getByRole('button', { name: `Comprar ${y.name}` }).click();
    await page.getByRole('button', { name: `Pagar ${y.price} Siclos` }).click();
    await page.getByText('Sem conexão com o servidor', { exact: false }).waitFor();
    await page.getByText('Compra aguardando confirmação').waitFor();
    await page.unroute('**/rest/v1/rpc/purchase_market_item');
    assert.equal(await owns(y.id), 1, 'o servidor registrou a compra antes de a resposta se perder');
    await page.reload();
    await page.getByText('Compra aguardando confirmação').waitFor();
    await page.getByRole('button', { name: 'Verificar compra' }).click();
    await page.getByText(`Compra já registrada: ${y.name}`, { exact: false }).waitFor();
    await page.getByText(`Saldo: ${b2 - y.price} Siclos`).first().waitFor();
    const lost = (await conn.query(`select (select count(*)::int from market_purchases where user_id = $1 and item_id = $2) p,
      (select count(*)::int from siclos_ledger where user_id = $1 and event_type = 'MARKET_PURCHASE' and source_event_id in (select 'purchase:' || id from market_purchases where user_id = $1 and item_id = $2)) d`, [uid, y.id])).rows[0];
    assert.deepEqual(lost, { p: 1, d: 1 });
    assert.equal(await balance(), b2 - y.price);
    await shot(page, 'real-05-recovered');
    ok(`resposta perdida: ${y.name} registrada uma vez (1 compra, 1 débito), recuperada depois de reabrir o app; saldo ${b2 - y.price}`);

    // ------------------------------------------------ duas compras disputando o saldo (dois aparelhos)
    const b3 = await balance();
    const [z, w] = await unowned(b3);
    assert.ok(z && w && z.price + w.price > b3, `precisa de dois itens que não cabem juntos no saldo ${b3}`);
    const B = await phone(browser);
    await login(B.page, s.ana.email);
    await page.goto(`${APP}/market`);
    await B.page.goto(`${APP}/market`);
    await page.getByRole('button', { name: `Comprar ${z.name}` }).click();
    await B.page.getByRole('button', { name: `Comprar ${w.name}` }).click();
    await page.getByRole('button', { name: `Pagar ${z.price} Siclos` }).waitFor();
    await B.page.getByRole('button', { name: `Pagar ${w.price} Siclos` }).waitFor();
    await Promise.all([
      page.getByRole('button', { name: `Pagar ${z.price} Siclos` }).click(),
      B.page.getByRole('button', { name: `Pagar ${w.price} Siclos` }).click(),
    ]);
    const outcome = async (p, it) => {
      const won = p.getByText(`${it.name} foi adicionado ao seu inventário`, { exact: false });
      const lostMsg = p.getByText('Siclos insuficientes para esta compra.');
      await Promise.race([won.waitFor(), lostMsg.waitFor()]);
      return (await won.count()) > 0 ? 'comprou' : 'saldo insuficiente';
    };
    const [rz, rw] = [await outcome(page, z), await outcome(B.page, w)];
    // nenhum aparelho mostra saldo negativo, nem durante a animação do diálogo
    for (const p of [page, B.page]) {
      for (let i = 0; i < 6; i++) {
        assert.equal(await p.getByText(/→ -\d+ Siclos/).count(), 0, 'saldo negativo exibido na tela');
        await p.waitForTimeout(100);
      }
    }
    assert.deepEqual([rz, rw].sort(), ['comprou', 'saldo insuficiente']);
    const winner = rz === 'comprou' ? z : w;
    const loser = winner === z ? w : z;
    assert.equal(await owns(winner.id), 1);
    assert.equal(await owns(loser.id), 0);
    assert.equal(await balance(), b3 - winner.price);
    assert.ok((await balance()) >= 0);
    await shot(page, 'real-06-race-a');
    await shot(B.page, 'real-06-race-b');
    ok(`saldo disputado em dois aparelhos (${b3}: ${z.name} ${z.price} × ${w.name} ${w.price}): um aparelho comprou ${winner.name}, o outro recebeu "saldo insuficiente"; saldo final ${b3 - winner.price}`);
  } finally {
    await browser.close();
    await conn.end();
  }
})().catch((e) => { console.error('✘', e); process.exit(1); });
