/* eslint-disable */
// Comparação dos estilos de personagem em /dev/estilos. `FLOW=estilos bash e2e/run.sh`
const { chromium } = require('playwright');
const fs = require('node:fs');
const APP = process.env.APP_URL ?? 'http://localhost:8081';
const SHOTS = process.env.SHOTS_DIR ?? `${__dirname}/screenshots`;
(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 760, height: 1200 }, deviceScaleFactor: 2 });
  for (const s of ['vitral', 'gravura', 'iluminura', 'aventureiro']) {
    await p.goto(`${APP}/dev/estilos?estilo=${s}&w=220`);
    await p.getByTestId(`estilo-${s}`).waitFor();
    await p.waitForTimeout(600);
    await p.getByTestId(`estilo-${s}`).screenshot({ path: `${SHOTS}/es-${s}.png` });
    console.log(`  ✔ ${s}`);
  }
  const m = await b.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 });
  await m.goto(`${APP}/dev/estilos?w=170`);
  await m.getByTestId('estilos').waitFor();
  await m.waitForTimeout(800);
  const over = await m.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  if (over) throw new Error('rolagem lateral em 412 px');
  await m.screenshot({ path: `${SHOTS}/es-412.png` });
  console.log('  ✔ 412 px sem rolagem lateral');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
