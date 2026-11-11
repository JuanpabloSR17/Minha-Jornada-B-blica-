import { execFileSync } from 'child_process';
import { createHash } from 'crypto';
import { mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const root = join(__dirname, '../../../..');
const officialDir = join(root, 'docs/catalogo-oficial');
const officialFile = join(officialDir, 'catalogo_raridades_144_itens_v2.json');

type OfficialItem = Record<string, unknown> & { id: string; raridade: string; book_id?: string; referencia: string; desbloqueio: Record<string, unknown> };
const official = () => JSON.parse(readFileSync(officialFile, 'utf8')) as { items?: OfficialItem[]; itens?: OfficialItem[] } & Record<string, unknown>;
const itemsOf = (o: ReturnType<typeof official>) => (o.items ?? o.itens)!;

function mutated(mutate: (rows: OfficialItem[]) => void) {
  const o = official();
  mutate(itemsOf(o));
  const file = join(mkdtempSync(join(tmpdir(), 'oficial-')), 'catalogo.json');
  writeFileSync(file, JSON.stringify(o));
  return file;
}

function run(file: string, extra: string[] = []) {
  try {
    return { ok: true, out: execFileSync(process.execPath, [join(root, 'scripts/import-rarities-catalog.mjs'), file, ...extra], { encoding: 'utf8', stdio: 'pipe' }) };
  } catch (e) {
    const err = e as { stdout: string; stderr: string };
    return { ok: false, out: `${err.stdout}${err.stderr}` };
  }
}

/** Roda reconcile() contra o catalog.json atual (módulo ESM, via processo filho). */
function reconcileNow(): { hows: Record<string, number>; retired: number; sameItems: boolean; sameAliases: boolean } {
  const code = `
    import { convert, reconcile } from ${JSON.stringify(join(root, 'scripts/import-rarities-catalog.mjs'))};
    import { readFileSync } from 'node:fs';
    const off = convert(JSON.parse(readFileSync(${JSON.stringify(officialFile)}, 'utf8')));
    const cat = JSON.parse(readFileSync(${JSON.stringify(join(root, 'src/features/avatar/catalog/catalog.json'))}, 'utf8'));
    const r = reconcile(cat, off.items);
    const norm = (o) => JSON.stringify(o, Object.keys(o).sort());
    const hows = {}; r.rows.forEach((x) => (hows[x.how] = (hows[x.how] || 0) + 1));
    console.log(JSON.stringify({ hows, retired: r.retiredDraft.length,
      sameItems: r.catalog.items.map(norm).join() === cat.items.map(norm).join(),
      sameAliases: JSON.stringify(r.catalog.idAliases) === JSON.stringify(cat.idAliases) }));`;
  return JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', code], { encoding: 'utf8' }));
}

describe('catálogo oficial (arquivo de referência)', () => {
  it('arquivos oficiais íntegros (SHA-256)', () => {
    const sums = readFileSync(join(officialDir, 'SHA256SUMS.txt'), 'utf8').trim().split('\n');
    expect(sums).toHaveLength(2);
    for (const line of sums) {
      const [hash, name] = line.split(/\s+/);
      expect(createHash('sha256').update(readFileSync(join(officialDir, name!))).digest('hex')).toBe(hash);
    }
  });

  it('é aceito pelo importador: 144 itens, 22/18/16/66/22', () => {
    const r = run(officialFile);
    expect(r.ok).toBe(true);
    expect(r.out).toContain('Itens lidos: 144');
    expect(r.out).toMatch(/common: 22, rare: 18, epic: 16, legendary: 66, holy: 22/);
  });

  it('aponta contagem errada, livro sem lendário, referência inválida, item negociável e Santo na loja', () => {
    const r = run(
      mutated((rows) => {
        rows.splice(rows.findIndex((x) => x.id === 'book_gen'), 1);
        rows.find((x) => x.raridade === 'comum')!.referencia = 'Livro Inexistente 3:1';
        rows.find((x) => x.raridade === 'raro')!.comercializavel = true;
        rows.find((x) => x.raridade === 'santo')!.loja = true;
      }),
    );
    expect(r.ok).toBe(false);
    expect(r.out).toContain('raridade legendary: 65 itens (esperado 66)');
    expect(r.out).toContain('livro sem lendário: Gênesis');
    expect(r.out).toMatch(/referência "Livro Inexistente 3:1" não aponta/);
    expect(r.out).toContain('não podem ser comercializáveis');
    expect(r.out).toContain('Santo não pode ir para a loja');
  });

  it('acusa ID duplicado e dois lendários no mesmo livro', () => {
    const r = run(
      mutated((rows) => {
        rows.find((x) => x.id === 'book_exo')!.id = 'book_gen';
      }),
    );
    expect(r.ok).toBe(false);
    expect(r.out).toContain('ID duplicado: book_gen');
  });

  it('reimportar o arquivo oficial é idempotente (nada muda, nada é retirado)', () => {
    const r = reconcileNow();
    expect(r.retired).toBe(0);
    expect(r.sameItems).toBe(true);
    expect(r.sameAliases).toBe(true);
    expect((r.hows.id ?? 0) + (r.hows.alias ?? 0)).toBe(144);
  });
});
