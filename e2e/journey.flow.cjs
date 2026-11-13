/* eslint-disable */
// Protótipo jogável "RPG cinematográfico": acampamento → marco de Êxodo 25 → leitura → revelação → Santuário.
// Roda contra o banco real (Postgres + migrações) via e2e/fake-supabase.mjs: `FLOW=journey bash e2e/run.sh`.
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

async function onboard(page, { name, user, body, skin, hair, color }) {
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
  await page.getByText('Criar personagem').waitFor();
  await pick(page, 'Modelo', body);
  await pick(page, 'Tom de pele', skin);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await pick(page, 'Estilo', hair);
  await pick(page, 'Cor', color);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Finalizar personagem' }).click();
  await page.getByText('Qual é o seu ritmo?').waitFor();
  await page.getByRole('button', { name: 'Começar a jornada' }).click();
  await page.getByText(`Paz, ${name}!`).waitFor();
  return (await db.query('select id from profiles where username = $1', [user])).rows[0].id;
}

/** Equipa peças pelo guarda-roupa (mesmo estado e regras do app) e salva. */
async function equip(page, pieces) {
  await page.goto(`${APP}/avatar/wardrobe`);
  for (const [category, item] of pieces) {
    await page.getByRole('tab', { name: category, exact: true }).click();
    await page.getByRole('radio', { name: new RegExp(`^${item},`) }).click();
  }
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByText('Visual salvo.').waitFor();
}

const activeEq = async (userId) =>
  (await db.query(`select jsonb_object_agg(e.slot, e.item_id) eq from avatar_loadout_equipment e join avatar_loadouts l on l.id = e.loadout_id where l.user_id = $1 and l.is_active`, [userId])).rows[0].eq;

const campAvatar = (page) => page.getByRole('img', { name: /^Seu personagem no acampamento/ });
const finishHere = async (page) => {
  await page.getByRole('button', { name: 'Finalizar missão' }).click();
  await page.getByRole('button', { name: 'Concluí a leitura' }).click();
};

(async () => {
  fs.mkdirSync(VIDEOS, { recursive: true });
  await db.connect();
  const browser = await chromium.launch();
  const grant = (userId, item) => db.query(`insert into user_items (user_id, item_id, source_event_id) values ($1, $2, 'test:prototipo') on conflict do nothing`, [userId, item]);

  // ================================================================ dois personagens diferentes
  const A = await phone(browser, 320, 640);
  const rute = await onboard(A.page, { name: 'Rute', user: 'rute_proto', body: 'Modelo B', skin: 'Tom 5', hair: 'Cacheado', color: 'Preto' });
  const B = await phone(browser, 412, 915);
  const davi = await onboard(B.page, { name: 'Davi', user: 'davi_proto', body: 'Modelo C', skin: 'Tom 2', hair: 'Longo ondulado', color: 'Cobre' });
  // peças comuns (escolha diária/Mercado) concedidas só nesta base de teste; as iniciais são de todos
  for (const it of ['common_bolsa_do_viajante', 'common_cajado_de_caminhada', 'common_manto_de_viagem']) {
    await grant(rute, it);
    await grant(davi, it);
  }
  await equip(A.page, [['Túnicas', 'Túnica de Linho'], ['Mantos', 'Manto Noturno'], ['Cintura', 'Bolsa do Viajante'], ['Itens de mão', 'Cajado de Pastor'], ['Calçados', 'Sandálias de Couro'], ['Cabeça e pescoço', 'Turbante de Areia']]);
  await equip(B.page, [['Túnicas', 'Túnica Terracota'], ['Mantos', 'Manto de Viagem'], ['Cintura', 'Bolsa do Viajante'], ['Itens de mão', 'Cajado de Caminhada'], ['Calçados', 'Sandálias de Couro'], ['Cabeça e pescoço', 'Lenço de Cabeça']]);
  assert.deepEqual(
    { back: (await activeEq(rute)).back, waist: (await activeEq(rute)).waist, hands: (await activeEq(rute)).hands, head: (await activeEq(rute)).head },
    { back: 'cloak-night', waist: 'common_bolsa_do_viajante', hands: 'staff-shepherd', head: 'headwrap-sand' },
  );
  for (const [P, tag, w] of [[A, 'rute', 320], [B, 'davi', 412]]) {
    await P.page.goto(`${APP}/avatar/wardrobe`);
    await P.page.getByText('Visual em uso').first().waitFor().catch(() => undefined);
    await P.page.waitForTimeout(400);
    await shot(P.page, `j-${tag}-wardrobe-${w}`);
    await P.page.goto(`${APP}/home`);
    await campAvatar(P.page).waitFor();
    const label = await campAvatar(P.page).getAttribute('aria-label');
    for (const piece of tag === 'rute' ? ['Manto Noturno', 'Bolsa do Viajante', 'Cajado de Pastor', 'Turbante de Areia', 'Sandálias de Couro'] : ['Manto de Viagem', 'Bolsa do Viajante', 'Cajado de Caminhada', 'Lenço de Cabeça', 'Sandálias de Couro']) {
      assert.ok(label.includes(piece), `acampamento de ${tag} sem ${piece}: ${label}`);
    }
    await inViewport(P.page.getByRole('button', { name: 'Começar leitura' }), `ação principal (${w}px)`);
    await noOverflow(P.page, `Início ${w}px`);
    await P.page.waitForTimeout(300);
    await shot(P.page, `j-${tag}-camp-${w}`);
  }
  step('dois personagens (corpo, tom, cabelo diferentes) com túnica, manto, bolsa, cajado, sandálias e cobertura de cabeça: guarda-roupa e acampamento com o mesmo equipamento');

  // ================================================================ troca de peça → Início → reabrir (gravação)
  const R = await phone(browser, 320, 640, { reducedMotion: 'reduce', recordVideo: { dir: VIDEOS, size: { width: 320, height: 640 } } });
  // mesma conta da Rute neste "aparelho": entra pelo login
  await R.page.goto(APP);
  const ruteEmail = (await db.query('select email from auth.users where id = $1', [rute])).rows[0].email;
  await R.page.getByRole('button', { name: 'Entrar' }).click();
  await R.page.getByLabel('E-mail').fill(ruteEmail);
  await R.page.getByLabel('Senha', { exact: true }).fill('senha-forte-123');
  await R.page.getByRole('button', { name: 'Entrar' }).last().click();
  await R.page.getByText('Paz, Rute!').waitFor();
  await campAvatar(R.page).waitFor();
  await R.page.waitForTimeout(600);
  await R.page.waitForLoadState('networkidle');
  await R.page.waitForTimeout(500);
  const before = await campAvatar(R.page).screenshot();
  await R.page.goto(`${APP}/avatar/wardrobe?category=hands`);
  await R.page.getByRole('radio', { name: /^Cajado de Caminhada,/ }).click();
  await R.page.waitForTimeout(700);
  await R.page.getByRole('button', { name: 'Salvar' }).click();
  await R.page.getByText('Visual salvo.').waitFor();
  await R.page.waitForTimeout(500);
  await R.page.goto(`${APP}/home`);
  await campAvatar(R.page).waitFor();
  await R.page.waitForTimeout(900);
  assert.ok((await campAvatar(R.page).getAttribute('aria-label')).includes('Cajado de Caminhada'));
  await R.page.waitForLoadState('networkidle');
  await R.page.waitForTimeout(500);
  const after = await campAvatar(R.page).screenshot();
  assert.ok(diffRatio(before, after) > 0.01, 'o acampamento deve mostrar a peça trocada');
  await R.page.reload();
  await campAvatar(R.page).waitFor();
  await R.page.waitForTimeout(900);
  await R.page.waitForLoadState('networkidle');
  await R.page.waitForTimeout(500);
  const reopened = await campAvatar(R.page).screenshot();
  assert.ok(sameLook(after, reopened), `após reabrir, o acampamento mostra o mesmo visual (diferença ${(diffRatio(after, reopened) * 100).toFixed(2)}% dos pixels)`);
  assert.equal((await activeEq(rute)).hands, 'common_cajado_de_caminhada');
  await R.page.waitForTimeout(400);
  const swapVideo = await R.page.video().path();
  await R.ctx.close();
  fs.renameSync(swapVideo, `${VIDEOS}/troca-de-equipamento.webm`);
  step('troca do cajado no guarda-roupa aparece no Início e continua igual após reabrir o app (gravado)');

  // ================================================================ Êxodo 25 com a Mesa já obtida (320 px)
  await grant(rute, 'holy_mesa_dos_paes_da_presenca');
  const page = A.page;
  await page.goto(`${APP}/read`);
  await page.getByRole('button', { name: 'Ver todos os marcos' }).click();
  await page.getByRole('link', { name: /^Marco: a mobília do Tabernáculo, Êxodo 25, A cumprir, Santos deste marco que você possui: 1 de 3/ }).click();
  await page.getByTestId('tabernacle-stage').waitFor();
  assert.equal(await page.getByTestId('tab-artifact-holy_mesa_dos_paes_da_presenca').getByText('Você já possui').count(), 1);
  assert.equal(await page.getByTestId('tab-artifact-holy_arca_da_alianca_representacao').getByText('Pode receber').count(), 1);
  assert.equal(await page.getByTestId('tab-artifact-holy_candelabro_do_tabernaculo').getByText('Pode receber').count(), 1);
  await inViewport(page.getByRole('button', { name: 'Iniciar marco: Êxodo 25' }), 'Iniciar marco (320px)');
  await noOverflow(page, 'detalhe do marco');
  await page.waitForTimeout(300);
  await shot(page, 'j-02-marco-exodo25-320');
  step('detalhe do marco: Tabernáculo com Arca, Mesa e Candelabro; Mesa "Você já possui", Arca e Candelabro "Pode receber"; Iniciar sem rolagem');

  await page.getByRole('button', { name: 'Iniciar marco: Êxodo 25' }).click();
  await page.getByTestId('session-milestone').waitFor();
  await inViewport(page.getByRole('button', { name: 'Pausar' }), 'Pausar');
  await inViewport(page.getByRole('button', { name: 'Finalizar missão' }), 'Finalizar missão');
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Pausar' }).click();
  await noOverflow(page, 'sessão de leitura');
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
  // perda da resposta na finalização: o servidor registra, mas a resposta não chega
  await page.route('**/rest/v1/rpc/complete_reading_mission', async (r) => { await r.fetch(); await r.abort('connectionreset'); });
  await finishHere(page);
  await page.getByText('Finalização pendente').first().waitFor();
  await page.unroute('**/rest/v1/rpc/complete_reading_mission');
  assert.equal(Number((await db.query(`select count(*) from user_items where user_id = $1 and item_id in ('holy_arca_da_alianca_representacao','holy_candelabro_do_tabernaculo')`, [rute])).rows[0].count), 2, 'o servidor já concedeu');
  await page.reload();
  await page.goto(`${APP}/home`);
  await panel.getByText('Aguardando o servidor').waitFor();
  await inViewport(panel.getByRole('button', { name: 'Verificar resultado' }), 'Verificar resultado');
  await shot(page, 'j-01c-inicio-pendente-320');
  await panel.getByRole('button', { name: 'Verificar resultado' }).click();
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  // revelação: só os dois concedidos
  await page.getByTestId('reveal-overlay').waitFor();
  await page.getByTestId('reveal-item-holy_arca_da_alianca_representacao').waitFor();
  await page.getByTestId('reveal-item-holy_candelabro_do_tabernaculo').waitFor();
  assert.equal(await page.getByTestId('reveal-item-holy_mesa_dos_paes_da_presenca').count(), 0, 'a Mesa já era da conta: não é celebrada');
  await page.getByText('Já estava no seu Santuário: Mesa dos Pães da Presença').waitFor();
  await page.getByRole('button', { name: 'Pular animação' }).click();
  await page.getByTestId('reveal-overlay').getByRole('button', { name: 'Ver no Santuário' }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Pular animação' }).count(), 0);
  await noOverflow(page, 'revelação');
  await shot(page, 'j-04-revelacao-pulada-320');
  const items = (await db.query(`select item_id, count(*)::int n from user_items where user_id = $1 and item_id like 'holy_%' group by item_id order by item_id`, [rute])).rows;
  assert.deepEqual(items.map((r) => [r.item_id, r.n]), [['holy_arca_da_alianca_representacao', 1], ['holy_candelabro_do_tabernaculo', 1], ['holy_mesa_dos_paes_da_presenca', 1]]);
  step('leitura do marco: pausa, retomada após reabrir (Início prioriza Continuar leitura), resposta perdida → Verificar resultado → revelação só da Arca e do Candelabro, sem duplicar; Pular animação');

  // ================================================================ Santuário com os três
  await page.getByTestId('reveal-overlay').getByRole('button', { name: 'Ver no Santuário' }).click();
  await page.getByTestId('exhibition-hall').waitFor();
  assert.equal(await page.getByTestId('counter-milestones').innerText(), 'Marcos cumpridos: 1 de 20');
  assert.equal(await page.getByTestId('counter-saints').innerText(), 'Santos obtidos: 3 de 22');
  assert.equal(await page.getByTestId('collection-owned-works-father').innerText(), '3 de 13 Santos obtidos');
  for (const id of ['holy_arca_da_alianca_representacao', 'holy_mesa_dos_paes_da_presenca', 'holy_candelabro_do_tabernaculo']) {
    assert.match(await page.getByTestId(`exhibit-${id}`).getAttribute('aria-label'), /Obtido/);
  }
  await noOverflow(page, 'Santuário');
  await shot(page, 'j-05-santuario-320');
  await page.getByTestId('exhibit-holy_arca_da_alianca_representacao').click();
  assert.equal(await page.getByTestId('exhibit-passage').innerText(), 'Êxodo 25:10-22');
  assert.equal(await page.getByTestId('exhibit-meaning').innerText(), 'Modelo ilustrado da arca descrita no Tabernáculo');
  await page.getByTestId('exhibit-detail').scrollIntoViewIfNeeded();
  await shot(page, 'j-05b-santuario-detalhe-320');
  // reabrir a tela de recompensa não repete a revelação
  await page.goto(`${APP}/reading/completed`);
  await page.getByText('Marco: a mobília do Tabernáculo — concluído').waitFor();
  assert.equal(await page.getByTestId('reveal-overlay').count(), 0);
  step('Santuário: os três artefatos expostos e obtidos, contadores distintos (1 de 20 marcos, 3 de 22 Santos, coleção 3 de 13), toque mostra passagem e significado; a revelação não se repete');

  // ================================================================ leitura comum de Êxodo 25 não concede Santos
  await db.query(`insert into user_items (user_id, item_id, source_event_id) values ($1, 'holy_mesa_dos_paes_da_presenca', 'test:prototipo') on conflict do nothing`, [davi]);
  await B.page.goto(`${APP}/read`);
  await B.page.getByRole('radio', { name: /^Êxodo,/ }).click();
  await B.page.getByRole('radio', { name: 'Capítulo 25', exact: true }).click();
  await B.page.getByRole('button', { name: 'Iniciar missão: Êxodo 25' }).click();
  await finishHere(B.page);
  await B.page.getByText('Este capítulo também tem o “Marco: a mobília do Tabernáculo”.').first().waitFor();
  assert.equal(await B.page.getByTestId('reveal-overlay').count(), 0, 'leitura comum: sem revelação');
  assert.equal(Number((await db.query(`select count(*) from user_items where user_id = $1 and item_id in ('holy_arca_da_alianca_representacao','holy_candelabro_do_tabernaculo')`, [davi])).rows[0].count), 0);
  step('leitura comum de Êxodo 25: recompensas habituais, sem Santos e sem revelação');

  // ================================================================ revelação completa gravada (412 px) e movimento reduzido
  const V = await phone(browser, 412, 915, { recordVideo: { dir: VIDEOS, size: { width: 412, height: 915 } } });
  const daviEmail = (await db.query('select email from auth.users where id = $1', [davi])).rows[0].email;
  await V.page.goto(APP);
  await V.page.getByRole('button', { name: 'Entrar' }).click();
  await V.page.getByLabel('E-mail').fill(daviEmail);
  await V.page.getByLabel('Senha', { exact: true }).fill('senha-forte-123');
  await V.page.getByRole('button', { name: 'Entrar' }).last().click();
  await V.page.getByText('Paz, Davi!').waitFor();
  await V.page.goto(`${APP}/reading/milestone/marco_mobilia_do_tabernaculo`);
  await V.page.getByTestId('tabernacle-stage').waitFor();
  await noOverflow(V.page, 'detalhe do marco 412');
  await shot(V.page, 'j-02-marco-exodo25-412');
  await V.page.getByRole('button', { name: 'Iniciar marco: Êxodo 25' }).click();
  await V.page.waitForTimeout(1100);
  await finishHere(V.page);
  await V.page.getByTestId('reveal-overlay').waitFor();
  await V.page.waitForTimeout(1200);
  await shot(V.page, 'j-04a-revelacao-em-curso-412');
  await V.page.getByTestId('reveal-overlay').getByRole('button', { name: 'Ver no Santuário' }).waitFor({ timeout: 8000 });
  await V.page.waitForTimeout(1500);
  await shot(V.page, 'j-04-revelacao-412');
  await V.page.getByTestId('reveal-overlay').getByRole('button', { name: 'Ver no Santuário' }).click();
  await V.page.getByTestId('exhibition-hall').waitFor();
  await V.page.waitForTimeout(800);
  await shot(V.page, 'j-05-santuario-412');
  const revealVideo = await V.page.video().path();
  await V.ctx.close();
  fs.renameSync(revealVideo, `${VIDEOS}/revelacao.webm`);

  step('revelação completa gravada em 412 px (raios, artefatos surgindo, Ver no Santuário); Santuário em 412 px');

  // movimento reduzido: a mesma revelação aparece estática e completa de uma vez (sem "Pular animação")
  const M = await phone(browser, 320, 640, { reducedMotion: 'reduce' });
  const ester = await onboard(M.page, { name: 'Ester', user: 'ester_proto', body: 'Modelo A', skin: 'Tom 3', hair: 'Curto', color: 'Castanho' });
  await grant(ester, 'holy_mesa_dos_paes_da_presenca');
  await M.page.goto(`${APP}/reading/milestone/marco_mobilia_do_tabernaculo`);
  await M.page.getByRole('button', { name: 'Iniciar marco: Êxodo 25' }).click();
  await M.page.waitForTimeout(1100);
  await finishHere(M.page);
  await M.page.getByTestId('reveal-overlay').waitFor();
  await M.page.getByTestId('reveal-overlay').getByRole('button', { name: 'Ver no Santuário' }).waitFor({ timeout: 1000 });
  assert.equal(await M.page.getByRole('button', { name: 'Pular animação' }).count(), 0, 'sem animação para pular');
  assert.equal(await M.page.getByTestId('reveal-item-holy_mesa_dos_paes_da_presenca').count(), 0);
  const o1 = await M.page.getByTestId('reveal-overlay').screenshot();
  await M.page.waitForTimeout(700);
  const o2 = await M.page.getByTestId('reveal-overlay').screenshot();
  assert.ok(o1.equals(o2), 'movimento reduzido: revelação estática');
  await shot(M.page, 'j-04c-revelacao-movimento-reduzido-320');
  await M.page.goto(`${APP}/home`);
  await campAvatar(M.page).waitFor();
  await M.page.waitForTimeout(500);
  const h1 = await M.page.getByTestId('camp-hero').screenshot();
  await M.page.waitForTimeout(800);
  const h2 = await M.page.getByTestId('camp-hero').screenshot();
  assert.ok(h1.equals(h2), 'movimento reduzido: acampamento estático');
  await M.ctx.close();
  step('movimento reduzido: revelação e acampamento estáticos, com o mesmo conteúdo e o botão Ver no Santuário');

  await browser.close();
  await db.end();
  console.log('✔ Percurso do protótipo concluído.');
})().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
