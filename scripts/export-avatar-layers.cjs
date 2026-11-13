/* eslint-disable */
// Exporta, do próprio AvatarRenderer, cada camada de um lote de arte (docs/arte-lotes/lote-N.json) em
// 2048×3072 com fundo transparente. Serve como MOLDE DE ENCAIXE exato para a pintura final e, com
// scripts/paint-pass.py, como camada de teste do pipeline de PNG/WebP.
//
// Requer o app web com EXPO_PUBLIC_AVATAR_LAB=1 servido em APP_URL (padrão http://localhost:8081).
// Uso: node scripts/export-avatar-layers.cjs docs/arte-lotes/lote-1.json <pasta-de-saída>
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const APP = process.env.APP_URL ?? 'http://localhost:8081';
const [specFile, outDir] = process.argv.slice(2);
const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
// dois tons de pele: o que muda entre eles é pele (vira máscara/sombreamento); o resto é pintura fixa
const SKINS = ['skin-2', 'skin-5'];
const HAIR = 'haircolor-honey';

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 2048, height: 3072 } });
  for (const c of spec.camadas) {
    const skins = c.type === 'base' ? [SKINS[0]] : SKINS;
    for (const skin of skins) {
      const q = new URLSearchParams({ export: c.source, body: spec.corpo, layer: c.layer, scale: '2', skin });
      // cabelo e sobrancelhas: tom médio (mel), para o sombreamento ter faixa para clarear e escurecer
      if (/^(hair|brows)\//.test(c.source)) q.set('hair', HAIR);
      if (c.pose) q.set('pose', c.pose);
      await page.goto(`${APP}/dev/avatar-lab?${q}`);
      const el = page.getByTestId('export');
      await el.waitFor();
      // fundo transparente: o app pinta o fundo nos contêineres acima da camada exportada
      await el.evaluate((node) => {
        for (let n = node.parentElement; n; n = n.parentElement) n.style.background = 'transparent';
        document.documentElement.style.background = 'transparent';
        document.body.style.background = 'transparent';
      });
      await page.waitForTimeout(150);
      const name = `${c.source.replace('/', '__')}__${c.layer}${c.pose ? `.${c.pose}` : ''}__${skin}.png`;
      await el.screenshot({ path: path.join(outDir, name), omitBackground: true });
      console.log('  ✔', name);
    }
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
