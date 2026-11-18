/* eslint-disable */
// Percurso de jogo: dois viajantes com skins diferentes → troca no Vestiário refletida no acampamento →
// marco de Êxodo 25 (sessão, reabrir, resposta perdida, recibo) → páginas dos mundos → movimento reduzido.
// Roda contra o banco real (Postgres + migrações) via e2e/fake-supabase.mjs: `FLOW=journey bash e2e/run.sh`.
const { chromium } = require('playwright');
const pg = require('pg');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { diffRatio, sameLook } = require('./pixels.cjs');
const { openReadingReceipt } = require('./reading-rewards.cjs');

const APP = process.env.APP_URL ?? 'http://localhost:8081';
const SHOTS = process.env.SHOTS_DIR ?? `${__dirname}/screenshots`;
const db = new pg.Client({ host: process.env.PGHOST, port: Number(process.env.PGPORT), user: 'postgres', database: 'jb_test' });
const step = (msg) => console.log(`  ✔ ${msg}`);
const shot = (page, name) => page.screenshot({ path: `${SHOTS}/${name}.png` });
const noOverflow = async (page, label) =>
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, `rolagem horizontal: ${label}`);
const inViewport = async (locator, label) => {
  const box = await locator.boundingBox();
  const vh = locator.page().viewportSize().height;
  assert.ok(box && box.y >= 0 && box.y + box.height <= vh, `${label} visível sem rolagem (y=${box?.y}, h=${box?.height}, viewport ${vh})`);
};

async function phone(browser, width, height, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, timezoneId: 'America/Sao_Paulo', ...opts });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('pageerror:', e.message));
  return { ctx, page };
}

async function onboard(page, { name, user, skin, style }) {
  await page.goto(APP);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.getByLabel('E-mail').fill(`${user}+${Date.now()}@teste.local`);
  await page.getByLabel('Senha', { exact: true }).fill('senha-forte-123');
  await page.getByRole('button', { name: 'Criar conta' }).last().click();
  await page.getByText('Como você quer ser chamado?').waitFor();
  await page.getByLabel('Nome de exibição').fill(name);
  await page.getByLabel('Nome de usuário').fill(user);
  await page.getByText('Disponível').waitFor();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByText('Escolha seu viajante').waitFor();
  await page.getByRole('radio', { name: skin, exact: true }).click();
  await page.getByRole('radio', { name: `Estilo ${style} de ${skin}` }).click();
  await page.getByRole('button', { name: 'Começar com esta skin' }).click();
  await page.getByText('Qual é o seu ritmo?').waitFor();
  await page.getByRole('button', { name: 'Começar a jornada' }).click();
  await page.getByText(`Paz, ${name}!`).waitFor();
  return (await db.query('select id from profiles where username = $1', [user])).rows[0].id;
}
const worn = async (userId) => (await db.query('select skin_id, style from user_skin_selection where user_id = $1', [userId])).rows[0];
const wornVariant = async (userId) => (await db.query('select variant from user_skin_selection where user_id = $1', [userId])).rows[0].variant;
const campAvatar = (page) => page.getByRole('img', { name: /^Seu personagem no acampamento/ });
const finishHere = async (page) => {
  await page.getByRole('button', { name: 'Finalizar missão' }).click();
  await page.getByRole('button', { name: 'Concluí a leitura' }).click();
};
async function steady(locator) {
  let last = await locator.screenshot();
  for (let i = 0; i < 10; i++) {
    await locator.page().waitForTimeout(400);
    const now = await locator.screenshot();
    if (now.equals(last)) return now;
    last = now;
  }
  return last;
}

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  await db.connect();
  const browser = await chromium.launch();

  // ================================================================ dois viajantes, duas skins
  const A = await phone(browser, 320, 640, { reducedMotion: 'reduce' });
  const rute = await onboard(A.page, { name: 'Rute', user: 'rute_proto', skin: 'Pastor de ovelhas', style: 1 });
  const B = await phone(browser, 412, 915, { reducedMotion: 'reduce' });
  const davi = await onboard(B.page, { name: 'Davi', user: 'davi_proto', skin: 'Peregrino do Êxodo', style: 3 });
  assert.deepEqual(await worn(rute), { skin_id: 'comum_pastor', style: 1 });
  assert.deepEqual(await worn(davi), { skin_id: 'comum_peregrino_exodo', style: 3 });
  const labels = {};
  for (const [P, tag, w] of [[A, 'rute', 320], [B, 'davi', 412]]) {
    await P.page.goto(`${APP}/home`);
    await campAvatar(P.page).waitFor();
    labels[tag] = await campAvatar(P.page).getAttribute('aria-label');
    await inViewport(P.page.getByRole('button', { name: 'Começar leitura' }), `ação principal (${w}px)`);
    await noOverflow(P.page, `Início ${w}px`);
    await shot(P.page, `j-${tag}-camp-${w}`);
  }
  assert.notEqual(labels.rute, labels.davi, 'skins diferentes descrevem viajantes diferentes');
  step('dois viajantes com skins e estilos diferentes no acampamento; "Começar leitura" sem rolagem em 320 e 412 px');

  // ================================================================ troca no Vestiário → acampamento → reabrir
  const before = await steady(campAvatar(A.page));
  await A.page.goto(`${APP}/vestiario`);
  await A.page.getByTestId('vestiario-comum_peregrino_exodo').click();
  await A.page.getByRole('radio', { name: 'Estilo 2 de Peregrino do Êxodo' }).click();
  await A.page.getByRole('button', { name: 'Vestir o estilo 2' }).click();
  await A.page.getByText('Pronto: você está vestindo Peregrino do Êxodo, estilo 2.').waitFor();
  await shot(A.page, 'j-vestiario-320');
  await A.page.goto(`${APP}/home`);
  await campAvatar(A.page).waitFor();
  const after = await steady(campAvatar(A.page));
  assert.ok(diffRatio(before, after) > 0.002, 'o acampamento deve mostrar a skin trocada');
  await A.page.reload();
  await campAvatar(A.page).waitFor();
  const reopened = await steady(campAvatar(A.page));
  assert.ok(sameLook(after, reopened), `após reabrir, o acampamento mostra a mesma skin (diferença ${(diffRatio(after, reopened) * 100).toFixed(2)}%)`);
  assert.deepEqual(await worn(rute), { skin_id: 'comum_peregrino_exodo', style: 2 });
  step('troca de skin no Vestiário aparece no acampamento e continua igual após reabrir o app');

  // apresentação feminina pintada do mesmo traje (Peregrina do Êxodo), salva no servidor
  await A.page.goto(`${APP}/vestiario`);
  await A.page.getByTestId('vestiario-comum_peregrino_exodo').click();
  await A.page.getByRole('radio', { name: 'Apresentação: Peregrina do Êxodo' }).click();
  await A.page.getByTestId('vestiario-name').getByText('Peregrina do Êxodo').waitFor();
  await A.page.getByRole('button', { name: 'Vestir o estilo 2' }).click();
  await A.page.getByText('Pronto: você está vestindo Peregrina do Êxodo, estilo 2.').waitFor();
  assert.equal(await wornVariant(rute), 'feminino');
  await shot(A.page, 'j-vestiario-feminino-320');
  await A.page.goto(`${APP}/home`);
  assert.ok((await campAvatar(A.page).getAttribute('aria-label')).includes('Peregrina do Êxodo, estilo 2'), 'o acampamento mostra a Peregrina');
  await shot(A.page, 'j-camp-feminino-320');
  step('apresentação feminina pintada (Peregrina do Êxodo) escolhida no Vestiário, salva no servidor e mostrada no acampamento');

  // ================================================================ marco de Êxodo 25 (320 px)
  const page = A.page;
  await page.goto(`${APP}/read`);
  await page.getByRole('button', { name: 'Ver todos os marcos' }).click();
  await page.getByRole('link', { name: /^Marco: a mobília do Tabernáculo, Êxodo 25, A cumprir$/ }).click();
  await page.getByTestId('tabernacle-stage').waitFor();
  assert.equal(await page.getByText('Pode receber').count(), 0, 'sem peças no marco');
  await inViewport(page.getByRole('button', { name: 'Iniciar marco: Êxodo 25' }), 'Iniciar marco (320px)');
  await noOverflow(page, 'detalhe do marco');
  await shot(page, 'j-02-marco-exodo25-320');
  step('detalhe do marco: cena do Tabernáculo (Arca, Mesa e Candelabro) e Iniciar sem rolagem');

  await page.getByRole('button', { name: 'Iniciar marco: Êxodo 25' }).click();
  await page.getByTestId('session-milestone').waitFor();
  await inViewport(page.getByRole('button', { name: 'Pausar' }), 'Pausar');
  await inViewport(page.getByRole('button', { name: 'Finalizar missão' }), 'Finalizar missão');
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Pausar' }).click();
  await shot(page, 'j-03-leitura-pausada-320');
  // fechar e reabrir: o Início prioriza a sessão vinculada ao marco
  await page.reload();
  await page.goto(`${APP}/home`);
  const panel = page.getByTestId('home-action-panel');
  await panel.getByText('Leitura em andamento').waitFor();
  await panel.getByText('Marco: a mobília do Tabernáculo', { exact: false }).waitFor();
  await inViewport(panel.getByRole('button', { name: 'Continuar leitura' }), 'Continuar leitura');
  await shot(page, 'j-01b-inicio-sessao-ativa-320');
  await panel.getByRole('button', { name: 'Continuar leitura' }).click();
  await page.getByTestId('session-milestone').waitFor();
  await page.getByRole('button', { name: 'Retomar' }).click();
  await page.waitForTimeout(1100);
  // resposta perdida na finalização: o servidor registra, mas a resposta não chega
  await page.route('**/rest/v1/rpc/complete_reading_mission', async (r) => { await r.fetch(); await r.abort('connectionreset'); });
  await finishHere(page);
  await page.getByText('Finalização pendente').filter({ visible: true }).first().waitFor();
  await page.unroute('**/rest/v1/rpc/complete_reading_mission');
  const done = async (uid) => Number((await db.query(`select count(*) from reading_sessions where user_id = $1 and milestone_id = 'marco_mobilia_do_tabernaculo'`, [uid])).rows[0].count);
  assert.equal(await done(rute), 1, 'o servidor já registrou o marco');
  await page.reload();
  await page.goto(`${APP}/home`);
  await panel.getByText('Aguardando o servidor').waitFor();
  await inViewport(panel.getByRole('button', { name: 'Verificar resultado' }), 'Verificar resultado');
  await shot(page, 'j-01c-inicio-pendente-320');
  await panel.getByRole('button', { name: 'Verificar resultado' }).click();
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  const recovered = await openReadingReceipt(page);
  await recovered.getByTestId('receipt-xp').waitFor();
  assert.equal(await recovered.getByTestId(/^receipt-item-/).count(), 0, 'recibo sem peças');
  await noOverflow(page, 'recibo');
  await shot(page, 'j-04-recibo-320');
  await recovered.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByText('Marco: a mobília do Tabernáculo — concluído').waitFor();
  assert.equal(await done(rute), 1, 'um único registro');
  // reabrir a tela de resultado não repete a bolsa
  await page.goto(`${APP}/reading/completed`);
  await page.getByText('Marco: a mobília do Tabernáculo — concluído').waitFor();
  assert.equal(await page.getByTestId('reveal-overlay').count(), 0);
  step('marco: pausa, retomada após reabrir, resposta perdida recuperada uma vez, recibo com XP e sem repetir a bolsa');

  // ================================================================ página do mundo das Origens
  await page.goto(`${APP}/journey`);
  await page.getByTestId('journey-pin-origens').click();
  await page.getByTestId('journey-enter-origens').filter({ visible: true }).click();
  await page.getByTestId('world-hero-origens').waitFor();
  await page.getByText('1/7', { exact: true }).waitFor();
  await page.getByTestId('world-book-EXO').waitFor();
  await noOverflow(page, 'mundo das Origens 320');
  await shot(page, 'j-06-mundo-origens-320');
  await page.getByTestId('world-book-EXO').click();
  await page.getByRole('button', { name: 'Iniciar missão: Êxodo 1' }).waitFor();
  step('mapa → Entrar no mundo: página das Origens com o marco cumprido (1 de 7) e a trilha dos livros abrindo a leitura');

  for (const id of ['origens', 'reinos', 'sabedoria', 'profetas', 'evangelhos', 'igreja', 'nova-criacao']) {
    await B.page.goto(`${APP}/world/${id}`);
    await B.page.getByTestId(`world-hero-${id}`).waitFor();
    await B.page.waitForTimeout(300);
    await noOverflow(B.page, `mundo ${id}`);
    await shot(B.page, `j-07-mundo-${id}-412`);
  }
  step('os sete mundos têm página própria (cena, livros, marcos e skins) sem rolagem lateral em 412 px');

  // ================================================================ leitura comum de Êxodo 25 (Davi)
  await B.page.goto(`${APP}/read`);
  await B.page.getByRole('radio', { name: /^Êxodo,/ }).click();
  await B.page.getByRole('radio', { name: 'Capítulo 25', exact: true }).click();
  await B.page.getByRole('button', { name: 'Iniciar missão: Êxodo 25' }).click();
  await finishHere(B.page);
  const ordinary = await openReadingReceipt(B.page);
  await ordinary.getByTestId('receipt-xp').waitFor();
  await ordinary.getByRole('button', { name: 'Continuar', exact: true }).click();
  await B.page.getByText('Este capítulo também tem o “Marco: a mobília do Tabernáculo”.').first().waitFor();
  assert.equal(await done(davi), 0, 'leitura comum não cumpre o marco');
  step('leitura comum de Êxodo 25: XP habitual e o aviso de como cumprir o marco');

  // ================================================================ Lendárias conquistadas lendo
  // Rute já leu Êx 25 (marco); o resto de Êxodo pelo mesmo caminho do servidor, menos o capítulo 40
  for (let c = 1; c <= 39; c++) {
    await db.query(`select private.record_event($1, 'CHAPTER_COMPLETED', 'chapter:EXO.' || $2::int, jsonb_build_object('book', 'EXO', 'chapter', $2::int))`, [rute, c]);
  }
  const ruteSkins = async () => (await db.query(`select skin_id from user_skins where user_id = $1 and source_event_id like 'skin-reading:%' order by skin_id`, [rute])).rows.map((r) => r.skin_id);
  assert.deepEqual(await ruteSkins(), [], 'com 39 de 40 capítulos, nenhuma Lendária ainda');
  await page.goto(`${APP}/vestiario`);
  await page.getByRole('tab', { name: /^Todas/ }).click();
  await page.getByTestId('vestiario-lendario_moises').click();
  await page.getByTestId('vestiario-progress').getByText('39 de 40').waitFor();
  await shot(page, 'j-08-vestiario-progresso-320');
  await page.goto(`${APP}/read`);
  await page.getByRole('radio', { name: /^Êxodo,/ }).click();
  await page.getByRole('radio', { name: 'Capítulo 40', exact: true }).click();
  await page.getByRole('button', { name: 'Iniciar missão: Êxodo 40' }).click();
  await finishHere(page);
  const pouch40 = await openReadingReceipt(page);
  await pouch40.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByTestId('new-skin-lendario_moises').waitFor();
  await page.getByTestId('new-skin-lendario_arao').waitFor();
  assert.deepEqual(await ruteSkins(), ['lendario_arao', 'lendario_moises']);
  await shot(page, 'j-09-nova-skin-320');
  await page.getByTestId('new-skin-lendario_moises').getByRole('button', { name: 'Vestir agora' }).click();
  await page.getByText('Pronto: você está vestindo Manto de Moisés, estilo 1.').waitFor();
  assert.deepEqual(await worn(rute), { skin_id: 'lendario_moises', style: 1 });
  // a comemoração não se repete ao reabrir o resultado
  await page.goto(`${APP}/reading/completed`);
  await page.getByText('Missão concluída').first().waitFor();
  await page.waitForTimeout(800);
  assert.equal(await page.getByTestId('new-skin-lendario_moises').count(), 0);
  step('ler o último capítulo de Êxodo pelo app concede o Manto de Moisés e as Vestes de Arão (progresso 39 de 40 antes), comemora uma vez e veste com um toque');

  // ================================================================ movimento reduzido
  const M = await phone(browser, 320, 640, { reducedMotion: 'reduce' });
  await onboard(M.page, { name: 'Ester', user: 'ester_proto', skin: 'Peregrino do Êxodo', style: 1 });
  await M.page.goto(`${APP}/reading/milestone/marco_mobilia_do_tabernaculo`);
  await M.page.getByRole('button', { name: 'Iniciar marco: Êxodo 25' }).click();
  await M.page.waitForTimeout(1100);
  await finishHere(M.page);
  const reduced = M.page.getByTestId('reveal-overlay');
  await reduced.getByRole('button', { name: 'Abrir bolsa' }).click();
  await reduced.getByTestId('reveal-xp').waitFor();
  const rewardMotion = () => reduced.getByTestId('reveal-xp').evaluate((element) => {
    const style = getComputedStyle(element);
    return { opacity: style.opacity, transform: style.transform };
  });
  const o1 = await rewardMotion();
  await M.page.waitForTimeout(700);
  assert.equal(o1.opacity, '1');
  assert.deepEqual(await rewardMotion(), o1, 'movimento reduzido: revelação estática');
  await shot(M.page, 'j-04c-revelacao-movimento-reduzido-320');
  await M.page.goto(`${APP}/home`);
  await campAvatar(M.page).waitFor();
  await M.page.waitForTimeout(500);
  const h1 = await M.page.getByTestId('camp-hero').screenshot();
  await M.page.waitForTimeout(800);
  const h2 = await M.page.getByTestId('camp-hero').screenshot();
  assert.ok(h1.equals(h2), 'movimento reduzido: acampamento estático');
  await M.ctx.close();
  step('movimento reduzido: bolsa de recompensas e acampamento estáticos');

  await browser.close();
  await db.end();
  console.log('✔ Percurso de jogo concluído.');
})().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
