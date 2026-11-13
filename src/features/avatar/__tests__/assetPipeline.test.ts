import { execFileSync } from 'child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { deflateSync } from 'zlib';

const root = join(__dirname, '../../../..');

/** PNG mínimo (RGB ou RGBA) com CRC correto. */
function png(width: number, height: number, alpha: boolean): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff]! ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = alpha ? 6 : 2;
  const row = 1 + width * (alpha ? 4 : 3);
  const raw = Buffer.alloc(row * height);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

function run(files: Record<string, Buffer>) {
  const dir = mkdtempSync(join(tmpdir(), 'avatar-assets-'));
  for (const [rel, buf] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), buf);
  }
  const out = execFileSync(process.execPath, [join(root, 'scripts/avatar-assets.mjs'), '--dir', dir, '--out', join(dir, 'gen.ts'), '--json'], { encoding: 'utf8', maxBuffer: 50e6 });
  return JSON.parse(out) as { errors: string[]; warnings: string[]; code: string; coverage: Record<string, { bodies: string[]; missing: string[] }> };
}

const OK = png(1024, 1536, true);

describe('pipeline de assets ilustrados', () => {
  it('aceita arquivo válido e gera o registro com a camada certa', () => {
    const r = run({ 'outfit/tunic-joseph/all/upper_outfit.png': OK, 'outfit/tunic-joseph/all/sleeves.png': OK });
    expect(r.errors).toEqual([]);
    expect(r.code).toContain("'outfit/tunic-joseph'");
    expect(r.code).toMatch(/upper_outfit: \[\s+\{ sources: \{ 'all': require\(/);
    expect(r.coverage['outfit/tunic-joseph']!.missing).toEqual([]);
  });

  it('recusa tamanho errado, falta de transparência, nome e caminho inválidos', () => {
    const r = run({
      'outfit/tunic-joseph/all/upper_outfit.png': png(720, 1080, true),
      'back/cloak-wool/body-a/cloak_back.png': png(1024, 1536, false),
      'outfit/tunic-joseph/all/capa.png': OK,
      'outfit/solto.png': OK,
      'outfit/nao-existe/all/upper_outfit.png': OK,
      'hair/hair-curly/all/back_hair.png': OK,
      'outfit/tunic-linen/all/upper_outfit.mask.png': OK,
    });
    const has = (s: string) => r.errors.some((e) => e.includes(s));
    expect(has('720×1080, esperado 1024×1536')).toBe(true);
    expect(has('sem transparência')).toBe(true);
    expect(has('camada desconhecida "capa"')).toBe(true);
    expect(has('caminho fora do padrão')).toBe(true);
    expect(has('"outfit/nao-existe" não existe no catálogo')).toBe(true);
    expect(has('".mask" só vale para pele/cabelo')).toBe(true);
  });

  it('exige @2x com 2048×3072 e não registra o @2x separadamente', () => {
    const ok = run({ 'feet/boots-travel/all/feet.png': OK, 'feet/boots-travel/all/feet@2x.png': png(2048, 3072, true) });
    expect(ok.errors).toEqual([]);
    expect(ok.code).not.toContain('@2x');
    const bad = run({ 'feet/boots-travel/all/feet.png': OK, 'feet/boots-travel/all/feet@2x.png': OK });
    expect(bad.errors.some((e) => e.includes('esperado 2048×3072'))).toBe(true);
  });

  it('aplica a política de variantes por corpo e avisa os corpos sem versão', () => {
    const r = run({ 'back/cloak-desert/body-b/cloak_back.png': OK, 'back/cloak-desert/body-b/cloak_front.png': OK });
    expect(r.coverage['back/cloak-desert']).toEqual({ bodies: ['body-b'], missing: ['body-a', 'body-c'] });
    expect(r.warnings[0]).toContain('body-a, body-c');
  });

  it('pele e cabelo usam máscara tingível + sombreamento', () => {
    const r = run({ 'body/base/body-b/body.mask.png': OK, 'body/base/body-b/body.shade.png': OK, 'hair/hair-curly/all/back_hair.mask.png': OK });
    expect(r.errors).toEqual([]);
    expect(r.code).toContain("tint: 'skin'");
    expect(r.code).toContain("tint: 'hair'");
    expect(r.code.indexOf('body.mask')).toBeLessThan(r.code.indexOf('body.shade'));
  });

  it('aceita as camadas de encaixe das peças de viagem e a variante de pose do cajado', () => {
    const r = run({
      'waist/common_bolsa_do_viajante/body-b/chest.png': OK,
      'waist/common_bolsa_do_viajante/body-b/waist.png': OK,
      'head/headwrap-sand/all/back_item.png': OK,
      'outfit/tunic-linen/body-b/sleeves.png': OK,
      'outfit/tunic-linen/body-b/sleeves.staff.png': OK,
      'body/base/body-b/arms.staff.mask.png': OK,
      'body/base/body-b/arms.staff.shade.png': OK,
    });
    expect(r.errors).toEqual([]);
    expect(r.code).toContain('chest: [');
    expect(r.code).toContain('back_item: [');
    expect(r.code).toMatch(/sleeves\.staff\.png'\) \}, pose: 'staff' \}/);
    expect(r.code).toMatch(/arms\.staff\.mask\.png'\) \}, tint: 'skin', pose: 'staff' \}/);
  });

  it('recusa variante de pose em camada que não depende do braço', () => {
    const r = run({ 'outfit/tunic-linen/body-b/upper_outfit.staff.png': OK });
    expect(r.errors.some((e) => e.includes('variante de pose ".staff" só vale para'))).toBe(true);
  });

  it('o registro versionado está em dia com assets/avatars', () => {
    expect(() => execFileSync(process.execPath, [join(root, 'scripts/avatar-assets.mjs'), '--check'], { stdio: 'pipe' })).not.toThrow();
  });
});
