/* eslint-disable */
// Auditoria das skins em todas as abas: com uma skin pintada vestida (Peregrina do Êxodo, estilo 3),
// confere que cada tela mostra a pintura certa, e que a loja e os mundos usam as pinturas entregues.
// `FLOW=skins-audit bash e2e/run.sh`
const { chromium } = require('playwright');
const pg = require('pg');
const fs = require('node:fs');
const assert = require('node:assert/strict');

const APP = process.env.APP_URL ?? 'http://localhost:8081';
const SHOTS = process.env.SHOTS_DIR ?? `${__dirname}/screenshots`;
const db = new pg.Client({ host: process.env.PGHOST, port: Number(process.env.PGPORT), user: 'postgres', database: 'jb_test' });
const step = (msg) => console.log(`  ✔ ${msg}`);
const PAINT = 'skins/comum_peregrino_exodo/feminino/estilo-3/corpo';
const season = require('../src/features/skins/season1.json');
const painted = new Set(fs.readdirSync(`${__dirname}/../assets/skins`).filter((id) => fs.existsSync(`${__dirname}/../assets/skins/${id}/estilo-1/corpo.webp`)));

/** URLs de imagem (background-image e <img>) dentro do elemento */
const images = (loc) => loc.evaluate((el) => [el, ...el.querySelectorAll('*')].flatMap((n) => {
  const bg = getComputedStyle(n).backgroundImage; const out = [];
  if (bg && bg !== 'none') out.push(bg);
  if (n.tagName === 'IMG' && n.getAttribute('src')) out.push(n.getAttribute('src'));
  if (n.tagName === 'image') out.push(n.getAttribute('href') || n.getAttribute('xlink:href') || '');
  return out;
}));
async function expectPaint(loc, label) {
  await loc.waitFor();
  let urls = [];
  for (let i = 0; i < 20; i++) { urls = await images(loc); if (urls.some((u) => u.includes(PAINT))) break; await loc.page().waitForTimeout(300); }
  if (!urls.some((u) => u.includes(PAINT))) await loc.page().screenshot({ path: `${SHOTS}/au-falha.png` });
  assert.ok(urls.some((u) => u.includes(PAINT)), `${label}: pintura da skin vestida ausente (${urls.filter((u) => u.includes('skins/')).slice(0, 3).join(', ') || 'nenhuma pintura'})`);
}

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  await db.connect();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, timezoneId: 'America/Sao_Paulo', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('pageerror:', e.message));
  await page.goto(APP);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.getByLabel('E-mail').fill(`auditoria+${Date.now()}@teste.local`);
  await page.getByLabel('Senha', { exact: true }).fill('senha-forte-123');
  await page.getByRole('button', { name: 'Criar conta' }).last().click();
  await page.getByLabel('Nome de exibição').fill('Débora');
  await page.getByLabel('Nome de usuário').fill('debora_auditoria');
  await page.getByText('Disponível').waitFor();
  await page.getByRole('button', { name: 'Continuar' }).click();
  // cadastro: miniaturas pintadas e escolha da apresentação feminina
  await page.getByText('Escolha seu viajante').waitFor();
  await page.getByTestId('thumb-painted-comum_peregrino_exodo').waitFor();
  await page.getByRole('radio', { name: 'Pastor de ovelhas', exact: true }).click();
  await page.getByRole('radio', { name: 'Apresentação: Pastora de ovelhas' }).waitFor();
  await page.getByTestId('thumb-painted-comum_pastor').waitFor();
  await page.getByRole('radio', { name: 'Peregrino do Êxodo', exact: true }).click();
  await page.getByRole('radio', { name: 'Apresentação: Peregrina do Êxodo' }).click();
  await page.getByRole('radio', { name: 'Estilo 3 de Peregrino do Êxodo' }).click();
  await expectPaint(page.getByRole('img', { name: /^Prévia do personagem/ }).first(), 'cadastro (palco)');
  await page.getByRole('button', { name: 'Começar com esta skin' }).click();
  await page.getByRole('button', { name: 'Começar a jornada' }).click();
  await page.getByText('Paz, Débora!').waitFor();
  const uid = (await db.query(`select id from profiles where username = 'debora_auditoria'`)).rows[0].id;
  assert.deepEqual((await db.query(`select skin_id, style, variant from user_skin_selection where user_id = $1`, [uid])).rows[0],
    { skin_id: 'comum_peregrino_exodo', style: 3, variant: 'feminino' });
  step('cadastro: miniaturas pintadas; Peregrina do Êxodo, estilo 3, salva no servidor');

  for (const [w, h] of [[412, 915], [320, 640]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(`${APP}/home`);
    await expectPaint(page.getByTestId('camp-avatar').filter({ visible: true }), `Início ${w}px (acampamento)`);
    await expectPaint(page.getByTestId('lobby-hud').filter({ visible: true }), `Início ${w}px (retrato do HUD)`);
    await page.screenshot({ path: `${SHOTS}/au-01-inicio-${w}.png` });
    await page.goto(`${APP}/profile`);
    await expectPaint(page.getByTestId('profile-avatar'), `Perfil ${w}px (ficha)`);
    await page.getByText('Peregrina do Êxodo', { exact: true }).filter({ visible: true }).first().waitFor();
    await page.getByTestId('thumb-painted-comum_peregrino_exodo').first().waitFor();
    await page.screenshot({ path: `${SHOTS}/au-02-perfil-${w}.png` });
    await page.goto(`${APP}/vestiario`);
    await expectPaint(page.getByTestId('vestiario-stage'), `Vestiário ${w}px (palco)`);
    await page.goto(`${APP}/friends`);
    await expectPaint(page.locator('body'), `Amigos ${w}px (prévia do cartão)`);
    await page.screenshot({ path: `${SHOTS}/au-03-amigos-${w}.png` });
    await page.goto(`${APP}/users/debora_auditoria`);
    await expectPaint(page.locator('body'), `Cartão público ${w}px (visto pela própria conta)`);
    step(`${w} px: Início (acampamento e HUD), Perfil, Vestiário, Amigos e cartão público mostram a Peregrina, estilo 3`);
  }
  await page.setViewportSize({ width: 412, height: 915 });

  // outra conta vê o cartão público com a mesma pintura
  await db.query(`update profiles set privacy_mode = 'public' where id = $1`, [uid]);
  const other = await (await browser.newContext({ viewport: { width: 412, height: 915 } })).newPage();
  await other.goto(APP);
  await other.getByRole('button', { name: 'Criar conta' }).click();
  await other.getByLabel('E-mail').fill(`visitante+${Date.now()}@teste.local`);
  await other.getByLabel('Senha', { exact: true }).fill('senha-forte-123');
  await other.getByRole('button', { name: 'Criar conta' }).last().click();
  await other.getByLabel('Nome de exibição').fill('Visitante');
  await other.getByLabel('Nome de usuário').fill('visitante_auditoria');
  await other.getByText('Disponível').waitFor();
  await other.getByRole('button', { name: 'Continuar' }).click();
  await other.getByRole('button', { name: 'Começar com esta skin' }).click();
  await other.getByRole('button', { name: 'Começar a jornada' }).click();
  await other.goto(`${APP}/users/debora_auditoria`);
  await other.getByText('Débora').first().waitFor();
  await expectPaint(other.locator('body'), 'cartão público visto por outra conta');
  await other.screenshot({ path: `${SHOTS}/au-04-publico-outra-conta.png` });
  step('outra conta vê o cartão público com a mesma pintura (skin, estilo e apresentação)');

  // loja: toda skin à venda hoje está pintada e aparece pintada
  await page.goto(`${APP}/market`);
  await page.getByText('Épica da semana').waitFor();
  const offers = (await db.query(`select skin_id from private.skin_offers(private.market_rotation_day(now()))`)).rows.map((r) => r.skin_id);
  for (const id of offers) {
    assert.ok(painted.has(id), `skin da vitrine sem pintura entregue: ${id}`);
    await page.getByTestId(`market-${id}`).getByTestId(`thumb-painted-${id}`).waitFor();
  }
  const shop = season.skins.filter((s) => s.inShop).map((s) => s.id);
  assert.deepEqual(shop.filter((id) => !painted.has(id)), [], 'todas as skins da loja têm pintura');
  await page.screenshot({ path: `${SHOTS}/au-05-loja.png` });
  step(`loja: as ${offers.length} skins da vitrine de hoje aparecem pintadas; todas as ${shop.length} skins da loja têm pintura`);

  // mundos: cena pintada; skins pintadas das Origens aparecem pintadas
  await page.goto(`${APP}/world/origens`);
  await page.getByTestId('world-art-origens').waitFor();
  const origens = season.skins.filter((s) => painted.has(s.id)).slice(0, 8);
  for (const s of origens) await page.getByTestId(`thumb-painted-${s.id}`).first().waitFor();
  await page.goto(`${APP}/journey`);
  for (const id of ['origens', 'reinos', 'sabedoria', 'profetas', 'evangelhos', 'igreja', 'nova-criacao']) await page.getByTestId(`journey-art-${id}`).waitFor();
  step(`mundos: cenas pintadas nos 7 mundos e ${origens.length} skins pintadas na página das Origens`);

  // abas sem personagem: Ler e Jornada abrem sem erro
  await page.goto(`${APP}/read`);
  await page.getByText('Modo Missão', { exact: true }).first().waitFor();
  step('aba Ler abre normalmente (não mostra o personagem)');

  // nomes iguais nas duas apresentações: os botões dizem Padrão e Feminina
  await page.goto(`${APP}/vestiario`);
  await page.getByRole('tab', { name: /^Todas/ }).click();
  await page.getByTestId('vestiario-raro_ourives').click();
  await page.getByRole('radio', { name: 'Apresentação: Padrão' }).waitFor();
  await page.getByRole('radio', { name: 'Apresentação: Feminina' }).click();
  await page.getByTestId('vestiario-name').getByText('Ourives').waitFor();
  // personagens principais: só a apresentação do sexo do personagem (sem botões de apresentação)
  for (const id of ['lendario_moises', 'glorioso_moises_rosto_resplandecente']) {
    await page.getByTestId(`vestiario-${id}`).click();
    await page.getByTestId('vestiario-stage').waitFor();
    assert.equal(await page.getByRole('radio', { name: /^Apresentação:/ }).count(), 0, `${id}: sem apresentação do outro sexo`);
  }
  // toda a Temporada 1 aparece pintada no Vestiário
  for (const sk of season.skins) await page.getByTestId(`vestiario-${sk.id}`).getByTestId(`thumb-painted-${sk.id}`).waitFor();
  step(`Vestiário: as ${season.skins.length} skins da Temporada 1 aparecem pintadas; apresentações de mesmo nome viram Padrão e Feminina; Moisés (personagem principal) sem apresentação do outro sexo`);

  // trocar para a apresentação padrão reflete em todas as telas
  await page.goto(`${APP}/vestiario`);
  await page.getByTestId('vestiario-comum_peregrino_exodo').click();
  await page.getByRole('radio', { name: 'Apresentação: Peregrino do Êxodo' }).click();
  await page.getByRole('button', { name: 'Vestir o estilo 3' }).click();
  await page.getByText('Pronto: você está vestindo Peregrino do Êxodo, estilo 3.').waitFor();
  await page.goto(`${APP}/home`);
  const homeUrls = await images(page.getByTestId('camp-avatar').filter({ visible: true }));
  assert.ok(homeUrls.some((u) => u.includes('skins/comum_peregrino_exodo/estilo-3/corpo')) && !homeUrls.some((u) => u.includes(PAINT)),
    'o acampamento troca para a apresentação padrão');
  step('trocar a apresentação no Vestiário troca a pintura no acampamento');

  await browser.close();
  await db.end();
  console.log('✔ Auditoria das skins concluída.');
})().catch((e) => { console.error(e); process.exit(1); });
