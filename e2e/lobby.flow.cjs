/* eslint-disable */
// Lobby do jogo no Início: HUD (retrato, nível, XP, Siclos, capítulos), trilho lateral (Loja,
// Vestiário, Troféus, Marcos), painel de jogar sem rolagem, missão diária, modos de jogo e a doca
// com o medalhão de leitura, em 320 e 412 px. `FLOW=lobby bash e2e/run.sh`
const { chromium } = require('playwright');
const pg = require('pg');
const fs = require('node:fs');
const assert = require('node:assert/strict');

const APP = process.env.APP_URL ?? 'http://localhost:8081';
const SHOTS = process.env.SHOTS_DIR ?? `${__dirname}/screenshots`;
const db = new pg.Client({ host: process.env.PGHOST, port: Number(process.env.PGPORT), user: 'postgres', database: 'jb_test' });
const step = (msg) => console.log(`  ✔ ${msg}`);
const pick = async (page, tab, option) => {
  await page.getByRole('tab', { name: tab, exact: true }).click();
  await page.getByRole('radio', { name: option, exact: true }).click();
};
const noOverflow = async (page, label) =>
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, `rolagem horizontal: ${label}`);
const inViewport = async (loc, label) => {
  const box = await loc.boundingBox();
  const vh = loc.page().viewportSize().height;
  assert.ok(box && box.y >= 0 && box.y + box.height <= vh - 72, `${label} visível sem rolagem (y ${box && Math.round(box.y + box.height)} de ${vh - 72})`);
};

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  await db.connect();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, timezoneId: 'America/Sao_Paulo', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('pageerror:', e.message));
  const email = `rute+${Date.now()}@teste.local`;

  await page.goto(APP);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill('senha-forte-123');
  await page.getByRole('button', { name: 'Criar conta' }).last().click();
  await page.getByText('Como você quer ser chamado?').waitFor();
  await page.getByLabel('Nome de exibição').fill('Rute');
  await page.getByLabel('Nome de usuário').fill('rute_lobby');
  await page.getByText('Disponível').waitFor();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByText('Criar personagem').waitFor();
  await pick(page, 'Modelo', 'Modelo B');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Finalizar personagem' }).click();
  await page.getByText('Qual é o seu ritmo?').waitFor();
  await page.getByRole('button', { name: 'Começar a jornada' }).click();
  await page.getByText('Paz, Rute!').waitFor();
  const uid = (await db.query(`select id from profiles where username = 'rute_lobby'`)).rows[0].id;
  // progresso de exemplo: 12 capítulos de Gênesis (480 XP → nível 2) e saldo de 120 Siclos
  for (let c = 1; c <= 12; c++) {
    await db.query(`insert into xp_ledger (user_id, event_type, source_event_id, amount) values ($1, 'TEST_GRANT', 'lobby:' || $2::text, 40)`, [uid, c]);
    await db.query(`select private.record_event($1, 'CHAPTER_COMPLETED', 'chapter:GEN.' || $2::int, jsonb_build_object('book', 'GEN', 'chapter', $2::int))`, [uid, c]);
  }
  await db.query(`insert into siclos_ledger (user_id, event_type, source_event_id, amount) values ($1, 'TEST_GRANT', 'lobby', 120)`, [uid]);

  for (const [w, h] of [[412, 915], [320, 640]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(`${APP}/home`);
    const hud = page.getByTestId('lobby-hud').filter({ visible: true });
    await hud.waitFor();
    await hud.getByText('120', { exact: true }).waitFor();
    await page.getByRole('button', { name: /^Rute, nível 2\./ }).waitFor();
    await page.waitForTimeout(1500);
    await noOverflow(page, `lobby ${w}`);
    for (const name of ['Mercado dos Viajantes', 'Guarda-roupa', 'Santuário das Conquistas', 'Marcos dos Santos']) {
      await page.getByTestId('lobby-rail').filter({ visible: true }).getByRole('button', { name, exact: true }).waitFor();
    }
    await inViewport(page.getByRole('button', { name: 'Começar leitura' }).filter({ visible: true }), `Começar leitura ${w}`);
    await page.screenshot({ path: `${SHOTS}/lb-01-lobby-${w}.png` });
    await page.getByTestId('lobby-daily').filter({ visible: true }).scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/lb-02-missao-diaria-${w}.png` });
    await page.getByTestId('mode-sanctuary').filter({ visible: true }).scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await noOverflow(page, `modos ${w}`);
    await page.screenshot({ path: `${SHOTS}/lb-03-modos-${w}.png` });
    step(`${w} px: HUD (nível 2, 120 Siclos, 12 capítulos), trilho com Loja, Vestiário, Troféus e Marcos, e "Começar leitura" sem rolagem`);
  }
  await page.setViewportSize({ width: 412, height: 915 });

  // cada função leva ao seu lugar
  const go = async (loc, check, label) => {
    await page.goto(`${APP}/home`);
    await page.getByTestId('lobby-hud').filter({ visible: true }).waitFor();
    await loc().click();
    await check();
    step(label);
  };
  await go(() => page.getByTestId('lobby-siclos').filter({ visible: true }), () => page.getByText('Saldo: 120 Siclos').first().waitFor(), 'Siclos do HUD abrem o Mercado com o mesmo saldo');
  await go(() => page.getByTestId('lobby-rail').filter({ visible: true }).getByRole('button', { name: 'Guarda-roupa', exact: true }), () => page.getByRole('button', { name: 'Salvar' }).waitFor(), 'Vestiário abre o guarda-roupa');
  await go(() => page.getByTestId('mode-map').filter({ visible: true }), () => page.getByTestId('journey-atlas').filter({ visible: true }).waitFor(), 'modo Mapa dos mundos abre a Jornada');
  await go(() => page.getByTestId('mode-mission').filter({ visible: true }), () => page.getByText('Modo Missão', { exact: true }).filter({ visible: true }).first().waitFor(), 'Modo Missão abre a aba Ler');
  await go(() => page.getByRole('tab', { name: 'Ler' }), () => page.getByText('Modo Missão', { exact: true }).filter({ visible: true }).first().waitFor(), 'medalhão Ler da doca abre a aba Ler');
  await page.goto(`${APP}/home`);
  await page.getByTestId('lobby-hud').filter({ visible: true }).waitFor();
  await page.getByRole('button', { name: /^Rute, nível 2\./ }).click();
  await page.getByTestId('profile-achievements').filter({ visible: true }).waitFor();
  step('retrato do HUD abre o Perfil');

  await browser.close();
  await db.end();
  console.log('✔ Lobby verificado.');
})().catch((e) => { console.error(e); process.exit(1); });
