/* eslint-disable */
// Quatro correções reproduzidas no navegador (revisão do app):
// 1) Jornada → Êxodo 25: passagem e iniciar no topo, com escolha explícita do marco Santo;
// 2) voltar pelo navegador: o Início mostra a sessão ativa/pendente sem recarregar;
// 3) aparelho novo: próximo capítulo inédito pelo progresso da conta, com releitura por escolha;
// 4) Mercado: "Compra confirmada" só com o ID desta compra no registro; posse por outra via comunicada.
// `FLOW=fixes bash e2e/run.sh`
const { chromium } = require('playwright');
const pg = require('pg');
const assert = require('node:assert/strict');

const APP = process.env.APP_URL ?? 'http://localhost:8081';
const SHOTS = process.env.SHOTS_DIR ?? `${__dirname}/screenshots`;
const db = new pg.Client({ host: process.env.PGHOST, port: Number(process.env.PGPORT), user: 'postgres', database: 'jb_test' });
const step = (msg) => console.log(`  ✔ ${msg}`);
const shot = (page, name) => page.screenshot({ path: `${SHOTS}/${name}.png` });
const pick = async (page, tab, option) => {
  await page.getByRole('tab', { name: tab, exact: true }).click();
  await page.getByRole('radio', { name: option, exact: true }).click();
};
const inViewport = async (locator, label) => {
  const box = await locator.boundingBox();
  const vh = locator.page().viewportSize().height;
  assert.ok(box && box.y >= 0 && box.y + box.height <= vh, `${label} visível sem rolagem (y=${box?.y})`);
};

async function phone(browser, width = 320, height = 640) {
  const ctx = await browser.newContext({ viewport: { width, height }, timezoneId: 'America/Sao_Paulo', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('pageerror:', e.message));
  return { ctx, page };
}

async function onboard(page, name, user) {
  const email = `${user}+${Date.now()}@teste.local`;
  await page.goto(APP);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill('senha-forte-123');
  await page.getByRole('button', { name: 'Criar conta' }).last().click();
  await page.getByText('Como você quer ser chamado?').waitFor();
  await page.getByLabel('Nome de exibição').fill(name);
  await page.getByLabel('Nome de usuário').fill(user);
  await page.getByText('Disponível').waitFor();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByText('Criar personagem').waitFor();
  await pick(page, 'Modelo', 'Modelo B');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Finalizar personagem' }).click();
  await page.getByText('Qual é o seu ritmo?').waitFor();
  await page.getByRole('button', { name: 'Começar a jornada' }).click();
  await page.getByText(`Paz, ${name}!`).waitFor();
  const id = (await db.query('select id from profiles where username = $1', [user])).rows[0].id;
  return { email, id };
}

async function login(page, email, name) {
  await page.goto(APP);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill('senha-forte-123');
  await page.getByRole('button', { name: 'Entrar' }).last().click();
  await page.getByText(`Paz, ${name}!`).waitFor();
}

/** Leitura registrada pelo próprio servidor, como se feita em outro aparelho. */
async function readOnServer(userId, book, chapter) {
  await db.query('begin');
  await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [userId]);
  await db.query(`select public.complete_reading_mission(md5($1)::uuid, $2, $3, 'physical', now() - interval '5 minutes', 240)`, [`fix-${userId}-${book}-${chapter}`, book, chapter]);
  await db.query('commit');
}

const panel = (page) => page.getByTestId('home-action-panel');

(async () => {
  await db.connect();
  const browser = await chromium.launch();

  // ================================================================ 1) Jornada → Êxodo 25
  const A = await phone(browser);
  const ana = await onboard(A.page, 'Lia', 'lia_fix');
  let page = A.page;
  // a aba Ler já foi aberta e rolada antes (estado que escondia a passagem escolhida)
  await page.getByRole('tab', { name: 'Ler' }).click();
  await page.waitForTimeout(600);
  await page.mouse.wheel(0, 3000);
  await page.getByRole('tab', { name: 'Jornada' }).click();
  await page.getByRole('button', { name: /Origens e Aliança/ }).click();
  await page.getByRole('button', { name: /^Êxodo/ }).click();
  await page.getByRole('button', { name: 'Êxodo 25', exact: true }).click();
  const passage = page.getByTestId('selected-passage').filter({ visible: true });
  await passage.getByText('Êxodo 25', { exact: true }).waitFor();
  await inViewport(passage.getByRole('button', { name: 'Iniciar missão: Êxodo 25' }), 'Iniciar missão: Êxodo 25');
  const marcoBtn = passage.getByRole('button', { name: 'Iniciar pelo Marco: a mobília do Tabernáculo' });
  await marcoBtn.waitFor();
  await shot(page, 'fx-01-jornada-exodo25-320');
  step('Jornada → Êxodo 25: passagem e "Iniciar missão" no topo, sem rolagem; marco Santo como escolha explícita separada');

  // escolha explícita do marco: a sessão nasce vinculada
  await marcoBtn.click();
  await page.getByTestId('session-milestone').waitFor();
  assert.equal(await page.getByTestId('session-milestone').innerText(), 'Sessão vinculada · Marco: a mobília do Tabernáculo');
  step('"Iniciar pelo marco" cria a sessão vinculada ao marco escolhido');

  // ================================================================ 2) voltar pelo navegador
  for (let i = 0; i < 8 && !/\/home$/.test(page.url()); i++) {
    await page.goBack();
    await page.waitForTimeout(300);
  }
  await page.waitForURL(/\/home$/);
  await panel(page).getByText('Leitura em andamento').waitFor({ timeout: 5000 });
  await panel(page).getByText('Marco: a mobília do Tabernáculo', { exact: false }).waitFor();
  await inViewport(panel(page).getByRole('button', { name: 'Continuar leitura' }), 'Continuar leitura');
  await shot(page, 'fx-02-voltar-sessao-ativa-320');
  // finalização pendente (sem conexão) e voltar: o Início mostra "Verificar resultado"
  await panel(page).getByRole('button', { name: 'Continuar leitura' }).click();
  await page.route('**/rest/v1/rpc/complete_reading_mission', (r) => r.abort('internetdisconnected'));
  await page.getByRole('button', { name: 'Finalizar missão' }).click();
  await page.getByRole('button', { name: 'Concluí a leitura' }).click();
  await page.getByText('Finalização pendente').filter({ visible: true }).first().waitFor();
  await page.unroute('**/rest/v1/rpc/complete_reading_mission');
  for (let i = 0; i < 4 && !/\/home$/.test(page.url()); i++) {
    await page.goBack();
    await page.waitForTimeout(300);
  }
  await page.waitForURL(/\/home$/);
  await panel(page).getByText('Aguardando o servidor').waitFor({ timeout: 5000 });
  await inViewport(panel(page).getByRole('button', { name: 'Verificar resultado' }), 'Verificar resultado');
  await shot(page, 'fx-03-voltar-sessao-pendente-320');
  await panel(page).getByRole('button', { name: 'Verificar resultado' }).click();
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await page.getByText('Marco: a mobília do Tabernáculo — concluído').waitFor();
  step('voltar pelo navegador: o Início reflete a sessão ativa e depois a pendente, sem recarregar a página');

  // ================================================================ 3) aparelho novo: próximo capítulo inédito
  for (const ch of [1, 2, 3]) await readOnServer(ana.id, 'GEN', ch);
  const B = await phone(browser, 412, 915);
  await login(B.page, ana.email, 'Lia');
  // última leitura registrada no servidor é Gênesis 3 (as leituras desta conta vieram de "outro aparelho")
  await panel(B.page).getByText('Gênesis 4', { exact: true }).waitFor();
  assert.equal(await panel(B.page).getByText('Gênesis 1', { exact: true }).count(), 0);
  await shot(B.page, 'fx-04-aparelho-novo-proximo-capitulo-412');
  await panel(B.page).getByRole('button', { name: /^(Começar|Continuar) leitura$/ }).click();
  await B.page.getByTestId('selected-passage').filter({ visible: true }).getByText('Gênesis 4', { exact: true }).waitFor();
  // releitura por escolha
  await B.page.goto(`${APP}/home`);
  await panel(B.page).getByRole('button', { name: 'Escolher outro capítulo ou reler' }).click();
  await B.page.getByRole('radio', { name: /^Gênesis,/ }).click();
  await B.page.getByRole('radio', { name: /^Capítulo 2,/ }).click();
  const reread = B.page.getByTestId('selected-passage').filter({ visible: true });
  await reread.getByText('Releitura', { exact: false }).waitFor();
  await inViewport(reread.getByRole('button', { name: 'Iniciar missão: Gênesis 2' }), 'releitura escolhida no topo');
  await shot(B.page, 'fx-05-releitura-por-escolha-412');
  step('aparelho novo: sugere Gênesis 4 pelo progresso da conta (não Gênesis 1); releitura disponível por escolha');

  // ================================================================ 4) Mercado: confirmação só com o ID desta compra
  await db.query(`insert into siclos_ledger (user_id, event_type, source_event_id, amount) values ($1, 'TEST_GRANT', 'fix-market', 400)`, [ana.id]);
  const row = (await db.query(`select i.id, i.name, i.shop_price_suggested price from cosmetic_items i
    where i.shop_eligible and i.is_active and not i.is_starter and i.shop_price_suggested <= 400
      and not exists (select 1 from user_items ui where ui.user_id = $1 and ui.item_id = i.id)
    order by i.shop_price_suggested, i.id limit 1`, [ana.id])).rows[0];
  const balance = async () => Number((await db.query(`select coalesce(sum(amount),0) s from siclos_ledger where user_id = $1`, [ana.id])).rows[0].s);
  const before = await balance();
  page = B.page;
  await page.goto(`${APP}/market`);
  // a compra nem chega ao servidor
  await page.route('**/rest/v1/rpc/purchase_market_item', (r) => r.abort('internetdisconnected'));
  await page.getByRole('button', { name: `Comprar ${row.name}` }).click();
  await page.getByRole('button', { name: `Pagar ${row.price} Siclos` }).click();
  await page.getByText('Compra aguardando confirmação').waitFor();
  // o jogador obtém o mesmo item por outra via (ex.: outro aparelho / escolha gratuita)
  await db.query(`insert into user_items (user_id, item_id, source_event_id) values ($1, $2, 'test:outra-via')`, [ana.id, row.id]);
  // ao reabrir, a verificação também perde a resposta: a vitrine mostra o item como seu, mas o registro não tem esta compra
  await page.reload();
  await page.getByText(`Você já possui ${row.name}, obtido por outra via`, { exact: false }).waitFor();
  await page.getByText('Esta compra não foi registrada e nenhum Siclo foi cobrado', { exact: false }).waitFor();
  assert.equal(await page.getByText('Compra confirmada', { exact: false }).count(), 0, 'não confirma compra sem o ID dela no registro');
  assert.equal(await page.getByText('Compra aguardando confirmação').count(), 0);
  await page.unroute('**/rest/v1/rpc/purchase_market_item');
  assert.equal(Number((await db.query(`select count(*) from market_purchases where user_id = $1`, [ana.id])).rows[0].count), 0);
  assert.equal(await balance(), before, 'nada debitado');
  await shot(page, 'fx-06-mercado-posse-por-outra-via-412');
  // com resposta: o servidor recusa (item já possuído) e a tela comunica o mesmo estado real
  const row2 = (await db.query(`select i.id, i.name, i.shop_price_suggested price from cosmetic_items i
    where i.shop_eligible and i.is_active and not i.is_starter and i.shop_price_suggested <= 400
      and not exists (select 1 from user_items ui where ui.user_id = $1 and ui.item_id = i.id)
    order by i.shop_price_suggested, i.id limit 1`, [ana.id])).rows[0];
  await page.route('**/rest/v1/rpc/purchase_market_item', (r) => r.abort('internetdisconnected'));
  await page.getByRole('button', { name: `Comprar ${row2.name}` }).click();
  await page.getByRole('button', { name: `Pagar ${row2.price} Siclos` }).click();
  await page.getByText('Compra aguardando confirmação').waitFor();
  await db.query(`insert into user_items (user_id, item_id, source_event_id) values ($1, $2, 'test:outra-via')`, [ana.id, row2.id]);
  await page.unroute('**/rest/v1/rpc/purchase_market_item');
  await page.reload();
  await page.getByText(`Você já possui ${row2.name}, obtido por outra via`, { exact: false }).waitFor();
  assert.equal(await page.getByText('Compra confirmada', { exact: false }).count(), 0);
  assert.equal(await balance(), before);
  // e a compra de verdade continua confirmada só pelo próprio ID (a resposta se perde depois do registro)
  const row3 = (await db.query(`select i.id, i.name, i.shop_price_suggested price from cosmetic_items i
    where i.shop_eligible and i.is_active and not i.is_starter and i.shop_price_suggested <= 400
      and not exists (select 1 from user_items ui where ui.user_id = $1 and ui.item_id = i.id)
    order by i.shop_price_suggested, i.id limit 1`, [ana.id])).rows[0];
  await page.route('**/rest/v1/rpc/purchase_market_item', async (r) => { await r.fetch(); await r.abort('connectionreset'); });
  await page.getByRole('button', { name: `Comprar ${row3.name}` }).click();
  await page.getByRole('button', { name: `Pagar ${row3.price} Siclos` }).click();
  await page.getByText(`Compra confirmada: ${row3.name}`, { exact: false }).waitFor();
  await page.unroute('**/rest/v1/rpc/purchase_market_item');
  assert.equal(Number((await db.query(`select count(*) from market_purchases where user_id = $1 and item_id = $2`, [ana.id, row3.id])).rows[0].count), 1);
  assert.equal(await balance(), before - row3.price);
  step('Mercado: posse por outra via comunicada (compra não registrada, nada cobrado), sem "Compra confirmada"; confirmação só com o ID da própria compra');

  // ================================================================ identidade em Ler e Perfil (320 e 412 px)
  for (const [P, w] of [[A, 320], [B, 412]]) {
    await P.page.goto(`${APP}/read`);
    await P.page.getByText('Modo Missão', { exact: true }).first().waitFor();
    await P.page.waitForTimeout(500);
    assert.equal(await P.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, `Ler ${w}px sem rolagem lateral`);
    await shot(P.page, `fx-07-ler-${w}`);
    await P.page.goto(`${APP}/profile`);
    const ach = P.page.getByTestId('profile-achievements').filter({ visible: true });
    await ach.waitFor();
    await ach.getByText('Mundos concluídos').waitFor();
    await ach.getByText('Marcos cumpridos').waitFor();
    assert.equal(await P.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, `Perfil ${w}px sem rolagem lateral`);
    await ach.scrollIntoViewIfNeeded();
    await shot(P.page, `fx-08-perfil-${w}`);
  }
  step('Ler e Perfil na identidade da jornada, com as conquistas da conta (marcos, Santos, mundos), em 320 e 412 px');

  await browser.close();
  await db.end();
  console.log('✔ Quatro correções verificadas.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
