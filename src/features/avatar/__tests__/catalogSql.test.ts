import { readFileSync } from 'fs';
import { join } from 'path';
import { execFileSync } from 'child_process';

const root = join(__dirname, '../../../..');

describe('migração do catálogo', () => {
  it('está sincronizada com catalog.json', () => {
    // O gerador em modo --check falha se a migração estiver desatualizada.
    expect(() => execFileSync(process.execPath, [join(root, 'scripts/generate-catalog-sql.mjs'), '--check'], { stdio: 'pipe' })).not.toThrow();
  });

  it('slots do app batem com o CHECK do banco', () => {
    const catalog = JSON.parse(readFileSync(join(root, 'src/features/avatar/catalog/catalog.json'), 'utf8'));
    // o CHECK de slots mais recente está na migração de suporte ao catálogo oficial
    const check = readFileSync(join(root, 'supabase/migrations/20261115000100_official_catalog_support.sql'), 'utf8');
    for (const slot of [...catalog.slots, 'relic']) expect(check).toContain(`'${slot}'`);
    for (const it of catalog.items) expect([...catalog.slots, 'relic']).toContain(it.slot);
  });
});
