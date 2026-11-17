/* eslint-disable */
// Estilos cinematográficos em /dev/cinematico. `FLOW=cinematico bash e2e/run.sh`
const { chromium } = require('playwright');
const fs = require('node:fs');
const APP = process.env.APP_URL ?? 'http://localhost:8081';
const SHOTS = process.env.SHOTS_DIR ?? `${__dirname}/screenshots`;
(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 820, height: 1400 }, deviceScaleFactor: 2 });
  for (const m of ['fogueira', 'carta', 'siclo', 'peregrino']) {
    await p.goto(`${APP}/dev/cinematico?modo=${m}&w=240`);
    await p.getByTestId(`modo-${m}`).waitFor();
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(900);
    await p.getByTestId(`modo-${m}`).screenshot({ path: `${SHOTS}/ci-${m}.png` });
    console.log(`  ✔ ${m}`);
  }
  const s = await b.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 });
  await s.goto(`${APP}/dev/cinematico?w=180`);
  await s.getByTestId('cinematico').waitFor();
  await s.waitForTimeout(900);
  if (await s.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('rolagem lateral em 412 px');
  console.log('  ✔ 412 px sem rolagem lateral');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
