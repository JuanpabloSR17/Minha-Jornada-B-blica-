import { readFileSync } from 'fs';
import { join } from 'path';
import { execFileSync } from 'child_process';

const root = join(__dirname, '../../../..');

describe('migração do catálogo', () => {
  it('está sincronizada com catalog.v1.json', () => {
    // O gerador em modo --check falha se a migração estiver desatualizada.
    expect(() => execFileSync(process.execPath, [join(root, 'scripts/generate-catalog-sql.mjs'), '--check'], { stdio: 'pipe' })).not.toThrow();
  });

  it('slots do app batem com o CHECK do banco', () => {
    const catalog = JSON.parse(readFileSync(join(root, 'src/features/avatar/catalog/catalog.v1.json'), 'utf8'));
    const core = readFileSync(join(root, 'supabase/migrations/20261111000100_marco1_core.sql'), 'utf8');
    for (const slot of catalog.slots) expect(core).toContain(`'${slot}'`);
  });
});
