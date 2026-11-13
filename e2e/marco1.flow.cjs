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
  await page.getByText('Meta pessoal: 6 capítulos por dia').waitFor();
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
  await page.getByText('2 de 3 itens obtidos').waitFor();
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
  // evento de marco registrado pelo servidor (o marco do Maná existe no catálogo v8)
  await db.query(`select private.record_event($1, 'MILESTONE_REACHED', 'milestone:holy_mana_do_deserto', '{"milestone":"holy_mana_do_deserto"}')`, [anaId]);
  // ler a passagem não concede item santo
  await db.query(`select private.record_event($1, 'CHAPTER_COMPLETED', 'chapter:ACT.2', '{"book":"ACT","chapter":2}')`, [anaId]);
  assert.equal((await db.query(`select count(*)::int n from user_items ui join cosmetic_items i on i.id = ui.item_id where ui.user_id = $1 and i.rarity = 'holy'`, [anaId])).rows[0].n, 1);
  await page.goto(`${APP}/avatar/sanctuary`);
  await page.getByText('Obras do Pai').waitFor();
  await page.getByText('1 de 13 Santos obtidos').waitFor();
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
  // meta pessoal 6: Rute 1–4 são 4 inéditos hoje, faltam 2
  await page.getByText('Hoje: 4 de 6 capítulos inéditos · faltam 2', { exact: false }).waitFor();
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
  await page.getByText('Hoje: 4 de 6 capítulos inéditos · faltam 2', { exact: false }).waitFor();
  await page.getByText('Releituras não contam para a meta diária.').waitFor();
  await page.getByText('Nenhum item novo nesta missão.').waitFor();
  assert.equal(Number((await db.query(`select count(*) from user_items where user_id = $1 and item_id = 'book_rut'`, [anaId])).rows[0].count), 1);
  await shot(page, 'm4-05-mission-reread');
  step('releitura: informada, sem item novo e sem duplicar o Lendário');

  // ============================================================ META DIÁRIA v2 (meta pessoal 6)
  await page.goto(`${APP}/home`);
  await page.getByText('Meta pessoal: 6 capítulos por dia').waitFor();
  await page.getByText('Hoje: 4 de 6 capítulos').waitFor();
  await page.getByText('Faltam 2 para a recompensa').waitFor();
  await page.getByText('Recompensa: 40 Siclos · 20 XP de bônus · 1 Comum à escolha').waitFor();
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
  await page.getByTestId('goal-celebration').waitFor();
  await page.getByText('Meta diária cumprida! +40 Siclos · +20 XP').waitFor();
  await page.getByText('Escolha um item Comum').first().waitFor();
  await page.waitForTimeout(900);
  await shot(page, 'm6-02-goal-celebration');
  const anaGoal = (await db.query(`select target, rule_version, xp_bonus from daily_goals where user_id = $1`, [anaId])).rows;
  assert.deepEqual(anaGoal, [{ target: 6, rule_version: 2, xp_bonus: 20 }]);
  step('6.º capítulo inédito cumpre a meta 6: animação, 40 Siclos, 20 XP de bônus e escolha de item');

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
  await C.page.getByText('Missão especial: o chamado de Eliseu — concluída').waitFor();
  await C.page.getByText('Manto do Profeta').waitFor();
  const biaId = (await db.query(`select id from profiles where username = 'bia_teste'`)).rows[0].id;
  assert.equal(Number((await db.query(`select count(*) from user_items where user_id = $1 and item_id = 'cloak-elijah'`, [biaId])).rows[0].count), 1);
  await shot(C.page, 'm4-06-mission-prophet-cloak-dark');
  step('jogador novo: missão especial de 1 Reis 19 desbloqueia o Manto do Profeta');

  // ============================================================ META DIÁRIA
  await C.page.getByText('Meta diária cumprida! +40 Siclos').waitFor();
  await C.page.getByText('fuso de leitura: America/Sao_Paulo', { exact: false }).waitFor();
  await C.page.getByTestId('goal-celebration').waitFor();
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
  await C.page.getByText('Meta cumprida hoje!').waitFor();
  await shot(C.page, 'm5-02-goal-pending-home-dark');
  // continuidade em outro aparelho: mesma conta vê a meta cumprida e a escolha pendente
  const D = await newPhone(browser);
  await D.page.goto(APP);
  await D.page.getByRole('button', { name: 'Entrar' }).click();
  await D.page.getByLabel('E-mail').fill(biaEmail);
  await D.page.getByLabel('Senha', { exact: true }).fill(password);
  await D.page.getByRole('button', { name: 'Entrar' }).last().click();
  await D.page.getByText('Paz, Bia!').waitFor();
  await D.page.getByText('Meta cumprida hoje!').waitFor();
  await D.page.getByText('Recompensa da meta diária esperando sua escolha').waitFor();
  await shot(D.page, 'm6-03-other-device-pending');
  await D.ctx.close();
  step('outro aparelho: a meta cumprida e a escolha pendente aparecem na mesma conta');
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
  await C.page.getByText('Meta cumprida hoje!').waitFor();
  assert.equal(await C.page.getByText('Recompensa da meta diária esperando sua escolha').count(), 0);
  step('escolha pendente volta ao reabrir o app; queda de conexão após o servidor registrar: nova confirmação sem novo item');

  // ============================================================ MISSÕES ESPECIAIS DOS RAROS
  // Bia já tem o Peitoral (obtido antes): Êxodo 28 entrega só a Estola e o Turbante
  await db.query(`insert into user_items (user_id, item_id, source_event_id) values ($1, 'rare_peitoral_das_doze_pedras', 'test:obtido-antes')`, [biaId]);
  await C.page.goto(`${APP}/read`);
  await C.page.getByRole('button', { name: /Missão especial: as vestes do sumo sacerdote/ }).click();
  await C.page.getByRole('button', { name: 'Iniciar missão: Êxodo 28' }).click();
  await C.page.getByRole('button', { name: 'Finalizar missão' }).click();
  await C.page.getByRole('button', { name: 'Concluí a leitura' }).click();
  await C.page.getByText('Missão especial: as vestes do sumo sacerdote — concluída').waitFor();
  await C.page.getByText('Estola Sacerdotal', { exact: true }).waitFor();
  await C.page.getByText('Turbante do Sacerdote', { exact: true }).waitFor();
  assert.equal(await C.page.getByText('Peitoral das Doze Pedras', { exact: true }).count(), 0, 'o Peitoral já obtido não é mostrado como concedido');
  assert.equal(await C.page.getByRole('button', { name: 'Equipar agora' }).count(), 2);
  const ex28 = (await db.query(`select item_id from user_items where user_id = $1 and item_id like 'rare_%' order by item_id`, [biaId])).rows.map((r) => r.item_id);
  assert.deepEqual(ex28, ['rare_estola_sacerdotal', 'rare_peitoral_das_doze_pedras', 'rare_turbante_do_sacerdote']);
  await shot(C.page, 'm8-01-mission-exodus28-dark');
  step('missão de Êxodo 28: a tela mostra só os Raros concedidos (Estola e Turbante), sem repetir o Peitoral já obtido');

  await C.page.goto(`${APP}/read`);
  await C.page.getByRole('button', { name: /Missão especial: uma noiva para Isaque/ }).click();
  await C.page.getByRole('button', { name: 'Iniciar missão: Gênesis 24' }).click();
  await C.page.getByRole('button', { name: 'Finalizar missão' }).click();
  await C.page.getByRole('button', { name: 'Concluí a leitura' }).click();
  await C.page.getByText('Missão especial: uma noiva para Isaque — concluída').waitFor();
  await C.page.getByText('Bracelete da Corte', { exact: true }).waitFor();
  await C.page.getByText('Jarro de Rebeca', { exact: true }).waitFor();
  await C.page.getByText('Raro', { exact: true }).first().waitFor();
  await C.page.getByText('Épico', { exact: true }).first().waitFor();
  await shot(C.page, 'm8-02-mission-genesis24-dark');
  step('Gênesis 24: a mesma leitura mostra o Raro (Bracelete da Corte) e o Épico (Jarro de Rebeca)');

  await C.page.goto(`${APP}/avatar/item/rare_rolo_do_escriba`);
  await C.page.getByText('Rolo do Escriba (Raro)').first().waitFor();
  await C.page.getByText('Conclua a missão especial de Esdras 7 no Modo Missão').waitFor();
  await C.page.goto(`${APP}/avatar/item/book_ezr`);
  await C.page.getByText('Rolo do Escriba (Lendário)').first().waitFor();
  await C.page.goto(`${APP}/avatar/item/rare_sandalias_do_peregrino`);
  await C.page.getByText('Inspirado em (associação metafórica)').waitFor();
  step('nomes repetidos com a raridade (Rolo do Escriba Raro × Lendário) e associação metafórica das Sandálias do Peregrino');
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
  await C.page.getByText('Santos obtidos: 0 de 22').waitFor();
  await C.page.getByRole('button', { name: 'Ver todos os marcos' }).waitFor();
  assert.equal(await C.page.getByText('Marco: Luz da Criação', { exact: true }).count(), 0, 'a aba Ler não lista os 20 marcos');
  await noOverflow('aba Ler');
  await shot(C.page, 'm10-01-read-summary-320');
  await C.page.getByRole('radio', { name: /^Êxodo,/ }).click();
  await C.page.getByRole('radio', { name: 'Capítulo 16', exact: true }).click();
  await C.page.getByRole('button', { name: 'Iniciar missão: Êxodo 16' }).click();
  await finishHere();
  await C.page.getByText('Nenhum item novo nesta missão.').waitFor();
  // piloto: a leitura comum explica que o capítulo tem um marco e como cumpri-lo
  await C.page.getByTestId('ordinary-milestone-hint').filter({ visible: true }).getByText('Este capítulo também tem o “Marco: Maná do Deserto”.').waitFor();
  await shot(C.page, 'p1-ordinary-reading-milestone-hint');
  assert.equal(Number((await db.query(`select count(*) from user_items where user_id = $1 and item_id = 'holy_mana_do_deserto'`, [biaId])).rows[0].count), 0);
  step('tela estreita: aba Ler com resumo dos marcos; leitura comum de Êxodo 16 sem o Santo');

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
  await C.page.getByText('Passagem').waitFor();
  assert.equal(await C.page.getByTestId('marco-item-state-holy_mana_do_deserto').innerText(), 'Será concedido ao cumprir o marco');
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
  await C.page.getByText('Marco: Maná do Deserto — concluído').waitFor();
  await C.page.getByText('Maná do Deserto', { exact: true }).last().waitFor();
  step('lista com filtros; marco aberto com passagem e item; após reabrir o app, a aba Ler destaca a sessão vinculada e leva de volta a ela');

  // Êxodo 25 com posse parcial (Mesa já obtida) e finalização aguardando confirmação
  await db.query(`insert into user_items (user_id, item_id, source_event_id) values ($1, 'holy_mesa_dos_paes_da_presenca', 'test:obtido-antes')`, [biaId]);
  await C.page.goto(`${APP}/reading/milestones`);
  await C.page.getByRole('link', { name: /^Marco: a mobília do Tabernáculo, Êxodo 25, A cumprir, Santos deste marco que você possui: 1 de 3/ }).click();
  assert.equal(await C.page.getByTestId('marco-item-state-holy_mesa_dos_paes_da_presenca').innerText(), 'Você já possui');
  assert.equal(await C.page.getByTestId('marco-item-state-holy_arca_da_alianca_representacao').innerText(), 'Será concedido ao cumprir o marco');
  assert.equal(await C.page.getByTestId('marco-item-state-holy_candelabro_do_tabernaculo').innerText(), 'Será concedido ao cumprir o marco');
  await noOverflow('detalhe do marco');
  await shot(C.page, 'm10-04-milestone-exodus25-partial-320');
  await C.page.getByRole('button', { name: 'Iniciar marco: Êxodo 25' }).click();
  await C.page.route('**/rest/v1/rpc/complete_reading_mission', (r) => r.abort('internetdisconnected'));
  await finishHere();
  await C.page.getByText('Finalização pendente').first().waitFor();
  await C.page.unroute('**/rest/v1/rpc/complete_reading_mission');
  await C.page.reload();
  await C.page.goto(`${APP}/read`);
  await C.page.getByText('Aguardando confirmação do servidor').waitFor();
  await shot(C.page, 'm10-05-read-pending-320');
  await C.page.getByRole('button', { name: 'Verificar resultado' }).click();
  await C.page.getByRole('button', { name: 'Tentar novamente' }).click();
  await C.page.getByText('Marco: a mobília do Tabernáculo — concluído').waitFor();
  for (const n of ['Arca da Aliança (Representação)', 'Candelabro do Tabernáculo']) await C.page.getByText(n, { exact: true }).last().waitFor();
  assert.equal(await C.page.getByRole('button', { name: 'Equipar agora' }).count(), 0, 'relíquias não são equipáveis');
  const ex25 = (await db.query(`select item_id, count(*)::int n from user_items where user_id = $1 and item_id like 'holy_%' group by item_id order by item_id`, [biaId])).rows;
  assert.deepEqual(ex25.map((r) => [r.item_id, r.n]), [['holy_arca_da_alianca_representacao', 1], ['holy_candelabro_do_tabernaculo', 1], ['holy_mana_do_deserto', 1], ['holy_mesa_dos_paes_da_presenca', 1]]);
  step('Êxodo 25 com a Mesa já obtida: tela indica o que ainda pode ser concedido; finalização pendente destacada na aba Ler; concede só Arca e Candelabro');

  // marco concluído e contadores
  await C.page.goto(`${APP}/reading/milestones`);
  await C.page.getByRole('radio', { name: 'Concluídos (2)' }).click();
  await C.page.getByRole('link', { name: /^Marco: Maná do Deserto, Êxodo 16, Cumprido/ }).click();
  await C.page.getByText('Marco já cumprido', { exact: false }).waitFor();
  assert.equal(await C.page.getByRole('button', { name: /^Iniciar marco/ }).count(), 0);
  await C.page.goto(`${APP}/avatar/sanctuary`);
  await C.page.getByText('Marcos cumpridos: 2 de 20').waitFor();
  await C.page.getByText('Santos obtidos: 4 de 22').waitFor();
  assert.equal(await C.page.getByTestId('collection-owned-works-father').innerText(), '4 de 13 Santos obtidos');
  await C.page.getByTestId('library-owned').waitFor();
  await noOverflow('Santuário');
  await shot(C.page, 'm10-06-sanctuary-320');
  step('marco concluído sem novo início; Santuário separa marcos cumpridos (2 de 20), Santos obtidos (4 de 22) e coleção (4 de 13 Santos obtidos)');
  await C.page.setViewportSize({ width: 390, height: 844 });
  await C.page.goto(`${APP}/home`);

  // ============================================================ MERCADO DOS VIAJANTES
  const biaBalance = async () => Number((await db.query(`select coalesce(sum(amount),0) s from siclos_ledger where user_id = $1`, [biaId])).rows[0].s);
  await C.page.getByRole('button', { name: 'Mercado dos Viajantes' }).click();
  await C.page.getByText('Saldo: 40 Siclos').first().waitFor();
  // um item de 80 que a conta ainda não tem (a escolha gratuita varia com o ID da conta)
  const cheap = (await db.query(`select i.id from cosmetic_items i where i.shop_eligible and i.is_active and i.shop_price_suggested = 80
    and not private.owns_canonical($1, i.id) order by i.id limit 1`, [biaId])).rows[0].id;
  await C.page.getByTestId(`market-${cheap}`).getByText('Faltam 40 Siclos').waitFor();
  await shot(C.page, 'm7-01-market-low-balance-dark');
  // metas dos dias seguintes pelo mesmo caminho do servidor (relógio simulado): +40 Siclos por dia
  for (let k = 1; k <= 5; k++) {
    await db.query(`select private.complete_reading_mission_at($1, gen_random_uuid(), 'MAT', $2, 'physical', now() + make_interval(days => $2) - interval '5 minutes', 60, now() + make_interval(days => $2))`, [biaId, k]);
  }
  assert.equal(await biaBalance(), 240);
  await C.page.reload();
  await C.page.getByText('Saldo: 240 Siclos').first().waitFor();
  step('Mercado: saldo vindo das metas diárias, preços do catálogo e quanto falta para cada item');

  // o item é obtido pela escolha gratuita (outro aparelho) com a confirmação da compra aberta
  const nextGoal = (await db.query(`select day::text as d, options from daily_goals where user_id = $1 and chosen_item is null order by day limit 1`, [biaId])).rows[0];
  const raceItem = nextGoal.options[0];
  const raceName = (await db.query(`select name from cosmetic_items where id = $1`, [raceItem])).rows[0].name;
  await C.page.getByRole('button', { name: `Comprar ${raceName}` }).click();
  await C.page.getByText('Confirmar compra').waitFor();
  await C.page.getByText(`Você vai adquirir ${raceName}`, { exact: false }).waitFor();
  await db.query('begin');
  await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [biaId]);
  await db.query(`select public.claim_daily_goal_item($1::date, $2)`, [nextGoal.d, raceItem]);
  await db.query('commit');
  await C.page.getByRole('button', { name: /^Pagar \d+ Siclos$/ }).click();
  await C.page.getByText(`Você já possui ${raceName}`, { exact: false }).waitFor();
  await C.page.getByTestId(`market-${raceItem}`).getByText('Obtido').waitFor();
  assert.equal(await biaBalance(), 240, 'nada debitado');
  assert.equal(Number((await db.query(`select count(*) from user_items where user_id = $1 and item_id = $2`, [biaId, raceItem])).rows[0].count), 1);
  await C.page.waitForTimeout(400);
  await shot(C.page, 'm7-02-market-owned-by-free-choice-dark');
  step('compra × escolha gratuita: o item resgatado antes da confirmação aparece como obtido, sem débito');

  // compra bem-sucedida até o inventário
  const buyRow = (await db.query(`select i.id, i.name, i.slot, i.shop_price_suggested price from cosmetic_items i
    where i.shop_eligible and i.is_active and not i.is_starter and i.shop_price_suggested <= 240 and i.slot in ('outfit','back','feet','waist','hands')
      and not exists (select 1 from user_items ui where ui.user_id = $1 and ui.item_id = i.id)
    order by i.shop_price_suggested, i.id limit 1`, [biaId])).rows[0];
  await C.page.getByRole('button', { name: `Comprar ${buyRow.name}` }).click();
  await C.page.getByText(`por ${buyRow.price} Siclos. Saldo: 240 → ${240 - buyRow.price} Siclos.`, { exact: false }).waitFor();
  await C.page.waitForTimeout(400);
  await shot(C.page, 'm7-03-market-confirm-dark');
  await C.page.getByRole('button', { name: `Pagar ${buyRow.price} Siclos` }).click();
  await C.page.getByText(`${buyRow.name} foi adicionado ao seu inventário`, { exact: false }).waitFor();
  assert.equal(await biaBalance(), 240 - buyRow.price);
  await C.page.getByRole('button', { name: 'Ver no inventário' }).click();
  // a tela do Mercado continua montada por baixo: conferir só o que está visível
  await C.page.getByText(buyRow.name).filter({ visible: true }).first().waitFor();
  await C.page.getByText('Obtido').filter({ visible: true }).first().waitFor();
  const cat = buyRow.slot;
  await C.page.goto(`${APP}/avatar/wardrobe?category=${cat}`);
  await C.page.getByRole('radio', { name: new RegExp(`^${buyRow.name},.*Obtido`) }).waitFor();
  await shot(C.page, 'm7-04-market-item-in-wardrobe-dark');
  step('compra confirmada: débito e item na mesma operação; o item aparece obtido no inventário');

  // perda da resposta do servidor: recuperar o resultado sem cobrar duas vezes
  const lostRow = (await db.query(`select i.id, i.name, i.shop_price_suggested price from cosmetic_items i
    where i.shop_eligible and i.is_active and not i.is_starter and i.shop_price_suggested <= $2
      and not exists (select 1 from user_items ui where ui.user_id = $1 and ui.item_id = i.id)
    order by i.shop_price_suggested, i.id limit 1`, [biaId, 240 - buyRow.price])).rows[0];
  await C.page.goto(`${APP}/market`);
  // 1) o pedido nem chega ao servidor: a compra fica pendente e sobrevive a reabrir o app
  await C.page.route('**/rest/v1/rpc/purchase_market_item', (r) => r.abort('internetdisconnected'));
  await C.page.getByRole('button', { name: `Comprar ${lostRow.name}` }).click();
  await C.page.getByRole('button', { name: `Pagar ${lostRow.price} Siclos` }).click();
  await C.page.getByText('Sem conexão com o servidor', { exact: false }).waitFor();
  await C.page.getByText('Compra aguardando confirmação').waitFor();
  assert.equal(Number((await db.query(`select count(*) from market_purchases where user_id = $1 and item_id = $2`, [biaId, lostRow.id])).rows[0].count), 0);
  await shot(C.page, 'm7-05-market-pending-dark');
  // 2) ao reabrir, a verificação automática reenvia o mesmo ID: o servidor registra, mas a resposta se perde
  await C.page.unroute('**/rest/v1/rpc/purchase_market_item');
  await C.page.route('**/rest/v1/rpc/purchase_market_item', async (r) => { await r.fetch(); await r.abort('connectionreset'); });
  await C.page.reload();
  // a vitrine já mostra o item como seu: a tela confirma a compra em vez de continuar "aguardando"
  await C.page.getByText(`Compra confirmada: ${lostRow.name} já está no seu inventário`, { exact: false }).waitFor();
  assert.equal(await C.page.getByText('Compra aguardando confirmação').count(), 0, 'não mostra pendente e obtido ao mesmo tempo');
  await C.page.getByTestId(`market-${lostRow.id}`).getByText('Obtido').waitFor();
  await C.page.unroute('**/rest/v1/rpc/purchase_market_item');
  await shot(C.page, 'p2-market-confirmed-after-lost-response-dark');
  const lost = (await db.query(`select (select count(*) from market_purchases where user_id = $1 and item_id = $2)::int p,
    (select count(*) from user_items where user_id = $1 and item_id = $2)::int i`, [biaId, lostRow.id])).rows[0];
  assert.deepEqual(lost, { p: 1, i: 1 });
  assert.equal(await biaBalance(), 240 - buyRow.price - lostRow.price, 'um único débito');
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
