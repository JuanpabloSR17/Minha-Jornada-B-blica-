// Coloca no app as skins de um lote do plano (docs/skins/plano-lotes.json) depois que a pintura
// foi aprovada: acrescenta ao catálogo (src/features/skins/principais.json) e gera a migração
// aditiva com as skins e as regras de leitura. Uso: node scripts/skins-add-lot.mjs P01 [AAAAMMDD]
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [lotId, day = new Date().toISOString().slice(0, 10).replace(/-/g, '')] = process.argv.slice(2);
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
  // personagens principais (Lendárias e Gloriosas): só a apresentação do sexo do personagem
  const fem = !['legendary', 'glorious'].includes(s.rarity) && [1, 2, 3].every((n) => existsSync(join('assets/skins', id, 'feminino', `estilo-${n}`, 'corpo.webp')));
  add.push({ ...s, fem });
}
if (!add.length) { console.log('nada a acrescentar'); process.exit(0); }
const order = 100 + cat.skins.length;
cat.skins.push(...add.map((s) => ({ id: s.id, name: s.name, rarity: s.rarity, world: s.world, scriptureRef: s.scriptureRef, origin: 'leitura', inShop: false, styles: s.styles, preview: {} })));
writeFileSync(catPath, JSON.stringify(cat, null, 1) + '\n');
const file = `supabase/migrations/${day}000100_skins_${lotId.toLowerCase()}.sql`;
writeFileSync(file, `-- Lote ${lot.id} (${lot.titulo}): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants) values
${add.map((s, i) => `  (${q(s.id)}, ${q(s.name)}, ${q(s.rarity)}, 'leitura', ${q(s.scriptureRef)}, 'principais', false, ${order + i}, ${s.fem ? "'{padrao,feminino}'" : "'{padrao}'"})`).join(',\n')};

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
${add.map((s, i) => `  (${q(s.id)}, ${q(JSON.stringify(s.rule))}, ${q(s.howTo)}, ${order + i})`).join(',\n')};

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
