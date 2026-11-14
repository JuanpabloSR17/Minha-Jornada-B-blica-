/* eslint-disable */
// Lote 1 de arte pintada (docs/arte-lotes/lote-1.json): combinação jogável no corpo B, com as camadas
// PNG/WebP do pipeline, no guarda-roupa e no acampamento; troca de cajado refletida no Início e após reabrir.
// `FLOW=avatar-lote1 bash e2e/run.sh`
const { chromium } = require('playwright');
const pg = require('pg');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { diffRatio, sameLook } = require('./pixels.cjs');

const APP = process.env.APP_URL ?? 'http://localhost:8081';
const SHOTS = process.env.SHOTS_DIR ?? `${__dirname}/screenshots`;
const VIDEOS = `${SHOTS}/videos`;
const db = new pg.Client({ host: process.env.PGHOST, port: Number(process.env.PGPORT), user: 'postgres', database: 'jb_test' });
const step = (msg) => console.log(`  ✔ ${msg}`);
const shot = (page, name) => page.screenshot({ path: `${SHOTS}/${name}.png` });
const pick = async (page, tab, option) => {
  await page.getByRole('tab', { name: tab, exact: true }).click();
  await page.getByRole('radio', { name: option, exact: true }).click();
};
const campAvatar = (page) => page.getByRole('img', { name: /^Seu personagem no acampamento/ });
const noOverflow = async (page, label) =>
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, `rolagem horizontal: ${label}`);
/** Quais destas camadas pintadas foram carregadas na tela (o endereço mantém o caminho do arquivo). */
/** Espera as camadas (img e imagens da máscara de luz) terminarem de carregar. */
async function settle(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => [...document.querySelectorAll('img')].every((i) => i.complete));
  await page.waitForTimeout(700);
}

async function loaded(page, names) {
  return page.evaluate((list) => {
    const srcs = [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth > 0).map((i) => decodeURIComponent(i.currentSrc || i.src));
    return list.filter((n) => srcs.some((s) => s.includes(n)));
  }, names);
}

(async () => {
  fs.mkdirSync(VIDEOS, { recursive: true });
  await db.connect();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, timezoneId: 'America/Sao_Paulo', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('pageerror:', e.message));
  const email = `jose+${Date.now()}@teste.local`;

  // ---------------------------------------------------------------- conta com o corpo B
  await page.goto(APP);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill('senha-forte-123');
  await page.getByRole('button', { name: 'Criar conta' }).last().click();
  await page.getByText('Como você quer ser chamado?').waitFor();
  await page.getByLabel('Nome de exibição').fill('José');
  await page.getByLabel('Nome de usuário').fill('jose_lote1');
  await page.getByText('Disponível').waitFor();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByText('Criar personagem').waitFor();
  await pick(page, 'Modelo', 'Modelo B');
  await pick(page, 'Tom de pele', 'Tom 4');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await pick(page, 'Estilo', 'Curto');
  await pick(page, 'Cor', 'Preto');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Finalizar personagem' }).click();
  await page.getByText('Qual é o seu ritmo?').waitFor();
  await page.getByRole('button', { name: 'Começar a jornada' }).click();
  await page.getByText('Paz, José!').waitFor();
  const uid = (await db.query(`select id from profiles where username = 'jose_lote1'`)).rows[0].id;
  for (const it of ['common_bolsa_do_viajante', 'common_cajado_de_caminhada']) {
    await db.query(`insert into user_items (user_id, item_id, source_event_id) values ($1, $2, 'test:lote1') on conflict do nothing`, [uid, it]);
  }

  // ---------------------------------------------------------------- equipar a combinação pelo guarda-roupa
  await page.goto(`${APP}/avatar/wardrobe`);
  for (const [cat, item] of [['Túnicas', 'Túnica de Linho'], ['Mantos', 'Manto Noturno'], ['Cintura', 'Bolsa do Viajante'], ['Itens de mão', 'Cajado de Pastor'], ['Calçados', 'Sandálias de Couro']]) {
    await page.getByRole('tab', { name: cat, exact: true }).click();
    await page.getByRole('radio', { name: new RegExp(`^${item},`) }).click();
  }
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByText('Visual salvo.').waitFor();
  const eq = (await db.query(`select jsonb_object_agg(e.slot, e.item_id) eq from avatar_loadout_equipment e join avatar_loadouts l on l.id = e.loadout_id where l.user_id = $1 and l.is_active`, [uid])).rows[0].eq;
  assert.equal(eq.hands, 'staff-shepherd');
  await page.waitForTimeout(1200);
  const LOTE = ['body/base/body-b/body.mask', 'body/base/body-b/arms.staff.mask', 'body/base/body-b/hands.staff.mask', 'hair/hair-short/all/back_hair.mask', 'eyes/eyes-almond/all/face', 'outfit/tunic-linen/body-b/upper_outfit', 'outfit/tunic-linen/body-b/sleeves.staff', 'back/cloak-night/body-b/cloak_back', 'back/cloak-night/body-b/chest', 'waist/common_bolsa_do_viajante/body-b/waist', 'feet/sandals-leather/body-b/feet', 'hands/staff-shepherd/body-b/cloak_front.staff', 'hands/staff-shepherd/body-b/hand_item.mask'];
  const inWardrobe = await loaded(page, LOTE);
  assert.deepEqual(inWardrobe.sort(), [...LOTE].sort(), 'guarda-roupa usa as camadas pintadas da combinação (pose do cajado inclusive)');
  const restPose = await page.evaluate(() => [...document.querySelectorAll('img')].map((i) => decodeURIComponent(i.currentSrc || i.src))
    .filter((s) => /body-b\/(arms|hands)\.mask|tunic-linen\/body-b\/sleeves(?!\.staff)[.@]/.test(s)));
  assert.deepEqual(restPose, [], 'com o cajado, braços, mãos e mangas usam a variante .staff');
  await shot(page, 'l1-01-guarda-roupa-pastor-412');
  step(`guarda-roupa (luz neutra): ${inWardrobe.length} camadas pintadas do lote 1 carregadas, com a variante de pose do cajado`);

  // ---------------------------------------------------------------- acampamento
  await page.goto(`${APP}/home`);
  await campAvatar(page).waitFor();
  await settle(page);
  assert.deepEqual((await loaded(page, LOTE)).sort(), [...LOTE].sort(), 'acampamento usa as mesmas camadas');
  await noOverflow(page, 'Início');
  await shot(page, 'l1-02-acampamento-pastor-412');
  const before = await campAvatar(page).screenshot();
  step('acampamento (noite + fogueira sobre a silhueta) com as mesmas camadas pintadas');

  // ---------------------------------------------------------------- troca de peça (gravada) e reabertura
  const R = await browser.newContext({ viewport: { width: 412, height: 915 }, timezoneId: 'America/Sao_Paulo', reducedMotion: 'reduce', recordVideo: { dir: VIDEOS, size: { width: 412, height: 915 } } });
  const rp = await R.newPage();
  await rp.goto(APP);
  await rp.getByRole('button', { name: 'Entrar' }).click();
  await rp.getByLabel('E-mail').fill(email);
  await rp.getByLabel('Senha', { exact: true }).fill('senha-forte-123');
  await rp.getByRole('button', { name: 'Entrar' }).last().click();
  await rp.getByText('Paz, José!').waitFor();
  await campAvatar(rp).waitFor();
  await rp.waitForTimeout(1200);
  await rp.goto(`${APP}/avatar/wardrobe?category=hands`);
  await rp.waitForTimeout(800);
  await rp.getByRole('radio', { name: /^Cajado de Caminhada,/ }).click();
  await rp.waitForTimeout(1200);
  await rp.getByRole('button', { name: 'Salvar' }).click();
  await rp.getByText('Visual salvo.').waitFor();
  await rp.waitForTimeout(600);
  await rp.goto(`${APP}/home`);
  await campAvatar(rp).waitFor();
  await rp.waitForTimeout(1500);
  assert.ok((await campAvatar(rp).getAttribute('aria-label')).includes('Cajado de Caminhada'));
  assert.deepEqual(await loaded(rp, ['hands/common_cajado_de_caminhada/body-b/cloak_front.staff', 'hands/common_cajado_de_caminhada/body-b/hand_item.mask']), ['hands/common_cajado_de_caminhada/body-b/cloak_front.staff', 'hands/common_cajado_de_caminhada/body-b/hand_item.mask']);
  await settle(rp);
  const after = await campAvatar(rp).screenshot();
  await rp.reload();
  await campAvatar(rp).waitFor();
  await settle(rp);
  const reopened = await campAvatar(rp).screenshot();
  if (!sameLook(after, reopened)) {
    fs.writeFileSync(`${SHOTS}/l1-debug-after.png`, after);
    fs.writeFileSync(`${SHOTS}/l1-debug-reopened.png`, reopened);
  }
  assert.ok(diffRatio(before, after) > 0.002, `o Início mostra o cajado trocado (${(diffRatio(before, after) * 100).toFixed(2)}% dos pixels)`);
  assert.ok(sameLook(after, reopened), `após reabrir, o mesmo visual (diferença ${(diffRatio(after, reopened) * 100).toFixed(2)}% dos pixels)`);
  await shot(rp, 'l1-03-acampamento-caminhada-412');
  const video = await rp.video().path();
  await R.close();
  fs.renameSync(video, `${VIDEOS}/lote1-troca-de-cajado.webm`);
  step('troca do Cajado de Pastor pelo Cajado de Caminhada: Início muda e continua igual após reabrir (gravado)');

  // ---------------------------------------------------------------- sem cajado: mangas em repouso; com cajado: pose do cajado (salvar e reabrir)
  const sleeves = (p) => p.evaluate(() => {
    const srcs = [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth > 0).map((i) => decodeURIComponent(i.currentSrc || i.src));
    return {
      rest: srcs.some((s) => /tunic-linen\/body-b\/sleeves(?!\.staff)[.@]/.test(s)),
      staff: srcs.some((s) => /tunic-linen\/body-b\/sleeves\.staff[.@]/.test(s)),
      armsRest: srcs.some((s) => /body-b\/arms\.mask[.@]/.test(s)),
    };
  });
  const poseCycle = async (w, current) => {
    await page.goto(`${APP}/avatar/wardrobe?category=hands`);
    await page.getByRole('radio', { name: new RegExp(`^${current},`) }).click();
    await page.getByRole('button', { name: 'Remover', exact: true }).click();
    await page.getByRole('button', { name: 'Salvar' }).click();
    await page.getByText('Visual salvo.').waitFor();
    assert.equal((await db.query(`select count(*)::int n from avatar_loadout_equipment e join avatar_loadouts l on l.id = e.loadout_id where l.user_id = $1 and l.is_active and e.slot = 'hands'`, [uid])).rows[0].n, 0, 'sem item de mão salvo');
    await settle(page);
    assert.deepEqual(await sleeves(page), { rest: true, staff: false, armsRest: true }, `${w}: sem cajado, mangas pintadas em repouso`);
    await noOverflow(page, `guarda-roupa sem cajado ${w}`);
    await shot(page, `l1-06-guarda-roupa-sem-cajado-${w}`);
    await page.reload();
    await page.getByRole('button', { name: 'Salvar' }).waitFor();
    await settle(page);
    assert.deepEqual(await sleeves(page), { rest: true, staff: false, armsRest: true }, `${w}: sem cajado após reabrir`);
    await page.goto(`${APP}/home`);
    await campAvatar(page).waitFor();
    await settle(page);
    assert.deepEqual(await sleeves(page), { rest: true, staff: false, armsRest: true }, `${w}: acampamento sem cajado`);
    await noOverflow(page, `Início sem cajado ${w}`);
    await shot(page, `l1-07-acampamento-sem-cajado-${w}`);
    await page.goto(`${APP}/avatar/wardrobe?category=hands`);
    await page.getByRole('radio', { name: /^Cajado de Pastor,/ }).click();
    await page.getByRole('button', { name: 'Salvar' }).click();
    await page.getByText('Visual salvo.').waitFor();
    await page.reload();
    await page.getByRole('button', { name: 'Salvar' }).waitFor();
    await settle(page);
    assert.deepEqual(await sleeves(page), { rest: false, staff: true, armsRest: false }, `${w}: cajado de volta, pose do cajado após reabrir`);
    await page.goto(`${APP}/home`);
    await campAvatar(page).waitFor();
    await settle(page);
    assert.deepEqual(await sleeves(page), { rest: false, staff: true, armsRest: false }, `${w}: acampamento com o cajado de volta`);
  };
  await poseCycle('412', 'Cajado de Caminhada');
  await page.setViewportSize({ width: 320, height: 640 });
  await poseCycle('320', 'Cajado de Pastor');
  await page.setViewportSize({ width: 412, height: 915 });
  step('412 e 320 px: tirar o cajado ativa as mangas pintadas em repouso e equipá-lo restaura a pose, após salvar e reabrir (guarda-roupa e acampamento)');

  // ---------------------------------------------------------------- cor do cabelo: mesmas máscaras, preto × loiro
  const hp = await browser.newPage({ viewport: { width: 1400, height: 760 } });
  const hairShots = {};
  for (const [label, hair] of [['preto', 'haircolor-black'], ['loiro', 'haircolor-blond']]) {
    await hp.goto(`${APP}/dev/avatar-lab?pintura=1&hair=${hair}`);
    await hp.getByTestId('pintura').waitFor();
    await hp.waitForLoadState('networkidle');
    await hp.waitForTimeout(800);
    const srcs = await hp.evaluate(() => [...document.querySelectorAll('img')].map((i) => decodeURIComponent(i.currentSrc || i.src)));
    assert.ok(srcs.some((s) => /hair-short\/all\/front_hair\.mask[.@]/.test(s)) && srcs.some((s) => /hair-short\/all\/back_hair\.shade[.@]/.test(s)), `cabelo ${label}: máscaras e sombras pintadas`);
    await hp.getByTestId('pintura').screenshot({ path: `${SHOTS}/l1-08-cabelo-${label}.png` });
    // célula "Pintura · guarda-roupa": recorte camp 262 176 520 980; cabelo pintado em 442–581 × 196–328
    const box = await hp.getByText('Pintura · guarda-roupa').locator('..').locator('svg').first().boundingBox();
    const sx = box.width / 520, sy = box.height / 980;
    hairShots[label] = await hp.screenshot({ clip: { x: box.x + (452 - 262) * sx, y: box.y + (200 - 176) * sy, width: 120 * sx, height: 60 * sy } });
  }
  const { PNG } = require('pngjs');
  const lum = (buf) => { const p = PNG.sync.read(buf); let s = 0; for (let i = 0; i < p.data.length; i += 4) s += 0.2126 * p.data[i] + 0.7152 * p.data[i + 1] + 0.0722 * p.data[i + 2]; return s / (p.width * p.height); };
  const black = lum(hairShots.preto);
  const blond = lum(hairShots.loiro);
  assert.ok(blond - black > 40, `loiro bem mais claro que preto no cabelo (${black.toFixed(1)} × ${blond.toFixed(1)})`);
  await hp.close();
  step(`cabelo curto pintado tingido pela cor da conta: preto (${black.toFixed(0)}) e loiro (${blond.toFixed(0)}) com as mesmas máscaras`);

  // ---------------------------------------------------------------- 320 px
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto(`${APP}/avatar/wardrobe`);
  await page.waitForTimeout(1200);
  await noOverflow(page, 'guarda-roupa 320');
  await shot(page, 'l1-04-guarda-roupa-pastor-320');
  await page.goto(`${APP}/home`);
  await campAvatar(page).waitFor();
  await page.waitForTimeout(1200);
  await noOverflow(page, 'Início 320');
  await shot(page, 'l1-05-acampamento-pastor-320');
  step('320 px: guarda-roupa e acampamento sem rolagem lateral');

  // ---------------------------------------------------------------- comparação: referência vetorial × pintura (luz neutra e do acampamento)
  const cmp = await browser.newPage({ viewport: { width: 1400, height: 760 } });
  for (const staff of ['shepherd', 'walk']) {
    await cmp.goto(`${APP}/dev/avatar-lab?pintura=1&staff=${staff}`);
    await cmp.getByTestId('pintura').waitFor();
    await cmp.waitForLoadState('networkidle');
    await cmp.waitForTimeout(800);
    await cmp.getByTestId('pintura').screenshot({ path: `${SHOTS}/l1-00-comparacao-${staff === 'walk' ? 'caminhada' : 'pastor'}.png` });
  }
  step('comparação referência vetorial × pintura, no guarda-roupa e no acampamento, para os dois cajados');

  await browser.close();
  await db.end();
  console.log('✔ Lote 1 de avatares pintados verificado.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
