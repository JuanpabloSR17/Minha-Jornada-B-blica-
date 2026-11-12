// Gera a migração SQL do catálogo a partir de src/features/avatar/catalog/catalog.json.
// Cada versão do catálogo gera um arquivo NOVO (migrações já aplicadas nunca são editadas).
// Fonte única de verdade: o app e o banco usam os mesmos IDs.
// Uso: node scripts/generate-catalog-sql.mjs [--check]
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(root, 'src/features/avatar/catalog/catalog.json');
/** Prefixo de data da migração de cada versão do catálogo. */
const VERSION_PREFIX = { 1: '20261111000200', 2: '20261112000200', 3: '20261113000200', 4: '20261114000200', 5: '20261115000200', 6: '20261116000200', 7: '20261120000200' };
export const outPathFor = (version) => {
  const prefix = VERSION_PREFIX[version];
  if (!prefix) throw new Error(`Defina o prefixo da migração para o catálogo v${version} em VERSION_PREFIX`);
  return join(root, `supabase/migrations/${prefix}_avatar_catalog_v${version}.sql`);
};

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
  const v3 = catalog.version >= 3;
  const v4 = catalog.version >= 4;
  if (v4 && catalog.rarities?.length) {
    lines.push('-- Raridades (fonte: catalog.json).');
    lines.push('insert into public.rarities (id, name, sort_order, color, description, is_active) values');
    lines.push(catalog.rarities.map((r) => `  (${q(r.id)}, ${q(r.name)}, ${r.order + 1}, ${q(r.color)}, ${q(r.description)}, true)`).join(',\n'));
    lines.push('on conflict (id) do update set name = excluded.name, sort_order = excluded.sort_order,');
    lines.push('  color = excluded.color, description = excluded.description, is_active = true;');
    lines.push('');
  }
  const arr = (a) => (a && a.length ? `array[${a.map(q).join(', ')}]::text[]` : 'null');
  const v5 = catalog.version >= 5;
  const jsonIds = catalog.items.map((it) => q(it.id)).join(', ');
  if (v5) {
    lines.push('-- Itens do rascunho que não estão no catálogo oficial: DESATIVADOS (nunca apagados; posse mantida).');
    lines.push(`update public.cosmetic_items set is_active = false, series = 'legacy-draft' where series = 'rarities-v1' and id not in (${jsonIds});`);
    lines.push('-- Libera o livro de itens que deixam de ser lendários (o lendário oficial do livro entra a seguir).');
    const nonLegendary = catalog.items.filter((it) => it.rarity !== 'legendary').map((it) => q(it.id)).join(', ');
    lines.push(`update public.cosmetic_items set book_code = null where book_code is not null and id in (${nonLegendary});`);
    lines.push('');
  }
  lines.push(`insert into public.cosmetic_items (id, name, category, slot, rarity, description, scripture_ref, asset_manifest_key, is_starter, is_premium_cosmetic, catalog_version${v3 ? ', body_compatibility, variant_label' : ''}${v4 ? ', acquisition, series, book_code' : ''}${v5 ? ', representation, meaning, referent, holy_subtype, shop_eligible, shop_price_suggested, is_active' : ''}) values`);
  lines.push(
    catalog.items
      .map((it) =>
        `  (${q(it.id)}, ${q(it.name)}, ${q(it.category)}, ${q(it.slot)}, ${q(it.rarity ?? 'common')}, ${q(it.description)}, ${q(it.scriptureRef)}, ${q(`${it.slot}/${it.id}`)}, ${it.starter === false ? 'false' : 'true'}, ${it.premium ? 'true' : 'false'}, ${catalog.version}${v3 ? `, ${arr(it.bodyCompatibility)}, ${q(it.variantLabel)}` : ''}${v4 ? `, ${q(it.acquisition ?? 'reading')}, ${q(it.series ?? 'starter')}, ${q(it.book)}` : ''}${v5 ? `, ${q(it.representation ?? 'inspired')}, ${q(it.meaning)}, ${q(it.referent)}, ${q(it.holySubtype)}, ${it.shopEligible ? 'true' : 'false'}, ${it.shopPriceSuggested ?? 'null'}, true` : ''})`,
      )
      .join(',\n'),
  );
  lines.push('on conflict (id) do update set');
  lines.push('  name = excluded.name, category = excluded.category, slot = excluded.slot,');
  lines.push('  rarity = excluded.rarity, description = excluded.description, scripture_ref = excluded.scripture_ref,');
  lines.push('  asset_manifest_key = excluded.asset_manifest_key, is_starter = excluded.is_starter,');
  lines.push(`  is_premium_cosmetic = excluded.is_premium_cosmetic, catalog_version = excluded.catalog_version${v3 ? ',\n  body_compatibility = excluded.body_compatibility, variant_label = excluded.variant_label' : ''}${v4 ? ',\n  acquisition = excluded.acquisition, series = excluded.series, book_code = excluded.book_code' : ''}${v5 ? ',\n  representation = excluded.representation, meaning = excluded.meaning, referent = excluded.referent,\n  holy_subtype = excluded.holy_subtype, shop_eligible = excluded.shop_eligible, shop_price_suggested = excluded.shop_price_suggested, is_active = true' : ''};`);
  lines.push('');
  if (v5 && catalog.idAliases && Object.keys(catalog.idAliases).length) {
    lines.push('-- Aliases de compatibilidade (ID oficial ou do rascunho → ID canônico).');
    lines.push('insert into public.cosmetic_item_aliases (alias_id, item_id, source) values');
    // IDs oficiais usam snake_case; IDs do rascunho, kebab-case.
    lines.push(Object.entries(catalog.idAliases).sort().map(([a, t]) => `  (${q(a)}, ${q(t)}, ${q(a.includes('_') ? 'official' : 'draft')})`).join(',\n'));
    lines.push('on conflict (alias_id) do update set item_id = excluded.item_id, source = excluded.source;');
    lines.push('');
  }
  if (catalog.missions?.length) {
    lines.push('-- Missões curadas do Modo Missão (concluídas ao finalizar a missão de leitura do capítulo).');
    lines.push('insert into public.reward_triggers (id, kind, name, description, book_code, chapter, is_active) values');
    lines.push(catalog.missions.map((m) => `  (${q(m.id)}, ${q(m.kind)}, ${q(m.name)}, ${q(m.description)}, ${q(m.book)}, ${m.chapter}, true)`).join(',\n'));
    lines.push('on conflict (id) do update set kind = excluded.kind, name = excluded.name, description = excluded.description,');
    lines.push('  book_code = excluded.book_code, chapter = excluded.chapter, is_active = true;');
    lines.push('');
  }
  const variants = catalog.items.filter((it) => it.variantOf);
  if (v3 && variants.length) {
    lines.push('-- Variantes evolutivas (cada variante é um item próprio; a base permanece).');
    for (const it of variants) lines.push(`update public.cosmetic_items set variant_of = ${q(it.variantOf)} where id = ${q(it.id)};`);
    lines.push('');
  }
  lines.push('-- Regras de desbloqueio: itens iniciais são gratuitos e concedidos pelo servidor.');
  lines.push("insert into public.item_unlock_rules (item_id, rule_type, rule_payload, revision)");
  lines.push(`select i.id, 'starter', jsonb_build_object('catalogVersion', ${catalog.version}), 1`);
  lines.push('from public.cosmetic_items i');
  lines.push('where i.is_starter and not i.is_premium_cosmetic');
  lines.push("on conflict (item_id) where rule_type = 'starter' do nothing;");
  lines.push('');
  const unlocks = catalog.items.filter((it) => it.unlock);
  if (unlocks.length) {
    if (v5) {
      lines.push('-- Regras anteriores dos itens do catálogo ficam inativas (histórico mantido); as atuais são reativadas abaixo.');
      lines.push(`update public.item_unlock_rules set is_active = false where rule_type <> 'starter' and item_id in (${jsonIds});`);
    }
    lines.push('-- Regras de desbloqueio por leitura (avaliadas pelo servidor no Marco 3).');
    lines.push('insert into public.item_unlock_rules (item_id, rule_type, rule_payload, requirements, revision) values');
    lines.push(
      unlocks
        .map((it) => {
          const payload = { ...(it.unlock.payload ?? {}), label: it.unlock.label ?? null };
          return `  (${q(it.id)}, ${q(it.unlock.type)}, ${q(JSON.stringify(payload))}::jsonb, ${q(JSON.stringify(it.unlock.requires ?? []))}::jsonb, ${it.unlock.revision ?? 1})`;
        })
        .join(',\n'),
    );
    lines.push('on conflict (item_id, rule_type, revision) do update set');
    lines.push(`  rule_payload = excluded.rule_payload, requirements = excluded.requirements${v5 ? ', is_active = true' : ''};`);
    lines.push('');
  }
  if (catalog.collections?.length) {
    lines.push('-- Coleções e itens de coleção.');
    lines.push('insert into public.item_collections (id, name, description, reward_item_id, sort_order) values');
    lines.push(catalog.collections.map((c, i) => `  (${q(c.id)}, ${q(c.name)}, ${q(c.description)}, ${q(c.reward)}, ${i})`).join(',\n'));
    lines.push('on conflict (id) do update set name = excluded.name, description = excluded.description,');
    lines.push('  reward_item_id = excluded.reward_item_id, sort_order = excluded.sort_order;');
    lines.push('insert into public.collection_items (collection_id, item_id, sort_order) values');
    lines.push(catalog.collections.flatMap((c) => c.items.map((id, i) => `  (${q(c.id)}, ${q(id)}, ${i})`)).join(',\n'));
    lines.push('on conflict (collection_id, item_id) do update set sort_order = excluded.sort_order;');
    if (v5) {
      lines.push('-- Remove só os vínculos de coleção que não existem mais no catálogo (dados de catálogo, não do usuário).');
      lines.push(`delete from public.collection_items ci where ci.collection_id in (${catalog.collections.map((c) => q(c.id)).join(', ')})`);
      lines.push(`  and (ci.collection_id, ci.item_id) not in (${catalog.collections.flatMap((c) => c.items.map((id) => `(${q(c.id)}, ${q(id)})`)).join(', ')});`);
    }
    lines.push('');
  }
  if (v5) {
    lines.push('-- Posse e equipamento seguem os aliases; backfill idempotente de recompensas já merecidas.');
    lines.push('select private.apply_item_aliases();');
    lines.push(`select private.evaluate_rewards(p.id, 'backfill:catalog-v${catalog.version}') from public.profiles p`);
    lines.push('where exists (select 1 from private.domain_events d where d.user_id = p.id);');
    lines.push('');
  }
  return lines.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const sql = buildCatalogSql(catalog);
  const outPath = outPathFor(catalog.version);
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
