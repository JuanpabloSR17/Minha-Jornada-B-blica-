// Fluxo verificável do Marco 1: criar conta → identidade → personagem em 4 passos →
// ritmo → reabrir (recarregar e "outro aparelho") com o mesmo visual → editar/descartar/salvar.
// Rodado por e2e/run.sh. Requer Playwright + Chromium disponíveis no ambiente.
const { chromium } = require('playwright');
const pg = require('pg');
const assert = require('node:assert/strict');

const APP = process.env.APP_URL ?? 'http://localhost:8081';
const SHOTS = process.env.SHOTS_DIR;
const db = new pg.Client({ host: process.env.PGHOST, port: Number(process.env.PGPORT), user: 'postgres', database: 'jb_test' });

const step = (msg) => console.log(`  ✔ ${msg}`);
const shot = async (page, name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png` });
const stage = (page) => page.getByRole('img', { name: /^Prévia do personagem/ }).first();
const pick = async (page, tab, option) => {
  await page.getByRole('tab', { name: tab, exact: true }).click();
  await page.getByRole('radio', { name: option, exact: true }).click();
};

async function newPhone(browser, scheme = 'light') {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('pageerror:', e));
  return { ctx, page };
}

(async () => {
  await db.connect();
  const browser = await chromium.launch();
  const email = `ana+${Date.now()}@teste.local`;
  const password = 'senha-forte-123';

  // ------------------------------------------------------------ cadastro
  const A = await newPhone(browser);
  let page = A.page;
  await page.goto(APP);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Criar conta' }).last().click();
  await page.getByText('Como você quer ser chamado?').waitFor();
  step('conta criada e redirecionada para identidade');

  // ------------------------------------------------------------ identidade
  await page.getByLabel('Nome de exibição').fill('Ana Teste');
  await page.getByLabel('Nome de usuário').fill('ana_teste');
  await page.getByText('Disponível').waitFor();
  await shot(page, 'e2e-01-identity');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByText('Criar personagem').waitFor();
  step('identidade salva (username único verificado no servidor)');

  // ------------------------------------------------------------ criador
  await pick(page, 'Modelo', 'Modelo C');
  await pick(page, 'Tom de pele', 'Tom 5');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await pick(page, 'Expressão', 'Alegria');
  await pick(page, 'Barba', 'Curta');
  await page.getByRole('button', { name: 'Voltar' }).last().click(); // voltar não perde seleção
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('tab', { name: 'Barba' }).click();
  assert.equal(await page.getByRole('radio', { name: 'Curta', exact: true }).getAttribute('aria-checked'), 'true');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await pick(page, 'Estilo', 'Tranças');
  await pick(page, 'Cor', 'Cobre');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await pick(page, 'Túnica', 'Túnica Índigo');
  await pick(page, 'Manto', 'Manto Carmim');
  await pick(page, 'Cabeça', 'Faixa de Cabeça');
  await shot(page, 'e2e-02-creator-step4');
  step('quatro passos preenchidos; seleção preservada ao voltar');

  await page.getByRole('button', { name: 'Finalizar personagem' }).click();
  await page.getByText('Qual é o seu ritmo?').waitFor();
  step('personagem salvo no servidor');

  // ------------------------------------------------------------ ritmo
  await page.getByRole('radio', { name: 'Personalizada' }).click();
  await page.getByRole('button', { name: '+' }).click();
  await page.getByRole('button', { name: '+' }).click();
  await shot(page, 'e2e-03-pace');
  await page.getByRole('button', { name: 'Começar a jornada' }).click();
  await page.getByText('Paz, Ana Teste!').waitFor();
  await page.getByText('Meta de hoje: 6 capítulos').waitFor();
  await shot(page, 'e2e-04-home');
  step('onboarding concluído, Início mostra meta de 6 capítulos');

  // ------------------------------------------------------------ conferência no banco
  const { rows: [row] } = await db.query(
    `select a.body_id, a.skin_tone_id, a.expression_id, a.beard_id, a.hair_style_id, a.hair_color_id, a.version,
            (select jsonb_object_agg(e.slot, e.item_id) from avatar_loadout_equipment e join avatar_loadouts l on l.id = e.loadout_id where l.user_id = p.id and l.is_active) as eq,
            r.target_chapters_per_day, p.privacy_mode, p.onboarding_completed_at is not null as done
       from profiles p join avatar_appearances a on a.user_id = p.id join reading_preferences r on r.user_id = p.id
      where p.username = 'ana_teste'`,
  );
  assert.deepEqual(
    [row.body_id, row.skin_tone_id, row.expression_id, row.beard_id, row.hair_style_id, row.hair_color_id],
    ['body-c', 'skin-5', 'expr-joy', 'beard-short', 'hair-braids', 'haircolor-copper'],
  );
  assert.equal(row.eq.outfit, 'tunic-indigo');
  assert.equal(row.eq.back, 'cloak-crimson');
  assert.equal(row.eq.head, 'headband-linen');
  assert.equal(row.target_chapters_per_day, 6);
  assert.equal(row.privacy_mode, 'private');
  assert.equal(row.done, true);
  step('banco confere: aparência, equipamento, meta e perfil privado');

  // ------------------------------------------------------------ reabrir
  await page.getByRole('tab', { name: 'Perfil' }).click();
  await page.getByText('@ana_teste').waitFor();
  await page.waitForTimeout(500);
  const before = await stage(page).screenshot();
  await shot(page, 'e2e-05-profile');
  await page.reload();
  await page.getByText('@ana_teste').waitFor(); // reabre direto no Perfil, sem onboarding
  assert.equal(await page.getByText('Como você quer ser chamado?').count(), 0);
  await page.waitForTimeout(500);
  const afterReload = await stage(page).screenshot();
  assert.ok(before.equals(afterReload), 'avatar diferente após recarregar');
  step('após reiniciar o app, o mesmo avatar aparece (comparação pixel a pixel)');

  const B = await newPhone(browser);
  await B.page.goto(APP);
  await B.page.getByRole('button', { name: 'Entrar' }).click();
  await B.page.getByLabel('E-mail').fill(email);
  await B.page.getByLabel('Senha', { exact: true }).fill(password);
  await B.page.getByRole('button', { name: 'Entrar' }).last().click();
  await B.page.getByText('Paz, Ana Teste!').waitFor();
  await B.page.getByRole('tab', { name: 'Perfil' }).click();
  await B.page.getByText('@ana_teste').waitFor();
  await B.page.waitForTimeout(500);
  const otherDevice = await stage(B.page).screenshot();
  assert.ok(before.equals(otherDevice), 'avatar diferente no segundo aparelho');
  step('login em "outro aparelho" vai direto ao Início (sem onboarding) com o mesmo avatar');

  // ------------------------------------------------------------ editor: descartar e salvar
  await page.getByRole('button', { name: 'Personalizar' }).click();
  await page.getByText('Personalizar').first().waitFor();
  await page.getByRole('tab', { name: 'Cabelo' }).click();
  await pick(page, 'Estilo', 'Coque');
  await page.getByRole('button', { name: 'Descartar' }).click();
  await page.getByRole('button', { name: 'Descartar' }).last().click(); // confirma no diálogo
  const { rows: [v1] } = await db.query(`select a.version, a.hair_style_id from avatar_appearances a join profiles p on p.id = a.user_id where p.username = 'ana_teste'`);
  assert.equal(v1.hair_style_id, 'hair-braids');
  assert.equal(v1.version, row.version);
  step('Descartar não persiste alterações');

  await pick(page, 'Estilo', 'Coque');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByText('Salvo na sua conta').first().waitFor();
  const { rows: [v2] } = await db.query(`select a.version, a.hair_style_id from avatar_appearances a join profiles p on p.id = a.user_id where p.username = 'ana_teste'`);
  assert.equal(v2.hair_style_id, 'hair-bun');
  assert.equal(v2.version, row.version + 1);
  await shot(page, 'e2e-06-editor-saved');
  step('Salvar persiste e incrementa a versão');

  // B abre o editor; A salva de novo; B (agora com versão antiga) tenta salvar → conflito.
  await B.page.getByRole('button', { name: 'Personalizar' }).click();
  await B.page.getByRole('tab', { name: 'Rosto' }).waitFor();
  await page.getByRole('tab', { name: 'Rosto' }).click();
  await pick(page, 'Expressão', 'Sereno');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByText('Salvo na sua conta').first().waitFor();
  await B.page.getByRole('tab', { name: 'Rosto' }).click();
  await pick(B.page, 'Expressão', 'Admirado');
  await B.page.getByRole('button', { name: 'Salvar' }).click();
  await B.page.getByText('alterado em outro aparelho').waitFor();
  const { rows: [v3] } = await db.query(`select a.expression_id from avatar_appearances a join profiles p on p.id = a.user_id where p.username = 'ana_teste'`);
  assert.equal(v3.expression_id, 'expr-calm');
  await shot(B.page, 'e2e-07-version-conflict');
  step('edição simultânea em dois aparelhos: conflito detectado, nada sobrescrito');

  // ------------------------------------------------------------ segundo usuário
  const C = await newPhone(browser, 'dark');
  await C.page.goto(APP);
  await C.page.getByRole('button', { name: 'Criar conta' }).click();
  await C.page.getByLabel('E-mail').fill(`bia+${Date.now()}@teste.local`);
  await C.page.getByLabel('Senha', { exact: true }).fill(password);
  await C.page.getByRole('button', { name: 'Criar conta' }).last().click();
  await C.page.getByLabel('Nome de usuário').fill('ana_teste');
  await C.page.getByText('Já está em uso').waitFor();
  await shot(C.page, 'e2e-08-username-taken-dark');
  step('segundo usuário não consegue usar o mesmo username');

  await browser.close();
  await db.end();
  console.log('✔ Fluxo do Marco 1 passou.');
})().catch(async (e) => {
  console.error('✘ Falhou:', e);
  process.exit(1);
});
