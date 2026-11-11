// Gera a migração SQL do catálogo a partir de src/features/avatar/catalog/catalog.v1.json.
// Fonte única de verdade: o app e o banco usam os mesmos IDs.
// Uso: node scripts/generate-catalog-sql.mjs [--check]
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(root, 'src/features/avatar/catalog/catalog.v1.json');
const outPath = join(root, 'supabase/migrations/20261111000200_avatar_catalog_v1.sql');

export function buildCatalogSql(catalog) {
  const q = (v) => (v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
  const lines = [];
  lines.push('-- ARQUIVO GERADO por scripts/generate-catalog-sql.mjs — não edite à mão.');
  lines.push(`-- Catálogo de avatar v${catalog.version}: opções de aparência e itens iniciais gratuitos.`);
  lines.push('');
  lines.push('insert into public.avatar_appearance_options (id, category, name, sort_order, catalog_version) values');
  const opts = [];
  for (const [category, options] of Object.entries(catalog.appearance)) {
    options.forEach((o, i) => opts.push(`  (${q(o.id)}, ${q(category)}, ${q(o.name)}, ${i}, ${catalog.version})`));
  }
  lines.push(opts.join(',\n'));
  lines.push('on conflict (id) do update set');
  lines.push('  category = excluded.category, name = excluded.name,');
  lines.push('  sort_order = excluded.sort_order, catalog_version = excluded.catalog_version, is_active = true;');
  lines.push('');
  lines.push('insert into public.cosmetic_items (id, name, category, slot, rarity, description, scripture_ref, asset_manifest_key, is_starter, is_premium_cosmetic, catalog_version) values');
  lines.push(
    catalog.items
      .map((it) =>
        `  (${q(it.id)}, ${q(it.name)}, ${q(it.category)}, ${q(it.slot)}, ${q(it.rarity ?? 'common')}, ${q(it.description)}, ${q(it.scriptureRef)}, ${q(`${it.slot}/${it.id}`)}, ${it.starter === false ? 'false' : 'true'}, ${it.premium ? 'true' : 'false'}, ${catalog.version})`,
      )
      .join(',\n'),
  );
  lines.push('on conflict (id) do update set');
  lines.push('  name = excluded.name, category = excluded.category, slot = excluded.slot,');
  lines.push('  rarity = excluded.rarity, description = excluded.description, scripture_ref = excluded.scripture_ref,');
  lines.push('  asset_manifest_key = excluded.asset_manifest_key, is_starter = excluded.is_starter,');
  lines.push('  is_premium_cosmetic = excluded.is_premium_cosmetic, catalog_version = excluded.catalog_version;');
  lines.push('');
  lines.push('-- Regras de desbloqueio: itens iniciais são gratuitos e concedidos pelo servidor.');
  lines.push("insert into public.item_unlock_rules (item_id, rule_type, rule_payload, revision)");
  lines.push(`select i.id, 'starter', jsonb_build_object('catalogVersion', ${catalog.version}), 1`);
  lines.push('from public.cosmetic_items i');
  lines.push('where i.is_starter and not i.is_premium_cosmetic');
  lines.push("on conflict (item_id) where rule_type = 'starter' do nothing;");
  lines.push('');
  return lines.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const sql = buildCatalogSql(catalog);
  if (process.argv.includes('--check')) {
    const current = readFileSync(outPath, 'utf8');
    if (current !== sql) {
      console.error('Migração do catálogo desatualizada. Rode: npm run catalog:sql');
      process.exit(1);
    }
    console.log('Migração do catálogo em dia.');
  } else {
    writeFileSync(outPath, sql);
    console.log(`Gerado: ${outPath}`);
  }
}
