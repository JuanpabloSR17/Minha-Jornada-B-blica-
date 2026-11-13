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
    // pedido sem resposta: fica pendente, sobrevive a reabrir; a verificação automática com resposta
    // perdida confirma pela vitrine, sem cobrança dupla nem estado "aguardando" + "Obtido"
    await page.route('**/rest/v1/rpc/purchase_market_item', (r) => r.abort('internetdisconnected'));
    await page.getByRole('button', { name: `Comprar ${y.name}` }).click();
    await page.getByRole('button', { name: `Pagar ${y.price} Siclos` }).click();
    await page.getByText('Compra aguardando confirmação').waitFor();
    assert.equal(await owns(y.id), 0, 'o pedido não chegou ao servidor');
    await page.unroute('**/rest/v1/rpc/purchase_market_item');
    await page.route('**/rest/v1/rpc/purchase_market_item', async (r) => { await r.fetch(); await r.abort('connectionreset'); });
    await page.reload();
    await page.getByText(`Compra confirmada: ${y.name} já está no seu inventário`, { exact: false }).waitFor();
    assert.equal(await page.getByText('Compra aguardando confirmação').count(), 0);
    await page.unroute('**/rest/v1/rpc/purchase_market_item');
    await page.getByText(`Saldo: ${b2 - y.price} Siclos`).first().waitFor();
    const lost = (await conn.query(`select (select count(*)::int from market_purchases where user_id = $1 and item_id = $2) p,
      (select count(*)::int from siclos_ledger where user_id = $1 and event_type = 'MARKET_PURCHASE' and source_event_id in (select 'purchase:' || id from market_purchases where user_id = $1 and item_id = $2)) d`, [uid, y.id])).rows[0];
    assert.deepEqual(lost, { p: 1, d: 1 });
    assert.equal(await balance(), b2 - y.price);
    await shot(page, 'real-05-recovered');
    ok(`compra sem resposta: pendente após reabrir; verificação automática com resposta perdida confirma ${y.name} uma vez (1 compra, 1 débito); saldo ${b2 - y.price}`);

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

    // ------------------------------------------------ missão de Êxodo 28 (catálogo v7) com o Peitoral já obtido
    // posse anterior do Peitoral (ambiente de testes: o item ainda não tem outra rota de obtenção)
    await conn.query(`insert into user_items (user_id, item_id, source_event_id) values ($1, 'rare_peitoral_das_doze_pedras', 'test:obtido-antes')`, [uid]);
    const RARES = ['rare_estola_sacerdotal', 'rare_peitoral_das_doze_pedras', 'rare_turbante_do_sacerdote'];
    const rareRows = async () => (await conn.query(`select item_id, count(*)::int n from user_items where user_id = $1 and item_id = any($2) group by item_id order by item_id`, [uid, RARES])).rows;
    const xpBefore = Number((await conn.query(`select coalesce(sum(amount),0) x from xp_ledger where user_id = $1`, [uid])).rows[0].x);
    await page.goto(`${APP}/read`);
    await page.getByRole('button', { name: /Missão especial: as vestes do sumo sacerdote/ }).click();
    await page.getByRole('button', { name: 'Iniciar missão: Êxodo 28' }).click();
    await page.waitForTimeout(1200);
    // a resposta da finalização se perde depois de o servidor registrar
    await page.route('**/rest/v1/rpc/complete_reading_mission', async (r) => { await r.fetch(); await r.abort('connectionreset'); });
    await page.getByRole('button', { name: 'Finalizar missão' }).click();
    await page.getByRole('button', { name: 'Concluí a leitura' }).click();
    await page.getByText('Finalização pendente').filter({ visible: true }).first().waitFor();
    await page.unroute('**/rest/v1/rpc/complete_reading_mission');
    assert.deepEqual(await rareRows(), RARES.map((item_id) => ({ item_id, n: 1 })), 'servidor concedeu Estola e Turbante uma vez; Peitoral continua único');
    await page.reload();
    await page.getByText('Finalização pendente').filter({ visible: true }).first().waitFor();
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await page.getByText('Missão especial: as vestes do sumo sacerdote — concluída').waitFor();
    await page.getByText('Esta finalização já tinha sido registrada', { exact: false }).waitFor();
    await page.getByText('Estola Sacerdotal', { exact: true }).waitFor();
    await page.getByText('Turbante do Sacerdote', { exact: true }).waitFor();
    assert.equal(await page.getByText('Peitoral das Doze Pedras', { exact: true }).count(), 0, 'Peitoral não aparece como concedido');
    assert.equal(await page.getByRole('button', { name: 'Equipar agora' }).count(), 2);
    await shot(page, 'real-07-exodus28');
    const ex = (await conn.query(`select (select count(*)::int from reading_sessions where user_id = $1 and book_code = 'EXO' and chapter = 28) s,
      (select count(*)::int from reward_events re join user_items ui on ui.user_id = re.user_id and ui.item_id = re.item_id
         where re.user_id = $1 and re.item_id = any($2)) r,
      (select count(*)::int from private.domain_events where user_id = $1 and event_type = 'MISSION_COMPLETED' and source_event_id = 'mission:missao_vestes_do_sumo_sacerdote') m,
      (select coalesce(sum(amount),0)::int from xp_ledger where user_id = $1) xp`, [uid, RARES])).rows[0];
    assert.deepEqual(ex, { s: 1, r: 2, m: 1, xp: xpBefore + 40 }, 'uma sessão, duas recompensas (Estola e Turbante), uma missão, 40 XP');
    assert.deepEqual(await rareRows(), RARES.map((item_id) => ({ item_id, n: 1 })), 'reenvio não duplicou nada');
    ok('Êxodo 28 com o Peitoral já obtido: tela e banco mostram só Estola e Turbante; resposta perdida e reenvio sem duplicar (1 sessão, 1 missão, 2 recompensas, 40 XP)');

    // ------------------------------------------------ marco de Êxodo 25 (catálogo v8): escolha explícita, posse parcial e reenvio
    await conn.query(`insert into user_items (user_id, item_id, source_event_id) values ($1, 'holy_mesa_dos_paes_da_presenca', 'test:obtido-antes')`, [uid]);
    const SANTOS = ['holy_arca_da_alianca_representacao', 'holy_candelabro_do_tabernaculo', 'holy_mesa_dos_paes_da_presenca'];
    await page.goto(`${APP}/read`);
    await page.getByRole('button', { name: 'Ver todos os marcos' }).click();
    await page.getByRole('radio', { name: 'A cumprir (20)' }).click();
    await page.getByRole('link', { name: /^Marco: a mobília do Tabernáculo, Êxodo 25, A cumprir, Santos deste marco que você possui: 1 de 3/ }).click();
    for (const id of SANTOS) await page.getByTestId(`marco-item-${id}`).waitFor();
    assert.equal(await page.getByTestId('marco-item-state-holy_mesa_dos_paes_da_presenca').innerText(), 'Você já possui');
    await page.getByRole('button', { name: 'Iniciar marco: Êxodo 25' }).click();
    await page.getByTestId('session-milestone').waitFor();
    await page.route('**/rest/v1/rpc/complete_reading_mission', async (r) => { await r.fetch(); await r.abort('connectionreset'); });
    await page.getByRole('button', { name: 'Finalizar missão' }).click();
    await page.getByRole('button', { name: 'Concluí a leitura' }).click();
    await page.getByText('Finalização pendente').filter({ visible: true }).first().waitFor();
    await page.unroute('**/rest/v1/rpc/complete_reading_mission');
    await page.reload();
    // aba Ler destaca a sessão aguardando confirmação, com o marco vinculado
    await page.goto(`${APP}/read`);
    await page.getByText('Sessão vinculada · Marco: a mobília do Tabernáculo').first().waitFor();
    await page.getByRole('button', { name: 'Verificar resultado' }).click();
    assert.equal(await page.getByTestId('session-milestone').innerText(), 'Sessão vinculada · Marco: a mobília do Tabernáculo', 'vínculo preservado ao reabrir');
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await page.getByText('Marco: a mobília do Tabernáculo — concluído').waitFor();
    await page.getByText('Esta finalização já tinha sido registrada', { exact: false }).waitFor();
    for (const n of ['Arca da Aliança (Representação)', 'Candelabro do Tabernáculo']) await page.getByText(n, { exact: true }).last().waitFor();
    await shot(page, 'real-08-milestone-exodus25');
    const mk = (await conn.query(`select
      (select count(*)::int from reading_sessions where user_id = $1 and milestone_id = 'marco_mobilia_do_tabernaculo') s,
      (select count(*)::int from private.domain_events where user_id = $1 and event_type = 'MILESTONE_REACHED' and source_event_id = 'milestone:marco_mobilia_do_tabernaculo') m,
      (select count(*)::int from reward_events where user_id = $1 and item_id = any($2)) r,
      (select count(*)::int from user_items where user_id = $1 and item_id = any($2)) i`, [uid, SANTOS])).rows[0];
    assert.deepEqual(mk, { s: 1, m: 1, r: 2, i: 3 }, 'uma sessão vinculada, um marco, duas recompensas (Arca e Candelabro), três Santos');
    // revelação (após a confirmação): só os dois Santos concedidos; pular e abrir o Santuário por ela
    const reveal = page.getByTestId('reveal-overlay');
    await reveal.waitFor();
    await reveal.getByTestId('reveal-item-holy_arca_da_alianca_representacao').waitFor();
    await reveal.getByTestId('reveal-item-holy_candelabro_do_tabernaculo').waitFor();
    assert.equal(await reveal.getByTestId('reveal-item-holy_mesa_dos_paes_da_presenca').count(), 0, 'a Mesa já era da conta');
    await reveal.getByRole('button', { name: 'Pular animação' }).click();
    await shot(page, 'real-08b-reveal');
    await reveal.getByRole('button', { name: 'Ver no Santuário' }).click();
    await page.getByText('Obras do Pai').waitFor();
    await page.getByTestId('exhibition-hall').waitFor();
    assert.equal(await page.getByTestId('collection-owned-works-father').innerText(), '3 de 13 Santos obtidos');
    await page.getByText('Marcos cumpridos: 1 de 20').last().waitFor();
    await page.getByText('Santos obtidos: 3 de 22').last().waitFor();
    await shot(page, 'real-09-sanctuary');
    ok('marco de Êxodo 25 aberto pela lista de marcos, com a Mesa já obtida: resposta perdida, sessão pendente destacada na aba Ler, reenvio — revelação e banco só com Arca e Candelabro, 1 marco; Santuário: 1 de 20 marcos, 3 de 22 Santos, coleção 3 de 13');
  } finally {
    await browser.close();
    await conn.end();
  }
})().catch((e) => { console.error('✘', e); process.exit(1); });
