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

function run(file: string, extra: string[] = []) {
  try {
    return { ok: true, out: execFileSync(process.execPath, [join(root, 'scripts/import-rarities-catalog.mjs'), file, ...extra], { encoding: 'utf8', stdio: 'pipe' }) };
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

  it('reconcilia sem destruir: preserva IDs existentes, cria aliases e relata diferenças', () => {
    const file = portugueseFile((rows) => {
      // mesmo item com outro ID no oficial → mantém o ID existente e registra alias
      const joseph = rows.find((x) => x.codigo === 'tunic-joseph')!;
      joseph.codigo = 'epico-tunica-jose';
      // raridade diferente: o oficial manda (raro → épico exige compensar a contagem)
      const elijah = rows.find((x) => x.codigo === 'cloak-elijah')!;
      elijah.referencia = '1 Reis 19:19-21';
      // lendário renomeado com outro ID → corresponde pelo livro
      const gen = rows.find((x) => x.codigo === 'legendary-gen')!;
      gen.codigo = 'lendario-genesis';
      gen.nome = 'Cetro do Princípio';
      // um comum do rascunho substituído por um item novo do oficial
      const coins = rows.find((x) => x.codigo === 'purse-coins')!;
      coins.codigo = 'comum-odre-novo';
      coins.nome = 'Odre Novo';
    });
    const report = join(mkdtempSync(join(tmpdir(), 'rep-')), 'relatorio.md');
    const r = run(file, ['--report', report]);
    expect(r.ok).toBe(true);
    const md = require('fs').readFileSync(report, 'utf8') as string;
    expect(md).toContain('| epico-tunica-jose | tunic-joseph | nome |');
    expect(md).toContain('| lendario-genesis | legendary-gen | livro | name: "Cajado dos Patriarcas" → "Cetro do Princípio" |');
    expect(md).toContain('scriptureRef: "1 Reis 19:19" → "1 Reis 19:19-21"');
    expect(md).toContain('| comum-odre-novo | comum-odre-novo | novo |');
    expect(md).toMatch(/mantidos como legado.*purse-coins/);
  });
});

