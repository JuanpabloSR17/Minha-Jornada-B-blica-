/* eslint-disable */
// Prova 3D do personagem: GLB com esqueleto e materiais iluminados em tempo real, rotação (frente, lado,
// costas, arraste), repouso animado, troca de aparência/peças com os dados da conta, persistência após
// reabrir e luz do guarda-roupa × acampamento. `FLOW=avatar3d bash e2e/run.sh`
const { chromium } = require('playwright');
const pg = require('pg');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { PNG } = require('pngjs');
const { diffRatio } = require('./pixels.cjs');

const APP = process.env.APP_URL ?? 'http://localhost:8081';
const SHOTS = process.env.SHOTS_DIR ?? `${__dirname}/screenshots`;
const VIDEOS = `${SHOTS}/videos`;
const db = new pg.Client({ host: process.env.PGHOST, port: Number(process.env.PGPORT), user: 'postgres', database: 'jb_test' });
const step = (msg) => console.log(`  ✔ ${msg}`);
const shot = async (page, name) => {
  // o palco no alto da tela (os controles ficam abaixo e a página pode ter rolado)
  await page.getByTestId('stage-3d').scrollIntoViewIfNeeded().catch(() => undefined);
  await page.evaluate(() => { for (const el of document.querySelectorAll('*')) if (el.scrollTop > 0) el.scrollTop = 0; });
  await page.waitForTimeout(150);
  return page.screenshot({ path: `${SHOTS}/${name}.png` });
};
const pick = async (page, tab, option) => {
  await page.getByRole('tab', { name: tab, exact: true }).click();
  await page.getByRole('radio', { name: option, exact: true }).click();
};
const probe = (page) => page.evaluate(() => ({ ...globalThis.__jb3d }));
/** Fração de pixels do palco que não são o fundo: o personagem está sendo desenhado. */
function coverage(buf, bg) {
  const p = PNG.sync.read(buf);
  let n = 0;
  for (let i = 0; i < p.data.length; i += 4) {
    const d = Math.abs(p.data[i] - bg[0]) + Math.abs(p.data[i + 1] - bg[1]) + Math.abs(p.data[i + 2] - bg[2]);
    if (d > 30) n++;
  }
  return n / (p.width * p.height);
}

(async () => {
  fs.mkdirSync(VIDEOS, { recursive: true });
  await db.connect();
  const browser = await chromium.launch();
  const email = `davi3d+${Date.now()}@teste.local`;

  // ---------------------------------------------------------------- conta (Tom 4, cabelo curto) com a túnica de linho
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, timezoneId: 'America/Sao_Paulo', recordVideo: { dir: VIDEOS, size: { width: 412, height: 915 } } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('pageerror:', e.message));
  await page.goto(APP);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill('senha-forte-123');
  await page.getByRole('button', { name: 'Criar conta' }).last().click();
  await page.getByText('Como você quer ser chamado?').waitFor();
  await page.getByLabel('Nome de exibição').fill('Davi');
  await page.getByLabel('Nome de usuário').fill('davi_3d');
  await page.getByText('Disponível').waitFor();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByText('Criar personagem').waitFor();
  await pick(page, 'Modelo', 'Modelo B');
  await pick(page, 'Tom de pele', 'Tom 2');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Finalizar personagem' }).click();
  await page.getByText('Qual é o seu ritmo?').waitFor();
  await page.getByRole('button', { name: 'Começar a jornada' }).click();
  await page.getByText('Paz, Davi!').waitFor();
  const uid = (await db.query(`select id from profiles where username = 'davi_3d'`)).rows[0].id;

  // ---------------------------------------------------------------- palco 3D pelo guarda-roupa
  await page.goto(`${APP}/avatar/wardrobe`);
  await page.getByRole('button', { name: 'Ver em 3D' }).click();
  await page.getByTestId('stage-3d').waitFor();
  const t0 = Date.now();
  await page.waitForFunction(() => globalThis.__jb3d?.loaded, null, { timeout: 30000 });
  const loadMs = Date.now() - t0;
  await page.waitForTimeout(1200);
  // fluidez: quadros desenhados em 3 s
  const f0 = (await probe(page)).frames;
  await page.waitForTimeout(3000);
  const fps = ((await probe(page)).frames - f0) / 3;
  const stage = page.getByTestId('stage-3d');
  const front = await stage.screenshot();
  const cov = coverage(front, [0x2a, 0x24, 0x36]);
  assert.ok(cov > 0.04, `personagem desenhado no palco (${(cov * 100).toFixed(1)}% do palco)`);
  assert.equal((await probe(page)).clip, 'idle');
  await shot(page, '3d-01-frente-guarda-roupa-412');
  step(`GLB carregado em ${loadMs} ms; repouso animado a ~${fps.toFixed(0)} quadros/s (navegador sem GPU); personagem cobre ${(cov * 100).toFixed(1)}% do palco`);

  // animação de repouso: o quadro muda com o tempo
  const a1 = await stage.screenshot();
  await page.waitForTimeout(1600);
  const a2 = await stage.screenshot();
  assert.ok(diffRatio(a1, a2, 12) > 0.0005, 'repouso animado (respiração e peso)');

  // ---------------------------------------------------------------- frente, lado, costas e arraste
  const views = {};
  for (const [label, file] of [['Lado', '3d-02-lado'], ['Costas', '3d-03-costas'], ['Frente', null]]) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await page.waitForTimeout(900);
    views[label] = await stage.screenshot();
    if (file) await shot(page, `${file}-412`);
  }
  const angleBack = (await probe(page)).angle;
  assert.ok(Math.abs(angleBack) < 0.05, 'volta para a frente');
  assert.ok(diffRatio(views.Lado, views.Costas) > 0.02 && diffRatio(views.Lado, front) > 0.02, 'lado e costas são vistas diferentes');
  const box = await stage.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 130, box.y + box.height / 2, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(700);
  const dragged = (await probe(page)).angle;
  assert.ok(Math.abs(dragged) > 0.8, `arrastar gira o personagem (${dragged.toFixed(2)} rad)`);
  step('frente, lado e costas por botão e rotação por arraste');

  // ---------------------------------------------------------------- troca de aparência e peças (dados da conta) e salvar
  await page.getByRole('button', { name: 'Frente', exact: true }).click();
  await page.getByRole('radio', { name: 'Tom de pele: Tom 5' }).click();
  await page.getByRole('radio', { name: 'Cabelo: Longo ondulado' }).click();
  await page.getByRole('radio', { name: 'Manto Noturno: Vestir' }).click();
  await page.getByRole('radio', { name: 'Cajado de Pastor: Segurar' }).click();
  await page.waitForTimeout(1200);
  assert.equal((await probe(page)).clip, 'idle_staff', 'com o cajado, o braço direito o segura');
  await shot(page, '3d-04-manto-cajado-cabelo-longo-412');
  await page.getByRole('button', { name: 'Lado', exact: true }).click();
  await page.waitForTimeout(900);
  await shot(page, '3d-05-lado-cajado-412');
  await page.getByRole('button', { name: 'Costas', exact: true }).click();
  await page.waitForTimeout(900);
  await shot(page, '3d-06-costas-manto-412');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByText('Visual salvo.').waitFor();
  const saved = (await db.query(`select a.skin_tone_id s, a.hair_style_id h,
    (select jsonb_object_agg(e.slot, e.item_id) from avatar_loadout_equipment e join avatar_loadouts l on l.id = e.loadout_id where l.user_id = $1 and l.is_active) eq
    from avatar_appearances a where a.user_id = $1`, [uid])).rows[0];
  assert.equal(saved.s, 'skin-5');
  assert.equal(saved.h, 'hair-long-wavy');
  assert.equal(saved.eq.back, 'cloak-night');
  assert.equal(saved.eq.hands, 'staff-shepherd');
  step('troca de tom de pele, cabelo, manto e cajado salva na conta (mesmo serviço do guarda-roupa)');

  // ---------------------------------------------------------------- reabrir: o 3D volta com o visual salvo
  await page.reload();
  await page.waitForFunction(() => globalThis.__jb3d?.loaded, null, { timeout: 30000 });
  await page.waitForTimeout(1200);
  for (const name of ['Tom de pele: Tom 5', 'Cabelo: Longo ondulado', 'Manto Noturno: Vestir', 'Cajado de Pastor: Segurar']) {
    assert.equal(await page.getByRole('radio', { name }).getAttribute('aria-checked'), 'true', `${name} após reabrir`);
  }
  assert.equal((await probe(page)).clip, 'idle_staff');
  step('após reabrir o app, o palco 3D mostra o visual salvo');

  // ---------------------------------------------------------------- luz do acampamento (lua + fogueira)
  await page.getByRole('radio', { name: 'Luz: Acampamento' }).click();
  await page.waitForTimeout(1500);
  await shot(page, '3d-07-acampamento-lua-fogueira-412');
  const campFront = await stage.screenshot();
  await page.getByRole('radio', { name: 'Luz: Guarda-roupa' }).click();
  await page.waitForTimeout(800);
  const neutralFront = await stage.screenshot();
  assert.ok(diffRatio(campFront, neutralFront) > 0.05, 'luz do acampamento diferente da neutra');
  step('acampamento com luz de lua e fogueira; guarda-roupa com luz neutra');

  // o Início e o guarda-roupa 2D continuam com o mesmo visual salvo
  await page.goto(`${APP}/home`);
  await page.getByRole('img', { name: /^Seu personagem no acampamento/ }).waitFor();
  const label = await page.getByRole('img', { name: /^Seu personagem no acampamento/ }).getAttribute('aria-label');
  assert.ok(label.includes('Manto Noturno') && label.includes('Cajado de Pastor') && label.includes('Tom 5'), label);
  const video = await page.video().path();
  await ctx.close();
  fs.renameSync(video, `${VIDEOS}/3d-rotacao-e-troca.webm`);
  step('o Início usa o mesmo visual salvo (gravado: rotação e troca)');

  // ---------------------------------------------------------------- 320 px e movimento reduzido
  const M = await browser.newContext({ viewport: { width: 320, height: 640 }, reducedMotion: 'reduce' });
  const mp = await M.newPage();
  await mp.goto(APP);
  await mp.getByRole('button', { name: 'Entrar' }).click();
  await mp.getByLabel('E-mail').fill(email);
  await mp.getByLabel('Senha', { exact: true }).fill('senha-forte-123');
  await mp.getByRole('button', { name: 'Entrar' }).last().click();
  await mp.getByText('Paz, Davi!').waitFor();
  await mp.goto(`${APP}/avatar/3d`);
  await mp.waitForFunction(() => globalThis.__jb3d?.loaded, null, { timeout: 30000 });
  await mp.waitForTimeout(1200);
  assert.equal(await mp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, 'sem rolagem lateral em 320 px');
  const r1 = await mp.getByTestId('stage-3d').screenshot();
  await mp.waitForTimeout(1500);
  const r2 = await mp.getByTestId('stage-3d').screenshot();
  assert.ok(diffRatio(r1, r2, 12) < 0.0005, 'movimento reduzido: pose estática');
  await mp.screenshot({ path: `${SHOTS}/3d-08-320-movimento-reduzido.png` });
  await M.close();
  step('320 px sem rolagem lateral; movimento reduzido deixa a pose estática');

  await browser.close();
  await db.end();
  console.log('✔ Prova 3D verificada.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
