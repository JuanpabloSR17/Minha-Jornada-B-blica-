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
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme, timezoneId: 'America/Sao_Paulo' });
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
  await pick(page, 'Estilo', 'Longo ondulado');
  await pick(page, 'Cor', 'Cobre');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await pick(page, 'Túnica', 'Túnica Índigo');
  await pick(page, 'Manto', 'Manto de Lã');
  await pick(page, 'Calçado', 'Botas de Viagem');
  await shot(page, 'e2e-02-creator-step4');
  step('quatro passos preenchidos; seleção preservada ao voltar');

  // item bíblico bloqueado: pode ser experimentado, mas não salvo
  await pick(page, 'Túnica', 'Túnica de José');
  await page.getByText('Prévia: Túnica de José').waitFor();
  await shot(page, 'e2e-02b-locked-preview');
  await page.getByRole('button', { name: 'Finalizar personagem' }).click();
  await page.getByText('Tire a prévia do item bloqueado para salvar.').waitFor();
  assert.equal(await page.getByText('Qual é o seu ritmo?').count(), 0);
  await page.getByRole('button', { name: 'Tirar prévia' }).click();
  await pick(page, 'Túnica', 'Túnica Índigo');
  step('item bíblico bloqueado: prévia permitida, salvamento bloqueado até tirar a prévia');

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
    ['body-c', 'skin-5', 'expr-joy', 'beard-short', 'hair-long-wavy', 'haircolor-copper'],
  );
  assert.equal(row.eq.outfit, 'tunic-indigo');
  assert.equal(row.eq.back, 'cloak-wool');
  assert.equal(row.eq.feet, 'boots-travel');
  assert.equal(row.eq.head, undefined);
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
  await page.getByRole('button', { name: 'Aparência' }).click();
  await page.getByText('Personalizar').first().waitFor();
  await page.getByRole('tab', { name: 'Cabelo' }).click();
  await pick(page, 'Estilo', 'Cacheado');
  await page.getByRole('button', { name: 'Descartar' }).click();
  await page.getByRole('button', { name: 'Descartar' }).last().click(); // confirma no diálogo
  const { rows: [v1] } = await db.query(`select a.version, a.hair_style_id from avatar_appearances a join profiles p on p.id = a.user_id where p.username = 'ana_teste'`);
  assert.equal(v1.hair_style_id, 'hair-long-wavy');
  assert.equal(v1.version, row.version);
  step('Descartar não persiste alterações');

  await pick(page, 'Estilo', 'Cacheado');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByText('Salvo na sua conta').first().waitFor();
  const { rows: [v2] } = await db.query(`select a.version, a.hair_style_id from avatar_appearances a join profiles p on p.id = a.user_id where p.username = 'ana_teste'`);
  assert.equal(v2.hair_style_id, 'hair-curly');
  assert.equal(v2.version, row.version + 1);
  await shot(page, 'e2e-06-editor-saved');
  step('Salvar persiste e incrementa a versão');

  // B abre o editor; A salva de novo; B (agora com versão antiga) tenta salvar → conflito.
  await B.page.getByRole('button', { name: 'Aparência' }).click();
  await B.page.getByRole('tab', { name: 'Rosto' }).waitFor();
  await page.getByRole('tab', { name: 'Rosto' }).click();
  await pick(page, 'Expressão', 'Sereno');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByText('Salvo na sua conta').first().waitFor();
  await B.page.getByRole('tab', { name: 'Rosto' }).click();
  await pick(B.page, 'Expressão', 'Sorriso');
  await B.page.getByRole('button', { name: 'Salvar' }).click();
  await B.page.getByText('alterado em outro aparelho').waitFor();
  const { rows: [v3] } = await db.query(`select a.expression_id from avatar_appearances a join profiles p on p.id = a.user_id where p.username = 'ana_teste'`);
  assert.equal(v3.expression_id, 'expr-calm');
  await shot(B.page, 'e2e-07-version-conflict');
  step('edição simultânea em dois aparelhos: conflito detectado, nada sobrescrito');

  // ============================================================ MARCO 2
  const anaId = (await db.query(`select id from profiles where username = 'ana_teste'`)).rows[0].id;
  const activeEq = async () => (await db.query(
    `select jsonb_object_agg(e.slot, e.item_id) eq from avatar_loadout_equipment e join avatar_loadouts l on l.id = e.loadout_id where l.user_id = $1 and l.is_active`, [anaId])).rows[0].eq;

  // guarda-roupa: equipar manto e salvar
  await page.goto(`${APP}/profile`);
  await page.getByRole('button', { name: 'Guarda-roupa' }).click();
  await page.getByText('Guarda-roupa').first().waitFor();
  await page.getByRole('tab', { name: 'Mantos' }).click();
  await page.getByRole('radio', { name: /^Manto do Deserto,/ }).click();
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByText('Visual salvo.').waitFor();
  assert.equal((await activeEq()).back, 'cloak-desert');
  await shot(page, 'm2-01-wardrobe');
  step('guarda-roupa: equipar manto e salvar persiste no visual em uso');

  // item bloqueado: prévia permitida, salvar desabilitado
  await page.getByRole('tab', { name: 'Bíblicos' }).click();
  await page.getByRole('radio', { name: /^Túnica de José,.*Bloqueado/ }).click();
  await page.getByText(/Prévia: Túnica de José/).waitFor();
  assert.ok(await page.getByRole('button', { name: 'Salvar' }).isDisabled());
  await shot(page, 'm2-02-locked-preview');
  step('guarda-roupa: item bloqueado só em prévia, sem salvar');

  // cenário isolado de teste: posse legada do Manto do Profeta (conquistado antes do catálogo
  // oficial, onde virou recompensa de missão) e recompensas concedidas por eventos de leitura
  await db.query(`insert into user_items (user_id, item_id, source_event_id) values ($1, 'cloak-elijah', 'legacy:e2e')`, [anaId]);
  for (const [book, ch] of [['GEN', 37], ['1SA', 16], ['2KI', 2]]) {
    await db.query(`select private.record_event($1, 'CHAPTER_COMPLETED', $2, $3)`, [anaId, `chapter:${book}.${ch}`, JSON.stringify({ book, chapter: ch })]);
  }
  await db.query(`select private.record_event($1, 'CHAPTER_COMPLETED', 'chapter:GEN.37', '{"book":"GEN","chapter":37}')`, [anaId]);
  const rewards = (await db.query(`select item_id from reward_events where user_id = $1 order by item_id`, [anaId])).rows.map((r) => r.item_id);
  assert.deepEqual(rewards, ['cloak-succession', 'harp-psalmist', 'tunic-joseph']);
  step('motor de recompensas: 3 itens concedidos pelo servidor, evento repetido não duplica');

  await page.goto(`${APP}/avatar/wardrobe?category=biblical`);
  await page.getByRole('radio', { name: /^Túnica de José,.*Obtido/ }).click();
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.getByText('Visual salvo.').waitFor();
  assert.equal((await activeEq()).outfit, 'tunic-joseph');
  await shot(page, 'm2-03-joseph-equipped');
  step('item conquistado aparece como obtido e é equipado');

  // detalhe do item com variantes evolutivas
  await page.goto(`${APP}/avatar/item/cloak-succession`);
  await page.getByText('Aparências').waitFor();
  await page.getByText('Manto de Elias — Edição dos Profetas').waitFor();
  await page.getByText('2 Reis 2:13-14').first().waitFor();
  await shot(page, 'm2-04-item-detail');
  await page.getByRole('button', { name: 'Equipar no visual em uso' }).click();
  await page.getByText('Visual salvo.').waitFor();
  assert.equal((await activeEq()).back, 'cloak-succession');
  step('detalhe do item: referência, variantes e equipar a aparência evoluída');

  // coleções
  await page.goto(`${APP}/avatar/collections`);
  await page.getByText('Coleção dos Profetas', { exact: true }).waitFor();
  await page.getByText('2 de 3 itens').waitFor();
  await shot(page, 'm2-05-collections');
  step('coleções: progresso calculado no servidor');

  // visuais salvos: limite gratuito
  await page.goto(`${APP}/avatar/loadouts`);
  await page.getByText('Plano gratuito: 1 de 3 visuais').waitFor();
  for (const name of ['Viagem', 'Festa']) {
    await page.getByRole('button', { name: 'Novo visual' }).click();
    await page.getByLabel('Nome do visual').fill(name);
    assert.equal(await page.getByLabel('Nome do visual').inputValue(), name, `campo do nome antes de salvar "${name}"`);
    await page.getByRole('button', { name: 'Salvar' }).click();
    await page.getByText(name, { exact: true }).waitFor();
  }
  await page.getByText('Plano gratuito: 3 de 3 visuais').waitFor();
  assert.ok(await page.getByRole('button', { name: 'Novo visual' }).isDisabled());
  await page.getByRole('button', { name: 'Usar' }).first().click();
  await page.waitForTimeout(600);
  const activeName = (await db.query(`select name from avatar_loadouts where user_id = $1 and is_active`, [anaId])).rows[0].name;
  assert.notEqual(activeName, 'Visual 1');
  await shot(page, 'm2-06-loadouts');
  for (const [w, h, name] of [[320, 568, 'small'], [1280, 800, 'desktop']]) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(`${APP}/avatar/wardrobe?category=back`);
    await page.getByRole('tab', { name: 'Mantos' }).waitFor();
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(overflow, false, `rolagem horizontal em ${w}px`);
    await shot(page, `m2-10-wardrobe-${name}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  step('visuais salvos: cria até 3, botão bloqueia no limite, troca o visual em uso');

  // perfil público: privado por padrão
  await page.goto(`${APP}/profile`);
  await page.getByRole('radio', { name: 'Perfil público' }).click();
  await page.waitForTimeout(500);
  assert.equal((await db.query(`select privacy_mode from profiles where id = $1`, [anaId])).rows[0].privacy_mode, 'public');
  await shot(page, 'm2-07-profile');
  await page.goto(`${APP}/friends`);
  await page.getByText('Como os outros veem você').waitFor();
  await shot(page, 'm2-08-friends');
  step('perfil: atalhos do avatar, privacidade e cartões de avatar');

  // ============================================================ RARIDADES E SANTUÁRIO
  await page.goto(`${APP}/avatar/wardrobe?category=back`);
  await page.getByRole('radio', { name: 'Lendário', exact: true }).click();
  await page.getByRole('radio', { name: /^Manto da Promessa, Lendário, Bloqueado/ }).waitFor();
  assert.equal(await page.getByRole('radio', { name: /^Manto de Lã,/ }).count(), 0);
  await shot(page, 'm3-01-wardrobe-legendary-filter');
  await page.getByRole('radio', { name: /^Manto da Promessa,/ }).click();
  await page.getByText(/Prévia: Manto da Promessa/).waitFor();
  assert.ok(await page.getByRole('button', { name: 'Salvar' }).isDisabled());
  step('raridades: filtro por Lendário e prévia bloqueada com objetivo');

  // cenário isolado de teste: marco curado cadastrado só aqui concede a relíquia pelo servidor
  await db.query(`insert into reward_triggers (id, kind, name) values ('holy_mana_do_deserto', 'milestone', 'Marco de teste')`);
  await db.query(`select private.record_event($1, 'MILESTONE_REACHED', 'milestone:holy_mana_do_deserto', '{"milestone":"holy_mana_do_deserto"}')`, [anaId]);
  await db.query(`delete from reward_triggers where id = 'holy_mana_do_deserto'`);
  // ler a passagem não concede item santo
  await db.query(`select private.record_event($1, 'CHAPTER_COMPLETED', 'chapter:ACT.2', '{"book":"ACT","chapter":2}')`, [anaId]);
  assert.equal((await db.query(`select count(*)::int n from user_items ui join cosmetic_items i on i.id = ui.item_id where ui.user_id = $1 and i.rarity = 'holy'`, [anaId])).rows[0].n, 1);
  await page.goto(`${APP}/avatar/sanctuary`);
  await page.getByText('Obras do Pai').waitFor();
  await page.getByText('1 de 13 itens').waitFor();
  await page.getByText('Obras do Deus Triúno').waitFor();
  await page.getByText('Biblioteca Lendária').waitFor();
  await shot(page, 'm3-02-sanctuary');
  await page.goto(`${APP}/avatar/item/holy_mana_do_deserto`);
  await page.getByText(/Relíquia do Santuário das Conquistas/).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Equipar no visual em uso' }).count(), 0);
  await shot(page, 'm3-03-relic-detail');
  // rota com o ID antigo do rascunho resolve o alias para o lendário oficial
  await page.goto(`${APP}/avatar/item/legendary-gen`);
  await page.getByText('Manto da Promessa').first().waitFor();
  await page.getByText('Conclua todos os capítulos de Gênesis').waitFor();
  await page.getByText('Sobre esta raridade', { exact: false }).waitFor();
  await shot(page, 'm3-04-legendary-detail');
  step('Santuário: relíquia de marco curado exibida e não equipável; leitura não concede santo; alias de ID antigo; lendário mostra o livro a concluir');

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
  await page.getByText('Finalização pendente').first().waitFor();
  assert.equal(await rutCount(), 0);
  const frozen = await clockText();
  await page.waitForTimeout(1200);
  assert.equal(await clockText(), frozen, 'tempo congelado após confirmar');
  // falha de conexão 2: o servidor registra, mas a resposta se perde
  await page.unroute('**/rest/v1/rpc/complete_reading_mission');
  await page.route('**/rest/v1/rpc/complete_reading_mission', async (r) => { await r.fetch(); await r.abort('connectionreset'); });
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await page.getByText('Finalização pendente').first().waitFor();
  await page.waitForTimeout(400);
  assert.equal(await rutCount(), 1, 'servidor registrou a conclusão uma vez');
  await shot(page, 'm4-03-mission-pending');
  await page.unroute('**/rest/v1/rpc/complete_reading_mission');
  await page.reload();
  await page.getByText('Finalização pendente').first().waitFor();
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await page.getByText('Missão concluída').waitFor();
  await page.getByText('Esta finalização já tinha sido registrada', { exact: false }).waitFor();
  await page.getByText('Você concluiu Rute!').waitFor();
  // Rute 1 (registrado antes, no mesmo dia) já cumpriu a meta de hoje
  await page.getByText('A meta de hoje já foi cumprida', { exact: false }).waitFor();
  await page.getByText('Manto do Resgate').waitFor();
  const dup = (await db.query(`select (select count(*) from reading_sessions where user_id = $1 and book_code = 'RUT' and chapter = 4)::int s,
    (select count(*) from user_items where user_id = $1 and item_id = 'book_rut')::int i,
    (select count(*) from xp_ledger where user_id = $1 and source_event_id = 'chapter:RUT.4')::int x`, [anaId])).rows[0];
  assert.deepEqual(dup, { s: 1, i: 1, x: 1 });
  await shot(page, 'm4-04-mission-completed-legendary');
  step('queda de conexão (antes e depois do servidor): sessão pendente preservada, nova tentativa sem duplicar; Lendário de Rute uma vez');

  await page.getByRole('button', { name: 'Equipar agora' }).click();
  await page.getByText('Equipado no visual em uso.').waitFor();
  assert.equal((await activeEq()).back, 'book_rut');
  step('recompensa: Equipar agora coloca o Lendário no visual em uso');

  // releitura
  await page.goto(`${APP}/read`);
  await page.getByRole('radio', { name: /^Rute, 4 de 4/ }).click();
  await page.getByRole('radio', { name: 'Capítulo 4, concluído' }).click();
  await page.getByRole('button', { name: 'Iniciar missão: Rute 4' }).click();
  await page.getByRole('button', { name: 'Finalizar missão' }).click();
  await page.getByRole('button', { name: 'Concluí a leitura' }).click();
  await page.getByText('Releitura registrada').waitFor();
  await page.getByText('A meta de hoje já foi cumprida', { exact: false }).waitFor();
  await page.getByText('Nenhum item novo nesta missão.').waitFor();
  assert.equal(Number((await db.query(`select count(*) from user_items where user_id = $1 and item_id = 'book_rut'`, [anaId])).rows[0].count), 1);
  await shot(page, 'm4-05-mission-reread');
  step('releitura: informada, sem item novo e sem duplicar o Lendário');

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

  // segundo usuário vê o perfil público da Ana (só dados consentidos)
  await C.page.getByLabel('Nome de exibição').fill('Bia');
  await C.page.getByLabel('Nome de usuário').fill('bia_teste');
  await C.page.getByText('Disponível').waitFor();
  await C.page.getByRole('button', { name: 'Continuar' }).click();
  await C.page.getByText('Criar personagem').waitFor();
  for (let i = 0; i < 3; i++) await C.page.getByRole('button', { name: 'Continuar' }).click();
  await C.page.getByRole('button', { name: 'Finalizar personagem' }).click();
  await C.page.getByRole('button', { name: 'Começar a jornada' }).click();
  await C.page.getByText('Paz, Bia!').waitFor();
  // jogador novo: missão especial de 1 Reis 19 desbloqueia o Manto do Profeta
  await C.page.goto(`${APP}/read`);
  await C.page.getByRole('button', { name: /Missão especial: o chamado de Eliseu/ }).click();
  await C.page.getByRole('button', { name: 'Iniciar missão: 1 Reis 19' }).click();
  await C.page.getByRole('button', { name: 'Finalizar missão' }).click();
  await C.page.getByRole('button', { name: 'Concluí a leitura' }).click();
  await C.page.getByText('Missão especial concluída: Missão especial: o chamado de Eliseu').waitFor();
  await C.page.getByText('Manto do Profeta').waitFor();
  const biaId = (await db.query(`select id from profiles where username = 'bia_teste'`)).rows[0].id;
  assert.equal(Number((await db.query(`select count(*) from user_items where user_id = $1 and item_id = 'cloak-elijah'`, [biaId])).rows[0].count), 1);
  await shot(C.page, 'm4-06-mission-prophet-cloak-dark');
  step('jogador novo: missão especial de 1 Reis 19 desbloqueia o Manto do Profeta');

  // ============================================================ META DIÁRIA
  await C.page.getByText('Meta diária cumprida! +40 Siclos').waitFor();
  await C.page.getByText('confirmado no dia (America/Sao_Paulo)', { exact: false }).waitFor();
  await C.page.getByText('Saldo: 40 Siclos').first().waitFor();
  assert.equal(await C.page.getByRole('radio').count(), 3, 'três Comuns oferecidos');
  await shot(C.page, 'm5-01-goal-achieved-dark');
  const goalRow = async () => (await db.query(`select options, chosen_item from daily_goals where user_id = $1`, [biaId])).rows;
  assert.equal((await goalRow()).length, 1);
  assert.equal(Number((await db.query(`select coalesce(sum(amount),0) s from siclos_ledger where user_id = $1`, [biaId])).rows[0].s), 40);
  step('meta diária: primeiro capítulo inédito do dia credita 40 Siclos e mostra 3 Comuns antes da confirmação');

  // reabrir o app sem escolher: a escolha continua disponível (Início → aviso → tela de escolha)
  await C.page.reload();
  await C.page.goto(`${APP}/home`);
  await C.page.getByText('Recompensa da meta diária esperando sua escolha').waitFor();
  await C.page.getByText('Recompensa diária: cumprida hoje', { exact: false }).waitFor();
  await shot(C.page, 'm5-02-goal-pending-home-dark');
  await C.page.getByRole('button', { name: 'Escolher recompensa' }).click();
  await C.page.getByText('Escolha um item Comum').first().waitFor();
  const firstOption = C.page.getByRole('radio').first();
  const chosenName = (await firstOption.getAttribute('aria-label')).split(',')[0];
  await firstOption.click();
  // queda de conexão depois de o servidor registrar a escolha
  await C.page.route('**/rest/v1/rpc/claim_daily_goal_item', async (r) => { await r.fetch(); await r.abort('connectionreset'); });
  await C.page.getByRole('button', { name: `Receber ${chosenName}` }).click();
  await C.page.getByRole('button', { name: 'Confirmar' }).click();
  await C.page.getByText('Sem conexão com o servidor', { exact: false }).waitFor();
  assert.ok((await goalRow())[0].chosen_item, 'servidor registrou a escolha');
  await C.page.unroute('**/rest/v1/rpc/claim_daily_goal_item');
  await C.page.getByRole('button', { name: `Receber ${chosenName}` }).click();
  await C.page.getByRole('button', { name: 'Confirmar' }).click();
  await C.page.getByText(`${chosenName} foi adicionado ao seu inventário.`).waitFor();
  const goalNow = (await goalRow())[0];
  const owned = Number((await db.query(`select count(*) from user_items where user_id = $1 and item_id = any($2::text[])`, [biaId, goalNow.options])).rows[0].count);
  assert.equal(owned, 1, 'um único item da meta');
  await shot(C.page, 'm5-03-goal-claimed-dark');
  await C.page.goto(`${APP}/home`);
  await C.page.getByText('Recompensa diária: cumprida hoje', { exact: false }).waitFor();
  assert.equal(await C.page.getByText('Recompensa da meta diária esperando sua escolha').count(), 0);
  step('escolha pendente volta ao reabrir o app; queda de conexão após o servidor registrar: nova confirmação sem novo item');
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
