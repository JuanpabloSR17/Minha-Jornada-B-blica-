// Coloca no app as skins de um lote do plano (personagens com regra de leitura; ofícios e trajes de corte na loja) (docs/skins/plano-lotes.json) depois que a pintura
// foi aprovada: acrescenta ao catálogo (src/features/skins/principais.json) e gera a migração
// aditiva com as skins e as regras de leitura. Uso: node scripts/skins-add-lot.mjs P01 [AAAAMMDD]
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [lotId, dayArg] = process.argv.slice(2);
// a migração precisa vir depois de todas as existentes (a tabela de skins é criada em 20261124)
const lastDay = readdirSync('supabase/migrations').filter((f) => /^\d{14}_/.test(f)).map((f) => f.slice(0, 8)).sort().at(-1) ?? '00000000';
const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const day = [dayArg ?? today, lastDay].sort().at(-1);
const plan = JSON.parse(readFileSync('docs/skins/plano-lotes.json', 'utf8'));
const lot = plan.lotes.find((l) => l.id === lotId);
if (!lot) throw new Error(`lote ${lotId} não está no plano`);
const catPath = 'src/features/skins/principais.json';
const cat = JSON.parse(readFileSync(catPath, 'utf8'));
const season = JSON.parse(readFileSync('src/features/skins/season1.json', 'utf8'));
const known = new Set([...season.skins, ...cat.skins].map((s) => s.id));
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const add = [];
for (const id of lot.skins) {
  const s = plan.skins.find((x) => x.id === id);
  if (!s || known.has(id)) continue;
  const painted = [1, 2, 3].every((n) => existsSync(join('assets/skins', id, `estilo-${n}`, 'corpo.webp')));
  if (!painted) { console.warn(`pulando ${id}: pintura ainda não aplicada`); continue; }
  // personagens bíblicos (sexo definido na Bíblia): só a apresentação do sexo do personagem
  const fem = !s.character && !['legendary', 'glorious'].includes(s.rarity) && [1, 2, 3].every((n) => existsSync(join('assets/skins', id, 'feminino', `estilo-${n}`, 'corpo.webp')));
  add.push({ ...s, fem });
}
if (!add.length) { console.log('nada a acrescentar'); process.exit(0); }
const order = 100 + cat.skins.length;
cat.skins.push(...add.map((s) => ({ id: s.id, name: s.name, rarity: s.rarity, world: s.world, scriptureRef: s.scriptureRef, origin: s.inShop ? 'loja' : 'leitura', inShop: !!s.inShop, ...(s.character ? { character: s.character } : {}), styles: s.styles, preview: {} })));
writeFileSync(catPath, JSON.stringify(cat, null, 1) + '\n');
// versão única: o dia + sequência (000100, 000200…) depois das migrações que já existem nesse dia
const taken = readdirSync('supabase/migrations').filter((f) => f.startsWith(day)).map((f) => Number(f.slice(8, 14)));
const seq = String((Math.max(0, ...taken) + 100)).padStart(6, '0');
const file = `supabase/migrations/${day}${seq}_skins_${lotId.toLowerCase()}.sql`;
writeFileSync(file, `-- Lote ${lot.id} (${lot.titulo}): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
${add.map((s, i) => `  (${q(s.id)}, ${q(s.name)}, ${q(s.rarity)}, ${s.inShop ? "'loja'" : "'leitura'"}, ${q(s.scriptureRef)}, 'enciclopedia', ${s.inShop ? 'true' : 'false'}, ${order + i}, ${s.fem ? "'{padrao,feminino}'" : "'{padrao}'"}, ${s.character ? q(s.character) : 'null'})`).join(',\n')};

${add.some((s) => s.rule) ? `insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
${add.filter((s) => s.rule).map((s, i) => `  (${q(s.id)}, ${q(JSON.stringify(s.rule))}, ${q(s.howTo)}, ${order + i})`).join(',\n')};
` : '-- (lote só de loja: sem regras de leitura)\n'}
-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
`);
writeFileSync(file.replace('migrations', 'rollbacks').replace('.sql', '.down.sql'), `-- Reversão manual do lote ${lot.id}: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in (${add.map((s) => q(s.id)).join(', ')});
update public.skins set is_active = false where id in (${add.map((s) => q(s.id)).join(', ')});
`);
console.log(`${add.length} skins do ${lot.id} → ${catPath} e ${file}`);
