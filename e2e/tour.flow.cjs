/* eslint-disable */
// Tour de capturas de todas as telas principais (revisão visual). `FLOW=tour bash e2e/run.sh`
const { chromium } = require('playwright');
const pg = require('pg');
const fs = require('node:fs');
const APP = process.env.APP_URL ?? 'http://localhost:8081';
const SHOTS = process.env.SHOTS_DIR ?? `${__dirname}/screenshots`;
const db = new pg.Client({ host: process.env.PGHOST, port: Number(process.env.PGPORT), user: 'postgres', database: 'jb_test' });
const pick = async (page, tab, option) => {
  await page.getByRole('tab', { name: tab, exact: true }).click();
  await page.getByRole('radio', { name: option, exact: true }).click();
};
(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  await db.connect();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, timezoneId: 'America/Sao_Paulo', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => { errors.push(e.message); console.error('pageerror:', e.message); });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(APP);
  await page.screenshot({ path: `${SHOTS}/tour-00-welcome.png`, fullPage: true });
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.getByLabel('E-mail').fill(`tour+${Date.now()}@teste.local`);
  await page.getByLabel('Senha', { exact: true }).fill('senha-forte-123');
  await page.getByRole('button', { name: 'Criar conta' }).last().click();
  await page.getByText('Como você quer ser chamado?').waitFor();
  await page.getByLabel('Nome de exibição').fill('Rute');
  await page.getByLabel('Nome de usuário').fill('rute_tour');
  await page.getByText('Disponível').waitFor();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByText('Escolha seu viajante').waitFor();
  await page.getByRole('radio', { name: 'Pastor de ovelhas' }).click();
  await page.getByRole('radio', { name: 'Estilo 2 de Pastor de ovelhas' }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOTS}/tour-01-onb-avatar.png`, fullPage: true });
  await page.getByRole('button', { name: 'Começar com esta skin' }).click();
  await page.getByText('Qual é o seu ritmo?').waitFor();
  await page.screenshot({ path: `${SHOTS}/tour-02-onb-pace.png`, fullPage: true });
  await page.getByRole('button', { name: 'Começar a jornada' }).click();
  await page.getByText('Paz, Rute!').waitFor();
  const uid = (await db.query(`select id from profiles where username = 'rute_tour'`)).rows[0].id;
  for (let c = 1; c <= 12; c++) {
    await db.query(`insert into xp_ledger (user_id, event_type, source_event_id, amount) values ($1, 'TEST_GRANT', 'tour:' || $2::text, 40)`, [uid, c]);
    await db.query(`select private.record_event($1, 'CHAPTER_COMPLETED', 'chapter:GEN.' || $2::int, jsonb_build_object('book', 'GEN', 'chapter', $2::int))`, [uid, c]);
  }
  await db.query(`insert into siclos_ledger (user_id, event_type, source_event_id, amount) values ($1, 'TEST_GRANT', 'tour', 420)`, [uid]);
  const routes = (process.env.TOUR_ROUTES ?? '/home,/journey,/read,/friends,/profile,/market,/vestiario,/world/origens,/world/reinos,/world/sabedoria,/world/profetas,/world/evangelhos,/world/igreja,/world/nova-criacao,/reading/milestones,/reading/trail,/settings/pace,/users/rute_tour').split(',');
  for (const [w, h] of [[412, 915], [320, 640]]) {
    await page.setViewportSize({ width: w, height: h });
    for (const r of routes) {
      await page.goto(APP + r);
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(1500);
      const name = r.replace(/^\//, '').replace(/[\/\[\]]/g, '_') || 'root';
      await page.screenshot({ path: `${SHOTS}/tour-${w}-${name}.png`, fullPage: true });
      const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      console.log(`  ${w} ${r}${over ? '  ⚠ rolagem horizontal' : ''}`);
    }
  }
  console.log('erros:', errors.length ? [...new Set(errors)].slice(0, 15).join('\n') : 'nenhum');
  await browser.close(); await db.end();
})().catch((e) => { console.error(e); process.exit(1); });
