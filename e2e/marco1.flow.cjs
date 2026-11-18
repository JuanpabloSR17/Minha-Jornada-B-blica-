// Fluxo verificável: criar conta → identidade → skin inicial → ritmo → reabrir (recarregar e
// "outro aparelho") com o mesmo viajante → Vestiário, leitura, marcos, loja de skins e perfil público.
// Rodado por e2e/run.sh. Requer Playwright + Chromium disponíveis no ambiente.
const { chromium } = require('playwright');
const pg = require('pg');
const assert = require('node:assert/strict');
const { openReadingReceipt, dismissReadingRewards } = require('./reading-rewards.cjs');

const APP = process.env.APP_URL ?? 'http://localhost:8081';
const SHOTS = process.env.SHOTS_DIR;
const db = new pg.Client({ host: process.env.PGHOST, port: Number(process.env.PGPORT), user: 'postgres', database: 'jb_test' });

const step = (msg) => console.log(`  ✔ ${msg}`);
const shot = async (page, name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png` });
const stage = (page) => page.getByRole('img', { name: /^Prévia do personagem/ }).first();
/** captura o viajante depois que duas capturas seguidas saem iguais (pintura e fontes carregadas) */
async function steadyShot(page) {
  let last = await stage(page).screenshot();
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(400);
    const now = await stage(page).screenshot();
    if (now.equals(last)) return now;
    last = now;
  }
  return last;
}
const pick = async (page, tab, option) => {
  await page.getByRole('tab', { name: tab, exact: true }).click();
  await page.getByRole('radio', { name: option, exact: true }).click();
};

async function newPhone(browser, scheme = 'light') {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme, timezoneId: 'America/Sao_Paulo', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('pageerror:', e));
  return { ctx, page };
}

(async () => {
  await db.connect();
  const browser = await chromium.launch();
  globalThis.__browser = browser;
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
  await page.getByText('Escolha seu viajante').waitFor();
  step('identidade salva (username único verificado no servidor)');

  // ------------------------------------------------------------ skin inicial
  await page.getByRole('radio', { name: 'Pastor de ovelhas' }).click();
  await page.getByRole('radio', { name: 'Estilo 3 de Pastor de ovelhas' }).click();
  assert.equal(await page.getByRole('radio', { name: 'Estilo 3 de Pastor de ovelhas' }).getAttribute('aria-checked'), 'true');
  await page.getByText('Pastor de ovelhas', { exact: true }).first().waitFor();
  await shot(page, 'e2e-02-skin-picker');
  await page.getByRole('button', { name: 'Começar com esta skin' }).click();
  await page.getByText('Qual é o seu ritmo?').waitFor();
  step('cadastro escolhe a skin inicial (Pastor de ovelhas, estilo 3) e salva no servidor');

  // ------------------------------------------------------------ ritmo
  await page.getByRole('radio', { name: 'Personalizada' }).click();
  await page.getByRole('button', { name: '+' }).click();
  await page.getByRole('button', { name: '+' }).click();
  await shot(page, 'e2e-03-pace');
  await page.getByRole('button', { name: 'Começar a jornada' }).click();
  await page.getByText('Paz, Ana Teste!').waitFor();
  await page.getByText('Meta pessoal: 6 capítulos por dia').waitFor();
  await shot(page, 'e2e-04-home');
  step('onboarding concluído, Início mostra meta de 6 capítulos');

  // ------------------------------------------------------------ conferência no banco
  const { rows: [row] } = await db.query(
    `select a.skin_tone_id, a.hair_color_id, a.hair_style_id, a.version, s.skin_id, s.style,
            r.target_chapters_per_day, p.privacy_mode, p.onboarding_completed_at is not null as done
       from profiles p join avatar_appearances a on a.user_id = p.id join reading_preferences r on r.user_id = p.id
       join user_skin_selection s on s.user_id = p.id
      where p.username = 'ana_teste'`,
  );
  const season = require('../src/features/skins/season1.json');
  const pastor3 = season.skins.find((x) => x.id === 'comum_pastor').styles[2];
  assert.deepEqual([row.skin_id, row.style], ['comum_pastor', 3]);
  assert.deepEqual([row.skin_tone_id, row.hair_color_id, row.hair_style_id], [pastor3.skinTone, pastor3.hairColor, pastor3.hairStyle]);
  assert.equal(row.target_chapters_per_day, 6);
  assert.equal(row.privacy_mode, 'private');
  assert.equal(row.done, true);
  step('banco confere: skin vestida (Pastor, estilo 3), pele e cabelo do estilo, meta e perfil privado');

  // ------------------------------------------------------------ reabrir
  await page.getByRole('tab', { name: 'Perfil' }).click();
  await page.getByText('@ana_teste').waitFor();
  await page.waitForTimeout(500);
  const before = await steadyShot(page);
  await shot(page, 'e2e-05-profile');
  await page.reload();
  await page.getByText('@ana_teste').waitFor(); // reabre direto no Perfil, sem onboarding
  assert.equal(await page.getByText('Como você quer ser chamado?').count(), 0);
  await page.waitForTimeout(500);
  const afterReload = await steadyShot(page);
  assert.ok(before.equals(afterReload), 'avatar diferente após recarregar');
  step('após reiniciar o app, o mesmo viajante aparece (comparação pixel a pixel)');

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
  const otherDevice = await steadyShot(B.page);
  assert.ok(before.equals(otherDevice), 'avatar diferente no segundo aparelho');
  step('login em "outro aparelho" vai direto ao Início (sem onboarding) com o mesmo viajante');

  // ============================================================ VESTIÁRIO DE SKINS
  const anaId = (await db.query(`select id from profiles where username = 'ana_teste'`)).rows[0].id;
  const worn = async () => (await db.query(`select skin_id, style from user_skin_selection where user_id = $1`, [anaId])).rows[0];

  await page.goto(`${APP}/profile`);
  await page.getByTestId('profile-act-vestiario').click();
  await page.getByTestId('vestiario-stage').waitFor();
  await page.getByText('Minhas (2)').waitFor();
  await page.getByTestId('vestiario-comum_peregrino_exodo').click();
  await page.getByRole('radio', { name: 'Estilo 2 de Peregrino do Êxodo' }).click();
  await page.getByRole('button', { name: 'Vestir o estilo 2' }).click();
  await page.getByText('Pronto: você está vestindo Peregrino do Êxodo, estilo 2.').waitFor();
  assert.deepEqual(await worn(), { skin_id: 'comum_peregrino_exodo', style: 2 });
  await page.getByRole('button', { name: 'Vestindo agora' }).waitFor();
  await shot(page, 'm2-01-vestiario');
  step('Vestiário: trocar de skin e de estilo salva no servidor');

  // skin que a conta não tem: mostra como conseguir e não deixa vestir
  await page.getByRole('tab', { name: /^Todas/ }).click();
  await page.getByTestId('vestiario-lendario_moises').click();
  await page.getByTestId('vestiario-locked').waitFor();
  await page.getByText('Conquistada lendo').waitFor();
  assert.equal(await page.getByRole('button', { name: /^Vestir/ }).count(), 0);
  await page.getByTestId('vestiario-raro_levita').click();
  await page.getByRole('button', { name: 'Loja' }).waitFor();
  await shot(page, 'm2-02-vestiario-locked');
  // o servidor também recusa vestir o que não é seu
  await db.query('begin');
  await db.query(`set local role authenticated`);
  await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [anaId]);
  await assert.rejects(db.query(`select public.equip_skin('lendario_moises', 1)`), /skin_not_owned/);
  await db.query('rollback');
  assert.deepEqual(await worn(), { skin_id: 'comum_peregrino_exodo', style: 2 });
  step('Vestiário: skin bloqueada mostra como conseguir; o servidor recusa vestir skin que não é sua');

  for (const [w, h, name] of [[320, 568, 'small'], [1280, 800, 'desktop']]) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(`${APP}/vestiario`);
    await page.getByTestId('vestiario-stage').waitFor();
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(overflow, false, `rolagem horizontal em ${w}px`);
    await shot(page, `m2-10-vestiario-${name}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  step('Vestiário sem rolagem lateral em 320 e 1280 px');

  // as rotas antigas de peças levam ao Vestiário
  for (const old of ['/avatar/wardrobe', '/avatar/collections', '/avatar/loadouts', '/avatar/editor', '/avatar/item/cloak-succession']) {
    await page.goto(`${APP}${old}`);
    await page.getByTestId('vestiario-stage').waitFor();
  }
  await page.goto(`${APP}/avatar/sanctuary`);
  await page.getByText('Marcos cumpridos: 0 de 20').waitFor();
  step('rotas antigas de peças abrem o Vestiário; o Santuário abre os Marcos');

  // motor de recompensas do servidor continua registrando (peças fora da interface, nada se perde)
  await db.query(`insert into user_items (user_id, item_id, source_event_id) values ($1, 'cloak-elijah', 'legacy:e2e')`, [anaId]);
  for (const [book, ch] of [['GEN', 37], ['1SA', 16], ['2KI', 2]]) {
    await db.query(`select private.record_event($1, 'CHAPTER_COMPLETED', $2, $3)`, [anaId, `chapter:${book}.${ch}`, JSON.stringify({ book, chapter: ch })]);
  }
  await db.query(`select private.record_event($1, 'CHAPTER_COMPLETED', 'chapter:GEN.37', '{"book":"GEN","chapter":37}')`, [anaId]);
  const rewards = (await db.query(`select item_id from reward_events where user_id = $1 order by item_id`, [anaId])).rows.map((r) => r.item_id);
  assert.deepEqual(rewards, ['cloak-succession', 'harp-psalmist', 'tunic-joseph']);
  await db.query(`select private.record_event($1, 'MILESTONE_REACHED', 'milestone:holy_mana_do_deserto', '{"milestone":"holy_mana_do_deserto"}')`, [anaId]);
  await db.query(`select private.record_event($1, 'CHAPTER_COMPLETED', 'chapter:ACT.2', '{"book":"ACT","chapter":2}')`, [anaId]);
  assert.equal((await db.query(`select count(*)::int n from user_items ui join cosmetic_items i on i.id = ui.item_id where ui.user_id = $1 and i.rarity = 'holy'`, [anaId])).rows[0].n, 1);
  step('servidor segue registrando conquistas (3 recompensas, sem duplicar; marco concede, leitura comum não)');

  // perfil público: privado por padrão; o cartão mostra a skin vestida
  await page.goto(`${APP}/profile`);
  await page.getByRole('button', { name: 'Privacidade (toque para alternar): Perfil privado' }).click();
  await page.getByRole('button', { name: 'Privacidade (toque para alternar): Perfil público' }).waitFor();
  assert.equal((await db.query(`select privacy_mode from profiles where id = $1`, [anaId])).rows[0].privacy_mode, 'public');
  await shot(page, 'm2-07-profile');
  await page.goto(`${APP}/friends`);
  await page.getByText('Prévia do seu cartão').waitFor();
  await shot(page, 'm2-08-friends');
  step('perfil: ações com ícones, privacidade e cartão com a skin vestida');

  // ============================================================ MODO MISSÃO (leitura física)
  // Rute 1–3 concluídos pelo mesmo RPC do app (como a própria Ana), para testar o Lendário no capítulo 4
  for (const n of [1, 2, 3]) {
    await db.query('begin');
    await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [anaId]);
    await db.query(`select public.complete_reading_mission(gen_random_uuid(), 'RUT', $1, 'physical', now() - interval '5 minutes', 120)`, [n]);
    await db.query('commit');
  }
  const clockText = async () => (await page.getByRole('timer').innerText()).split('\n')[0].trim();
  await page.goto(`${APP}/read`);
  await page.getByText('Modo Missão', { exact: true }).first().waitFor();
  await page.getByRole('radio', { name: /^Rute, 3 de 4/ }).click();
  await page.getByRole('radio', { name: 'Capítulo 4', exact: true }).click();
  await page.getByText('Leitor digital ainda não disponível', { exact: false }).waitFor();
  await shot(page, 'm4-01-mission-choose');
  await page.getByRole('button', { name: 'Iniciar missão: Rute 4' }).click();
  await page.getByText('Abra sua Bíblia em Rute 4', { exact: false }).waitFor();
  await page.waitForTimeout(2300);
  assert.ok((await clockText()) >= '00:02', 'cronômetro conta');
  await page.getByRole('button', { name: 'Pausar' }).click();
  const pausedAt = await clockText();
  await page.waitForTimeout(2200);
  assert.equal(await clockText(), pausedAt, 'pausado não conta tempo');
  await shot(page, 'm4-02-mission-paused');
  step('missão física: escolhe livro/capítulo, cronômetro conta e para ao pausar');

  // "reabrir o app": recarrega a página; a sessão volta igual, pausada, com o mesmo tempo
  await page.reload();
  await page.getByText('Pausado').first().waitFor();
  assert.equal(await clockText(), pausedAt);
  await page.getByRole('button', { name: 'Retomar' }).click();
  await page.waitForTimeout(1500);
  assert.ok((await clockText()) > pausedAt, 'retomado volta a contar');
  step('reabrir o app restaura a missão pausada e permite retomar');

  // falha de conexão 1: o pedido nem chega ao servidor
  const rutCount = async () => Number((await db.query(`select count(*) from reading_sessions where user_id = $1 and book_code = 'RUT' and chapter = 4`, [anaId])).rows[0].count);
  await page.route('**/rest/v1/rpc/complete_reading_mission', (r) => r.abort('internetdisconnected'));
  await page.getByRole('button', { name: 'Finalizar missão' }).click();
  await page.getByRole('button', { name: 'Concluí a leitura' }).click();
  await page.getByText('Finalização pendente').filter({ visible: true }).first().waitFor();
  assert.equal(await rutCount(), 0);
  const frozen = await clockText();
  await page.waitForTimeout(1200);
  assert.equal(await clockText(), frozen, 'tempo congelado após confirmar');
  // falha de conexão 2: o servidor registra, mas a resposta se perde
  await page.unroute('**/rest/v1/rpc/complete_reading_mission');
  await page.route('**/rest/v1/rpc/complete_reading_mission', async (r) => { await r.fetch(); await r.abort('connectionreset'); });
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await page.getByText('Finalização pendente').filter({ visible: true }).first().waitFor();
  await page.waitForTimeout(400);
  assert.equal(await rutCount(), 1, 'servidor registrou a conclusão uma vez');
  await shot(page, 'm4-03-mission-pending');
  await page.unroute('**/rest/v1/rpc/complete_reading_mission');
  await page.reload();
  await page.getByText('Finalização pendente').filter({ visible: true }).first().waitFor();
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await dismissReadingRewards(page);
  await page.getByText('Missão concluída').waitFor();
  await page.getByText('Esta finalização já tinha sido registrada', { exact: false }).waitFor();
  await page.getByText('Você concluiu Rute!').waitFor();
  // meta pessoal 6: Rute 1–4 são 4 inéditos hoje, faltam 2
  await page.getByText('Hoje: 4 de 6 capítulos inéditos · faltam 2', { exact: false }).waitFor();
  const dup = (await db.query(`select (select count(*) from reading_sessions where user_id = $1 and book_code = 'RUT' and chapter = 4)::int s,
    (select count(*) from user_items where user_id = $1 and item_id = 'book_rut')::int i,
    (select count(*) from xp_ledger where user_id = $1 and source_event_id = 'chapter:RUT.4')::int x`, [anaId])).rows[0];
  assert.deepEqual(dup, { s: 1, i: 1, x: 1 });
  await shot(page, 'm4-04-mission-completed-legendary');
  step('queda de conexão (antes e depois do servidor): sessão pendente preservada, nova tentativa sem duplicar; conquista de Rute registrada uma vez');

  assert.equal(await page.getByRole('button', { name: 'Equipar agora' }).count(), 0, 'sem peças na interface');
  step('resultado da leitura sem peças: só XP, Siclos e progresso');

  // releitura
  await page.goto(`${APP}/read`);
  await page.getByRole('radio', { name: /^Rute, 4 de 4/ }).click();
  await page.getByRole('radio', { name: 'Capítulo 4, concluído' }).click();
  await page.getByRole('button', { name: 'Iniciar missão: Rute 4' }).click();
  await page.getByRole('button', { name: 'Finalizar missão' }).click();
  await page.getByRole('button', { name: 'Concluí a leitura' }).click();
  await page.getByRole('heading', { name: 'Releitura registrada' }).waitFor();
  await page.getByText('Hoje: 4 de 6 capítulos inéditos · faltam 2', { exact: false }).waitFor();
  await page.getByText('Releituras não contam para a meta diária.').waitFor();
  await page.getByText('Esta leitura não rendeu XP nem Siclos novos.').waitFor();
  assert.equal(Number((await db.query(`select count(*) from user_items where user_id = $1 and item_id = 'book_rut'`, [anaId])).rows[0].count), 1);
  await shot(page, 'm4-05-mission-reread');
  step('releitura: informada, sem XP novo e sem duplicar a conquista');

  // ============================================================ META DIÁRIA v2 (meta pessoal 6)
  await page.goto(`${APP}/home`);
  await page.getByText('Meta pessoal: 6 capítulos por dia').waitFor();
  await page.getByText('Hoje: 4 de 6 capítulos').waitFor();
  await page.getByText('Faltam 2 para a recompensa').waitFor();
  await page.getByText('Recompensa: 40 Siclos · 20 XP de bônus', { exact: true }).waitFor();
  await page.getByRole('progressbar').first().waitFor();
  await page.getByRole('button', { name: 'Continuar leitura' }).waitFor();
  await shot(page, 'm6-01-home-daily-goal');
  step('Início: meta pessoal, capítulos de hoje, barra, recompensa prevista, quanto falta e botão de leitura');

  // mudança de meta durante o dia: vale só amanhã
  await page.getByRole('button', { name: 'Alterar meta' }).click();
  await page.getByRole('radio', { name: '2 capítulos por dia' }).click();
  await page.getByRole('button', { name: 'Salvar meta' }).click();
  await page.getByText('vale a partir de', { exact: false }).waitFor();
  const prefs = (await db.query(`select target_chapters_per_day t, pending_target p from reading_preferences where user_id = $1`, [anaId])).rows[0];
  assert.deepEqual(prefs, { t: 6, p: 2 });
  await page.goto(`${APP}/home`);
  await page.getByText('Meta pessoal: 6 capítulos por dia').waitFor();
  await page.getByText('meta de 2 capítulos', { exact: false }).waitFor();
  assert.equal(Number((await db.query(`select count(*) from daily_goals where user_id = $1`, [anaId])).rows[0].count), 0, 'baixar a meta não recompensa hoje');
  step('mudança de meta durante o dia fica agendada para amanhã, sem recompensa retroativa');

  // 5.º capítulo pelo mesmo RPC, 6.º pela tela: a meta 6 é cumprida com celebração
  await db.query('begin');
  await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [anaId]);
  await db.query(`select public.complete_reading_mission(gen_random_uuid(), 'JON', 1, 'physical', now() - interval '5 minutes', 120)`);
  await db.query('commit');
  await page.goto(`${APP}/read`);
  await page.getByText('Hoje: 5 de 6 capítulos').waitFor();
  await page.getByRole('radio', { name: /^Jonas,/ }).click();
  await page.getByRole('radio', { name: 'Capítulo 2', exact: true }).click();
  await page.getByRole('button', { name: 'Iniciar missão: Jonas 2' }).click();
  await page.getByRole('button', { name: 'Finalizar missão' }).click();
  await page.getByRole('button', { name: 'Concluí a leitura' }).click();
  const dailyReceipt = await openReadingReceipt(page);
  await dailyReceipt.getByTestId('receipt-xp').getByText('+60 XP').waitFor();
  await dailyReceipt.getByTestId('receipt-siclos').getByText('+40 Siclos').waitFor();
  await dailyReceipt.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByText('Meta diária cumprida! +40 Siclos · +20 XP').waitFor();
  assert.equal(await page.getByText('Escolha um item Comum').count(), 0, 'sem escolha de peça');
  await page.waitForTimeout(900);
  await shot(page, 'm6-02-goal-celebration');
  const anaGoal = (await db.query(`select target, rule_version, xp_bonus from daily_goals where user_id = $1`, [anaId])).rows;
  assert.deepEqual(anaGoal, [{ target: 6, rule_version: 2, xp_bonus: 20 }]);
  step('6.º capítulo inédito cumpre a meta 6: 40 Siclos e 20 XP de bônus, sem escolha de peça');

  // ------------------------------------------------------------ segundo usuário
  const C = await newPhone(browser, 'dark');
  await C.page.goto(APP);
  await C.page.getByRole('button', { name: 'Criar conta' }).click();
  const biaEmail = `bia+${Date.now()}@teste.local`;
  await C.page.getByLabel('E-mail').fill(biaEmail);
  await C.page.getByLabel('Senha', { exact: true }).fill(password);
  await C.page.getByRole('button', { name: 'Criar conta' }).last().click();
  await C.page.getByLabel('Nome de usuário').fill('ana_teste');
  await C.page.getByText('Já está em uso').waitFor();
  await shot(C.page, 'e2e-08-username-taken-dark');
  step('segundo usuário não consegue usar o mesmo username');

  // segundo usuário vê o perfil público da Ana (só dados consentidos)
  await C.page.getByLabel('Nome de exibição').fill('Bia');
  await C.page.getByLabel('Nome de usuário').fill('bia_teste');
  await C.page.getByText('Disponível').waitFor();
  await C.page.getByRole('button', { name: 'Continuar' }).click();
  await C.page.getByText('Escolha seu viajante').waitFor();
  await C.page.getByRole('button', { name: 'Começar com esta skin' }).click();
  await C.page.getByRole('button', { name: 'Começar a jornada' }).click();
  await C.page.getByText('Paz, Bia!').waitFor();
  // jogador novo: missão especial de 1 Reis 19 desbloqueia o Manto do Profeta
  await C.page.goto(`${APP}/read`);
  await C.page.getByRole('button', { name: /Missão especial: o chamado de Eliseu/ }).click();
  await C.page.getByRole('button', { name: 'Iniciar missão: 1 Reis 19' }).click();
  await C.page.getByRole('button', { name: 'Finalizar missão' }).click();
  await C.page.getByRole('button', { name: 'Concluí a leitura' }).click();
  await dismissReadingRewards(C.page);
  await C.page.getByText('Missão especial: o chamado de Eliseu — concluída').waitFor();
  assert.equal(await C.page.getByText('Manto do Profeta').count(), 0, 'peças não aparecem na interface');
  const biaId = (await db.query(`select id from profiles where username = 'bia_teste'`)).rows[0].id;
  assert.equal(Number((await db.query(`select count(*) from user_items where user_id = $1 and item_id = 'cloak-elijah'`, [biaId])).rows[0].count), 1);
  await shot(C.page, 'm4-06-mission-prophet-cloak-dark');
  step('jogador novo: missão especial de 1 Reis 19 concluída (o servidor registra a conquista)');

  // ============================================================ META DIÁRIA
  await C.page.getByText('Meta diária cumprida! +40 Siclos').waitFor();
  await C.page.getByText('fuso de leitura: America/Sao_Paulo', { exact: false }).waitFor();
  await C.page.getByText('Saldo: 40 Siclos').first().waitFor();
  assert.equal(await C.page.getByRole('radio').count(), 0, 'sem escolha de peça na meta');
  await shot(C.page, 'm5-01-goal-achieved-dark');
  const goalRow = async () => (await db.query(`select options, chosen_item from daily_goals where user_id = $1`, [biaId])).rows;
  assert.equal((await goalRow()).length, 1);
  assert.equal(Number((await db.query(`select coalesce(sum(amount),0) s from siclos_ledger where user_id = $1`, [biaId])).rows[0].s), 40);
  step('meta diária: primeiro capítulo inédito do dia credita 40 Siclos, sem escolha de peça');

  // reabrir e outro aparelho: a meta cumprida aparece, sem aviso de escolha pendente
  await C.page.reload();
  await C.page.goto(`${APP}/home`);
  await C.page.getByText('Meta cumprida hoje!').waitFor();
  assert.equal(await C.page.getByText('Recompensa da meta diária esperando sua escolha').count(), 0);
  await shot(C.page, 'm5-02-goal-home-dark');
  const D = await newPhone(browser);
  await D.page.goto(APP);
  await D.page.getByRole('button', { name: 'Entrar' }).click();
  await D.page.getByLabel('E-mail').fill(biaEmail);
  await D.page.getByLabel('Senha', { exact: true }).fill(password);
  await D.page.getByRole('button', { name: 'Entrar' }).last().click();
  await D.page.getByText('Paz, Bia!').waitFor();
  await D.page.getByText('Meta cumprida hoje!').waitFor();
  await shot(D.page, 'm6-03-other-device-goal');
  await D.ctx.close();
  step('reabrir o app e outro aparelho mostram a meta cumprida na mesma conta');

  // ============================================================ MISSÕES ESPECIAIS DOS RAROS
  // Bia já tem o Peitoral (obtido antes): Êxodo 28 entrega só a Estola e o Turbante
  await db.query(`insert into user_items (user_id, item_id, source_event_id) values ($1, 'rare_peitoral_das_doze_pedras', 'test:obtido-antes')`, [biaId]);
  await C.page.goto(`${APP}/read`);
  await C.page.getByRole('button', { name: /Missão especial: as vestes do sumo sacerdote/ }).click();
  await C.page.getByRole('button', { name: 'Iniciar missão: Êxodo 28' }).click();
  await C.page.getByRole('button', { name: 'Finalizar missão' }).click();
  await C.page.getByRole('button', { name: 'Concluí a leitura' }).click();
  await dismissReadingRewards(C.page);
  await C.page.getByText('Missão especial: as vestes do sumo sacerdote — concluída').waitFor();
  assert.equal(await C.page.getByRole('button', { name: 'Equipar agora' }).count(), 0);
  const ex28 = (await db.query(`select item_id from user_items where user_id = $1 and item_id like 'rare_%' order by item_id`, [biaId])).rows.map((r) => r.item_id);
  assert.deepEqual(ex28, ['rare_estola_sacerdotal', 'rare_peitoral_das_doze_pedras', 'rare_turbante_do_sacerdote']);
  await shot(C.page, 'm8-01-mission-exodus28-dark');
  step('missão de Êxodo 28 concluída; o servidor registra só o que faltava (Estola e Turbante), sem repetir o Peitoral');
  await C.page.goto(`${APP}/home`);

  // ============================================================ MARCOS DOS SANTOS (tela estreita)
  await C.page.setViewportSize({ width: 320, height: 640 });
  const noOverflow = async (label) => assert.equal(await C.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, `rolagem horizontal: ${label}`);
  const finishHere = async () => {
    await C.page.getByRole('button', { name: 'Finalizar missão' }).click();
    await C.page.getByRole('button', { name: 'Concluí a leitura' }).click();
  };
  // aba Ler: resumo compacto (sem a lista completa) e leitura comum de Êxodo 16
  await C.page.goto(`${APP}/read`);
  await C.page.getByText('Marcos cumpridos: 0 de 20').waitFor();
  await C.page.getByRole('button', { name: 'Ver todos os marcos' }).waitFor();
  assert.equal(await C.page.getByText('Marco: Luz da Criação', { exact: true }).count(), 0, 'a aba Ler não lista os 20 marcos');
  await noOverflow('aba Ler');
  await shot(C.page, 'm10-01-read-summary-320');
  await C.page.getByRole('radio', { name: /^Êxodo,/ }).click();
  await C.page.getByRole('radio', { name: 'Capítulo 16', exact: true }).click();
  await C.page.getByRole('button', { name: 'Iniciar missão: Êxodo 16' }).click();
  await finishHere();
  await dismissReadingRewards(C.page);
  await C.page.getByText('Missão concluída').first().waitFor();
  // piloto: a leitura comum explica que o capítulo tem um marco e como cumpri-lo
  await C.page.getByTestId('ordinary-milestone-hint').filter({ visible: true }).getByText('Este capítulo também tem o “Marco: Maná do Deserto”.').waitFor();
  await shot(C.page, 'p1-ordinary-reading-milestone-hint');
  assert.equal(Number((await db.query(`select count(*) from user_items where user_id = $1 and item_id = 'holy_mana_do_deserto'`, [biaId])).rows[0].count), 0);
  step('tela estreita: aba Ler com resumo dos marcos; leitura comum de Êxodo 16 não cumpre o marco');

  // lista completa e filtros
  await C.page.goto(`${APP}/read`);
  await C.page.getByRole('button', { name: 'Ver todos os marcos' }).click();
  await C.page.getByRole('radio', { name: 'Todos (20)' }).waitFor();
  await C.page.getByRole('radio', { name: 'A cumprir (20)' }).click();
  await C.page.getByRole('radio', { name: 'Concluídos (0)' }).click();
  await C.page.getByText('Nenhum marco neste filtro.').waitFor();
  await C.page.getByRole('radio', { name: 'Todos (20)' }).click();
  await noOverflow('lista de marcos');
  await shot(C.page, 'm10-02-milestones-list-320');
  // abrir o marco do Maná: passagem e item; iniciar; pausar; reabrir o app; voltar pela aba Ler
  await C.page.getByRole('link', { name: /^Marco: Maná do Deserto, Êxodo 16, A cumprir/ }).click();
  await C.page.getByText('Passagem', { exact: true }).waitFor();
  assert.equal(await C.page.getByTestId('marco-item-state-holy_mana_do_deserto').count(), 0, 'sem peças no marco');
  await C.page.getByRole('button', { name: 'Iniciar marco: Êxodo 16' }).click();
  await C.page.getByTestId('session-milestone').waitFor();
  await C.page.getByRole('button', { name: 'Pausar' }).click();
  await C.page.reload();
  await C.page.goto(`${APP}/read`);
  await C.page.getByText('Sessão vinculada · Marco: Maná do Deserto').first().waitFor();
  await shot(C.page, 'm10-03-read-active-session-320');
  await C.page.getByRole('button', { name: 'Continuar leitura' }).click();
  await C.page.getByRole('button', { name: 'Retomar' }).click();
  await finishHere();
  // releitura que cumpre o marco: sem XP nem Siclos, então não há bolsa de recompensas
  await C.page.getByText('Marco: Maná do Deserto — concluído').waitFor();
  assert.equal(await C.page.getByTestId('reveal-overlay').count(), 0);
  step('lista com filtros; marco aberto com passagem; após reabrir o app, a aba Ler destaca a sessão vinculada e leva de volta a ela');

  // Êxodo 25 com posse parcial (Mesa já obtida) e finalização aguardando confirmação
  await db.query(`insert into user_items (user_id, item_id, source_event_id) values ($1, 'holy_mesa_dos_paes_da_presenca', 'test:obtido-antes')`, [biaId]);
  await C.page.goto(`${APP}/reading/milestones`);
  await C.page.getByRole('link', { name: /^Marco: a mobília do Tabernáculo, Êxodo 25, A cumprir$/ }).click();
  await noOverflow('detalhe do marco');
  await shot(C.page, 'm10-04-milestone-exodus25-partial-320');
  await C.page.getByRole('button', { name: 'Iniciar marco: Êxodo 25' }).click();
  await C.page.route('**/rest/v1/rpc/complete_reading_mission', (r) => r.abort('internetdisconnected'));
  await finishHere();
  await C.page.getByText('Finalização pendente').filter({ visible: true }).first().waitFor();
  await C.page.unroute('**/rest/v1/rpc/complete_reading_mission');
  await C.page.reload();
  await C.page.goto(`${APP}/read`);
  await C.page.getByText('Aguardando confirmação do servidor').waitFor();
  await shot(C.page, 'm10-05-read-pending-320');
  await C.page.getByRole('button', { name: 'Verificar resultado' }).click();
  await C.page.getByRole('button', { name: 'Tentar novamente' }).click();
  await dismissReadingRewards(C.page);
  await C.page.getByText('Marco: a mobília do Tabernáculo — concluído').waitFor();
  assert.equal(await C.page.getByRole('button', { name: 'Equipar agora' }).count(), 0, 'relíquias não são equipáveis');
  const ex25 = (await db.query(`select item_id, count(*)::int n from user_items where user_id = $1 and item_id like 'holy_%' group by item_id order by item_id`, [biaId])).rows;
  assert.deepEqual(ex25.map((r) => [r.item_id, r.n]), [['holy_arca_da_alianca_representacao', 1], ['holy_candelabro_do_tabernaculo', 1], ['holy_mana_do_deserto', 1], ['holy_mesa_dos_paes_da_presenca', 1]]);
  step('Êxodo 25: finalização pendente destacada na aba Ler; ao confirmar, o servidor registra só o que faltava (Arca e Candelabro)');

  // marco concluído e contadores
  await C.page.goto(`${APP}/reading/milestones`);
  await C.page.getByRole('radio', { name: 'Concluídos (2)' }).click();
  await C.page.getByRole('link', { name: /^Marco: Maná do Deserto, Êxodo 16, Cumprido/ }).click();
  await C.page.getByText('Marco já cumprido', { exact: false }).waitFor();
  assert.equal(await C.page.getByRole('button', { name: /^Iniciar marco/ }).count(), 0);
  await C.page.goto(`${APP}/reading/milestones`);
  await C.page.getByText('Marcos cumpridos: 2 de 20').waitFor();
  await noOverflow('Marcos');
  await shot(C.page, 'm10-06-milestones-320');
  // a página do mundo das Origens mostra os 2 marcos cumpridos
  await C.page.goto(`${APP}/world/origens`);
  await C.page.getByTestId('world-hero-origens').waitFor();
  await C.page.getByText('2/7', { exact: true }).waitFor();
  await noOverflow('mundo das Origens');
  await shot(C.page, 'm10-07-world-origens-320');
  step('marco concluído sem novo início; Marcos (2 de 20) e a página do mundo das Origens mostram o progresso');
  await C.page.setViewportSize({ width: 390, height: 844 });
  await C.page.goto(`${APP}/home`);

  // ============================================================ MERCADO DOS VIAJANTES (só skins)
  const biaBalance = async () => Number((await db.query(`select coalesce(sum(amount),0) s from siclos_ledger where user_id = $1`, [biaId])).rows[0].s);
  await C.page.getByRole('button', { name: 'Mercado dos Viajantes' }).click();
  await C.page.getByText('Saldo: 40 Siclos').first().waitFor();
  await C.page.getByTestId('market-fair').getByText('Comum = 4 dias de meta (160 Siclos), Rara = 10 dias (400), Épica = 25 dias (1.000)', { exact: false }).waitFor();
  const offers = (await db.query(`select o.skin_id id, s.name, o.section, o.price, o.gift from private.skin_offers(private.market_rotation_day(now())) o
    join skins s on s.id = o.skin_id order by o.section, o.skin_id`)).rows;
  const commons = offers.filter((o) => o.section === 'common');
  assert.equal(commons.length, 3);
  assert.equal(offers.filter((o) => o.section === 'rare').length, 3);
  assert.equal(offers.filter((o) => o.section === 'epic').length, 1);
  await C.page.getByTestId(`market-${commons[0].id}`).getByText('Faltam 120 Siclos').waitFor();
  await C.page.getByText('Épica da semana').waitFor();
  await C.page.getByText(/^(Presente de hoje: grátis|Dia de presente: domingo)$/).first().waitFor();
  const card0 = C.page.getByTestId(`market-${commons[0].id}`);
  await card0.getByRole('radio', { name: `Estilo 3 de ${commons[0].name}` }).click();
  await card0.getByRole('radio', { name: `Estilo 3 de ${commons[0].name}`, checked: true }).waitFor();
  await shot(C.page, 'm7-01-market-low-balance-dark');
  step('loja só de skins: saldo das metas, preço justo em dias de leitura, 3 Comuns, 3 Raras, a Épica da semana e os 3 estilos de cada skin');
  // metas dos dias seguintes pelo mesmo caminho do servidor (relógio simulado): +40 Siclos por dia
  for (let k = 1; k <= 5; k++) {
    await db.query(`select private.complete_reading_mission_at($1, gen_random_uuid(), 'MAT', $2, 'physical', now() + make_interval(days => $2) - interval '5 minutes', 60, now() + make_interval(days => $2))`, [biaId, k]);
  }
  assert.equal(await biaBalance(), 240);
  await C.page.reload();
  await C.page.getByText('Saldo: 240 Siclos').first().waitFor();

  // a skin chega por outra via (trilha, outro aparelho) com a confirmação da compra aberta
  const race = commons[1];
  await C.page.getByRole('button', { name: `Comprar ${race.name}` }).click();
  await C.page.getByText('Confirmar compra').waitFor();
  await C.page.getByText(`Você vai adquirir a skin ${race.name}`, { exact: false }).waitFor();
  await db.query(`insert into user_skins (user_id, skin_id, source_event_id) values ($1, $2, 'test:outra-via')`, [biaId, race.id]);
  await C.page.getByRole('button', { name: 'Pagar 160 Siclos' }).click();
  await C.page.getByText(`A skin ${race.name} já é sua, obtida por outra via`, { exact: false }).waitFor();
  await C.page.getByTestId(`market-${race.id}`).getByText('Obtida').waitFor();
  assert.equal(await biaBalance(), 240, 'nada debitado');
  await C.page.waitForTimeout(400);
  await shot(C.page, 'm7-02-market-owned-by-other-route-dark');
  step('compra × skin obtida por outra via: aparece como obtida, sem débito');

  // compra bem-sucedida
  const buy = commons[0];
  await C.page.getByRole('button', { name: `Comprar ${buy.name}` }).click();
  await C.page.getByText('por 160 Siclos. Saldo: 240 → 80 Siclos.', { exact: false }).waitFor();
  await C.page.waitForTimeout(400);
  await shot(C.page, 'm7-03-market-confirm-dark');
  await C.page.getByRole('button', { name: 'Pagar 160 Siclos' }).click();
  await C.page.getByText(`A skin ${buy.name} agora é sua, com os 3 estilos`, { exact: false }).waitFor();
  await C.page.getByTestId(`market-${buy.id}`).getByText('Obtida').waitFor();
  assert.equal(await biaBalance(), 80);
  assert.equal(Number((await db.query(`select count(*) from user_skins where user_id = $1 and skin_id = $2`, [biaId, buy.id])).rows[0].count), 1);
  await shot(C.page, 'm7-04-market-skin-bought-dark');
  step('compra confirmada: débito de 160 (4 dias de leitura) e a skin na conta, na mesma operação');

  // perda da resposta do servidor: recuperar o resultado sem cobrar duas vezes
  for (let k = 6; k <= 10; k++) {
    await db.query(`select private.complete_reading_mission_at($1, gen_random_uuid(), 'MAT', $2, 'physical', now() + make_interval(days => $2) - interval '5 minutes', 60, now() + make_interval(days => $2))`, [biaId, k]);
  }
  assert.equal(await biaBalance(), 280);
  const lostSkin = commons[2];
  await C.page.goto(`${APP}/market`);
  // 1) o pedido nem chega ao servidor: a compra fica pendente e sobrevive a reabrir o app
  await C.page.route('**/rest/v1/rpc/purchase_skin', (r) => r.abort('internetdisconnected'));
  await C.page.getByRole('button', { name: `Comprar ${lostSkin.name}` }).click();
  await C.page.getByRole('button', { name: 'Pagar 160 Siclos' }).click();
  await C.page.getByText('Sem conexão com o servidor', { exact: false }).waitFor();
  await C.page.getByText('Compra aguardando confirmação').waitFor();
  assert.equal(Number((await db.query(`select count(*) from skin_purchases where user_id = $1 and skin_id = $2`, [biaId, lostSkin.id])).rows[0].count), 0);
  await shot(C.page, 'm7-05-market-pending-dark');
  // 2) ao reabrir, a verificação automática reenvia o mesmo ID: o servidor registra, mas a resposta se perde
  await C.page.unroute('**/rest/v1/rpc/purchase_skin');
  await C.page.route('**/rest/v1/rpc/purchase_skin', async (r) => { await r.fetch(); await r.abort('connectionreset'); });
  await C.page.reload();
  await C.page.getByText(`Compra confirmada: a skin ${lostSkin.name} já é sua`, { exact: false }).waitFor();
  assert.equal(await C.page.getByText('Compra aguardando confirmação').count(), 0, 'não mostra pendente e obtida ao mesmo tempo');
  await C.page.getByTestId(`market-${lostSkin.id}`).getByText('Obtida').waitFor();
  await C.page.unroute('**/rest/v1/rpc/purchase_skin');
  await shot(C.page, 'p2-market-confirmed-after-lost-response-dark');
  const lost = (await db.query(`select (select count(*) from skin_purchases where user_id = $1 and skin_id = $2)::int p,
    (select count(*) from user_skins where user_id = $1 and skin_id = $2)::int i`, [biaId, lostSkin.id])).rows[0];
  assert.deepEqual(lost, { p: 1, i: 1 });
  assert.equal(await biaBalance(), 120, 'um único débito');
  step('compra pendente sobrevive a reabrir o app; verificação automática com resposta perdida confirma a compra sem débito duplo e sem estado contraditório');
  await C.page.goto(`${APP}/users/ana_teste`);
  await C.page.getByText('Ana Teste').waitFor();
  assert.equal(await C.page.getByText('ana+', { exact: false }).count(), 0);
  await shot(C.page, 'm2-09-public-profile-dark');
  await db.query(`update profiles set privacy_mode = 'private' where username = 'ana_teste'`);
  await C.page.reload();
  await C.page.getByText('Este perfil é privado.').waitFor();
  step('perfil público visível só quando a dona permite; privado esconde o avatar');

  await browser.close();
  await db.end();
  console.log('✔ Fluxo dos Marcos 1 e 2 passou.');
})().catch(async (e) => {
  console.error('✘ Falhou:', e);
  try {
    for (const ctx of globalThis.__browser?.contexts() ?? []) for (const p of ctx.pages()) await p.screenshot({ path: `${process.env.SHOTS_DIR ?? 'e2e/screenshots'}/zz-falha-${Date.now()}.png` });
  } catch {}
  process.exit(1);
});
