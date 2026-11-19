// Painel de produção das skins: o que está no app, pintado, com regra de leitura ou na loja,
// lote a lote (docs/skins/plano-lotes.json). Uso: node scripts/skin-status.mjs  → docs/skins/STATUS.md
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const season = JSON.parse(readFileSync('src/features/skins/season1.json', 'utf8'));
const plan = JSON.parse(readFileSync('docs/skins/plano-lotes.json', 'utf8'));
const migrations = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).map((f) => readFileSync(join('supabase/migrations', f), 'utf8')).join('\n');
const principais = JSON.parse(readFileSync('src/features/skins/principais.json', 'utf8'));
const inApp = new Map([...season.skins, ...principais.skins].map((s) => [s.id, s]));
const planned = new Map(plan.skins.map((s) => [s.id, s]));
const painted = (id, variant) => [1, 2, 3].every((n) => existsSync(join('assets/skins', id, variant === 'feminino' ? 'feminino' : '', `estilo-${n}`, 'corpo.webp')));
const ruleLabel = (id) => migrations.match(new RegExp(`\\('${id}',\\s*'\\{[^']*\\}',\\s*'([^']+)'`))?.[1];
const hasRule = (id) => !!ruleLabel(id);
const RAR = { common: 'Comum', rare: 'Rara', epic: 'Épica', legendary: 'Lendária', glorious: 'Gloriosa' };

const rows = [];
let done = 0, total = 0;
const lines = ['# Status da produção de skins', '', `Gerado por \`node scripts/skin-status.mjs\` em ${new Date().toISOString().slice(0, 10)}. Fonte do plano: \`docs/skins/plano-lotes.json\`.`, '',
  'Legenda: ✅ pronta no app (catálogo, pintura e forma de conquista) · 🎨 pintada, falta entrar no app · 🟡 no app sem pintura (traje provisório) · ⬜ a produzir.', ''];
const status = (id) => {
  const app = inApp.get(id); const p = painted(id, 'padrao');
  const how = app ? (app.inShop ? 'loja' : app.origin === 'inicio' ? 'inicial' : hasRule(id) ? 'leitura' : app.origin) : null;
  const ok = app && p && (how === 'loja' || how === 'inicial' || how === 'leitura');
  return { app, p, f: painted(id, 'feminino'), how, icon: ok ? '✅' : p && !app ? '🎨' : app && !p ? '🟡' : app ? '🟡' : '⬜' };
};
// Temporada 1 já no catálogo, mais os lotes do plano
const t1 = season.skins.map((s) => s.id);
const lots = [{ id: 'T1-A/B', titulo: 'Temporada 1 · já aplicados', skins: t1.filter((id) => !plan.lotes.some((l) => l.skins.includes(id))) }, ...plan.lotes];
const hasFace = (id) => { try { return !!JSON.parse(readFileSync(join('assets/skins', id, 'ficha.json'), 'utf8')).identidadeFacial; } catch { return false; } };
for (const lot of lots) {
  if (lot.tipo === 'revisao-rosto') {
    const okFace = lot.skins.filter(hasFace).length;
    lines.push(`## ${lot.id} · ${lot.titulo} (${okFace}/${lot.skins.length} revisadas)`, '', 'Skins já no app; a revisão troca só o rosto (identidadeFacial), com os mesmos IDs, estilos, sexo e regras.', '', '| | Skin | Rosto próprio |', '|---|---|---|');
    for (const id of lot.skins) lines.push(`| ${hasFace(id) ? '✅' : '⬜'} | ${(inApp.get(id) ?? planned.get(id) ?? {}).name ?? id} (\`${id}\`) | ${hasFace(id) ? '✔' : 'a refazer no final'} |`);
    lines.push('');
    continue;
  }
  const st = lot.skins.map((id) => ({ id, ...status(id) }));
  const ok = st.filter((s) => s.icon === '✅').length;
  done += ok; total += st.length;
  lines.push(`## ${lot.id} · ${lot.titulo} (${ok}/${st.length})`, '', '| | Skin | Raridade | Mundo | Pintura | Feminina | Como se conquista |', '|---|---|---|---|---|---|---|');
  for (const s of st) {
    const meta = s.app ?? planned.get(s.id) ?? {};
    const how = s.how === 'leitura' ? `lendo: ${ruleLabel(s.id)}` : s.how ?? (planned.get(s.id)?.inShop ? 'loja (Siclos)' : planned.get(s.id)?.howTo) ?? '—';
    lines.push(`| ${s.icon} | ${meta.name ?? s.id} (\`${s.id}\`) | ${RAR[meta.rarity] ?? '—'} | ${meta.world ?? 'origens'} | ${s.p ? '✔' : '—'} | ${s.f ? '✔' : '—'} | ${how} |`);
  }
  lines.push('');
}
lines.splice(4, 0, `**Progresso:** ${done} de ${total} skins prontas no app.`, '');
writeFileSync('docs/skins/STATUS.md', lines.join('\n'));
console.log(`${done}/${total} skins prontas → docs/skins/STATUS.md`);

// Briefing de produção por lote (para o Codex): só os lotes com skins ainda sem pintura.
const brief = ['# Briefing dos lotes de skins', '', `Gerado por \`node scripts/skin-status.mjs\`. Cada skin: 3 estilos (tom de pele, cor e penteado do cabelo abaixo), no 2.5D pintado dos lotes já aprovados, com o contrato de \`TEMPORADA-1-EXODO.md\` §2.`, ''];
for (const lot of plan.lotes) {
  if (lot.tipo === 'revisao-rosto') {
    const todo = lot.skins.filter((id) => !hasFace(id));
    if (!todo.length) continue;
    brief.push(`## ${lot.id} · ${lot.titulo}`, '', 'Fazer **depois de todos os lotes novos**. Repintar as 3 pinturas de cada skin com **rosto próprio** (formato, nariz, olhos, maxilar, idade aparente e expressão únicos), registrado em `identidadeFacial` na ficha. Manter IDs, estilos (tons e penteados), sexo do personagem, traje, objetos, âncoras e caminhos.', '');
    for (const id of todo) brief.push(`- ${(inApp.get(id) ?? planned.get(id) ?? {}).name ?? id} (\`${id}\`)`);
    brief.push('');
    continue;
  }
  const pending = lot.skins.filter((id) => !painted(id, 'padrao'));
  if (!pending.length) continue;
  brief.push(`## ${lot.id} · ${lot.titulo}`, '');
  for (const id of pending) {
    const p = planned.get(id); const app = inApp.get(id);
    const name = p?.name ?? app?.name ?? id; const ref = p?.scriptureRef ?? app?.scriptureRef ?? '';
    const sty = (p?.styles ?? app?.styles ?? []).map((st, i) => `estilo-${i + 1}: ${st.skinTone}, ${st.hairColor}, ${st.hairStyle}`).join(' · ');
    const face = ['legendary', 'glorious'].includes(p?.rarity ?? app?.rarity) ? ' **Rosto próprio**, diferente das demais skins (formato, nariz, olhos, maxilar, idade aparente e expressão), preservado nos 3 estilos e registrado em `identidadeFacial` na ficha.' : '';
    const extra = (face) + (p?.pair ? ` Casal: apresentação padrão masculina (Áquila) e feminina (${p.pair}), com o nome de cada um no \`nomeExibicao\`.` : p?.inShop ? ' Vai para a loja (Siclos).' : '');
    brief.push(`- **${name}** (\`${id}\`), ${RAR[p?.rarity ?? app?.rarity] ?? ''}, ${ref}.${extra} ${p?.idea ? `Traje: ${p.idea}.` : 'Traje: ver a tabela de `TEMPORADA-1-EXODO.md`.'} Apresentação ${p?.presentation ?? (/(miria|zipora)/.test(id) ? 'feminina' : 'masculina')}${p?.pair ? '' : (p?.character || app?.character || ['legendary', 'glorious'].includes(p?.rarity ?? app?.rarity)) ? ' (personagem bíblico: só esta apresentação, sem a do outro sexo)' : ' (figura genérica: feminina adicional quando o traje permitir)'}.`, `  ${sty}`);
  }
  brief.push('');
}
writeFileSync('docs/skins/LOTES.md', brief.join('\n'));
console.log('briefing → docs/skins/LOTES.md');
