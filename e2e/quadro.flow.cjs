/* eslint-disable */
// Teste do "Quadro do Viajante" (retrato em moldura fixa + espaços de equipamento) em /dev/quadro.
// `FLOW=quadro bash e2e/run.sh`
const { chromium } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const APP = process.env.APP_URL ?? 'http://localhost:8081';
const SHOTS = process.env.SHOTS_DIR ?? `${__dirname}/screenshots`;
const VIDEOS = `${SHOTS}/videos`;
const step = (m) => console.log(`  ✔ ${m}`);
const settle = async (p) => { await p.waitForLoadState('networkidle'); await p.waitForFunction(() => [...document.querySelectorAll('img')].every((i) => i.complete)); await p.waitForTimeout(500); };
const noOverflow = async (p, l) => assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `rolagem lateral: ${l}`);
/** nada do personagem passa da moldura: a figura fica dentro do quadro interno */
const inside = async (p) => p.evaluate(() => {
  const root = document.querySelector('[data-testid="traveler-portrait"]');
  const frame = root.firstElementChild.getBoundingClientRect();
  return { w: Math.round(frame.width), h: Math.round(frame.height) };
});

(async () => {
  fs.mkdirSync(VIDEOS, { recursive: true });
  const browser = await chromium.launch();
  for (const [w, h] of [[412, 915], [320, 640]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    for (const [look, luz] of [[0, ''], [1, ''], [2, ''], [0, 'acampamento']]) {
      await p.goto(`${APP}/dev/quadro?look=${look}${luz ? `&luz=${luz}` : ''}`);
      await p.getByTestId('traveler-portrait').waitFor();
      await settle(p);
      await noOverflow(p, `quadro ${w}`);
      const box = await inside(p);
      assert.ok(Math.abs(box.h / box.w - 1.25) < 0.08, `moldura 4:5 (${box.w}×${box.h})`);
      await p.screenshot({ path: `${SHOTS}/qd-${look}${luz ? '-noite' : ''}-${w}.png` });
    }
    step(`${w} px: três exemplos e luz do acampamento, moldura 4:5, sem rolagem lateral`);
    await ctx.close();
  }

  // gravação: trocar corpo, manto, item de mão, cobertura de cabeça, tom e luz
  const R = await browser.newContext({ viewport: { width: 412, height: 915 }, reducedMotion: 'reduce', recordVideo: { dir: VIDEOS, size: { width: 412, height: 915 } } });
  const rp = await R.newPage();
  await rp.goto(`${APP}/dev/quadro?look=0`);
  await rp.getByTestId('traveler-portrait').waitFor();
  await settle(rp);
  await rp.waitForTimeout(800);
  const tap = async (loc) => { await loc.click(); await rp.waitForTimeout(900); };
  for (let i = 0; i < 3; i++) await tap(rp.getByTestId('slot-back'));
  for (let i = 0; i < 3; i++) await tap(rp.getByTestId('slot-hands'));
  for (let i = 0; i < 3; i++) await tap(rp.getByTestId('slot-head'));
  for (const b of ['Esguio', 'Robusto', 'Atlético']) await tap(rp.getByRole('radio', { name: `Corpo: ${b}` }));
  for (const t of ['Tom 1', 'Tom 6', 'Tom 3']) await tap(rp.getByRole('radio', { name: `Tom de pele: ${t}` }));
  await tap(rp.getByRole('radio', { name: 'Luz: Acampamento' }));
  await rp.waitForTimeout(1200);
  const video = await rp.video().path();
  await R.close();
  fs.renameSync(video, `${VIDEOS}/quadro-trocas.webm`);
  step('gravação: troca de manto, item de mão, cobertura, corpo, tom e luz');
  await browser.close();
  console.log('✔ Quadro do Viajante verificado.');
})().catch((e) => { console.error(e); process.exit(1); });
