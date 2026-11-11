import { execFileSync } from 'child_process';
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const root = join(__dirname, '../../../..');
const PT: Record<string, string> = { common: 'Comum', rare: 'Raro', epic: 'Épico', legendary: 'Lendário', holy: 'Santo' };
const SLOT_PT: Record<string, string> = { outfit: 'túnica', back: 'manto', feet: 'calçado', waist: 'cintura', neck: 'pescoço', head: 'cabeça', hands: 'mãos', background: 'fundo', frame: 'moldura', relic: 'relíquia' };

type Raw = { id: string; name: string; slot: string; category: string; rarity: string; scriptureRef: string; description: string; series?: string; book?: string; unlock: { type: string; payload: Record<string, unknown> } };

/** Simula um arquivo do usuário com nomes de campos em português. */
function portugueseFile(mutate?: (rows: Record<string, unknown>[]) => void) {
  const catalog = require('../catalog/catalog.json') as { items: Raw[] };
  const rows: Record<string, unknown>[] = catalog.items
    .filter((i) => i.series === 'rarities-v1')
    .map((i) => ({
      codigo: i.id,
      nome: i.name,
      descricao: i.description,
      raridade: PT[i.rarity],
      categoria: i.category,
      encaixe: SLOT_PT[i.slot],
      referencia: i.scriptureRef,
      livro: i.book,
      regra: i.unlock.type === 'chapter_completed' ? { tipo: 'capitulo', livro: i.unlock.payload.book, capitulo: i.unlock.payload.chapter } : { tipo: i.unlock.type, ...i.unlock.payload },
    }));
  mutate?.(rows);
  const dir = mkdtempSync(join(tmpdir(), 'rarities-'));
  const file = join(dir, 'catalogo.json');
  writeFileSync(file, JSON.stringify({ itens: rows }));
  return file;
}

function run(file: string) {
  try {
    return { ok: true, out: execFileSync(process.execPath, [join(root, 'scripts/import-rarities-catalog.mjs'), file], { encoding: 'utf8', stdio: 'pipe' }) };
  } catch (e) {
    const err = e as { stdout: string; stderr: string };
    return { ok: false, out: `${err.stdout}${err.stderr}` };
  }
}

describe('importador do catálogo oficial de raridades', () => {
  it('aceita um arquivo completo com campos em português', () => {
    const r = run(portugueseFile());
    expect(r.out).toContain('Itens lidos: 144');
    expect(r.ok).toBe(true);
  });

  it('aponta contagem errada, livro sem lendário, campo ausente e regra irreconhecível', () => {
    const r = run(
      portugueseFile((rows) => {
        rows.splice(rows.findIndex((x) => x.codigo === 'legendary-gen'), 1);
        rows[0]!.referencia = '';
        rows[1]!.regra = 'quando quiser';
      }),
    );
    expect(r.ok).toBe(false);
    expect(r.out).toContain('raridade legendary: 65 itens (esperado 66)');
    expect(r.out).toContain('livro sem lendário: Gênesis');
    expect(r.out).toContain('campo "scriptureRef" ausente');
    expect(r.out).toMatch(/regra .* (ausente|revisão manual)/);
  });
});
