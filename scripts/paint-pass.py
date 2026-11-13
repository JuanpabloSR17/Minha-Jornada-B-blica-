#!/usr/bin/env python3
"""
Passe de pintura de TESTE para o lote de camadas do avatar (não é a arte final).

Lê as camadas exportadas por scripts/export-avatar-layers.cjs (2048×3072, fundo transparente), aplica uma
aproximação de acabamento 2.5D e grava os arquivos no formato do pipeline (assets/avatars/...):

- volume: oclusão suave nas bordas internas, relevo com luz vinda do alto à esquerda e um gradiente de luz
  global igual para todas as camadas (as peças continuam coerentes entre si);
- material: textura fina de pigmento e manchas largas, traços vetoriais amaciados;
- pele/cabelo (`mask`, `skinmask`): máscara chapada + sombreamento translúcido, para o app tingir com a cor da
  conta; camadas mistas (`mixed`): o que muda entre dois tons de pele vira sombreamento, o resto fica pintado.

Serve para validar encaixe, ordem de camadas, máscaras, poses e troca de peça no app enquanto a pintura final
é produzida. Uso:
  python3 scripts/paint-pass.py docs/arte-lotes/lote-1.json <pasta-exportada> assets/avatars
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

SKIN_A = (0xE8, 0xBC, 0x95)  # skin-2, usado no export
HAIR_A = (0xC9, 0x9A, 0x52)  # haircolor-honey, usado no export de cabelo e sobrancelhas
APPEARANCE = {'eyes', 'brows', 'expression', 'beard', 'hair'}
RNG = np.random.default_rng(7)
W, H = 2048, 3072


def load(path):
    return np.asarray(Image.open(path).convert('RGBA'), dtype=np.float32) / 255.0


def blur(a, r):
    img = Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8), 'L')
    return np.asarray(img.filter(ImageFilter.GaussianBlur(r)), dtype=np.float32) / 255.0


def shift(a, dx, dy):
    out = np.zeros_like(a)
    ys = slice(max(dy, 0), H + min(dy, 0))
    yd = slice(max(-dy, 0), H + min(-dy, 0))
    xs = slice(max(dx, 0), W + min(dx, 0))
    xd = slice(max(-dx, 0), W + min(-dx, 0))
    out[ys, xs] = a[yd, xd]
    return out


# luz global: mais clara no alto à esquerda, mais escura embaixo à direita (mesma para todas as camadas)
_yy, _xx = np.mgrid[0:H, 0:W].astype(np.float32)
GLOBAL_LIGHT = 1.0 + 0.09 * ((W / 2 - _xx) / (W / 2)) + 0.07 * ((H * 0.45 - _yy) / (H / 2))
FINE = blur(RNG.random((H, W)).astype(np.float32), 0.8) - 0.5
MOTTLE = blur(RNG.random((H, W)).astype(np.float32), 18) - 0.5


def paint(px, strength=1.0):
    """Aproximação de volume pintado sobre uma camada RGBA (0..1)."""
    rgb, a = px[..., :3], px[..., 3]
    # traço vetorial amaciado
    soft = np.stack([blur(rgb[..., i] * a, 1.1) for i in range(3)], -1)
    asoft = blur(a, 0.9)
    rgb = np.where(asoft[..., None] > 1e-3, soft / np.maximum(blur(a, 1.1)[..., None], 1e-3), rgb)
    a = np.maximum(a * 0.7, asoft)
    # oclusão nas bordas internas (forma arredondada)
    inner = blur(a, 26)
    ao = np.clip(1.0 - inner, 0, 1) * a
    # relevo: luz do alto à esquerda
    bl = blur(a, 10)
    relief = shift(bl, 10, 14) - shift(bl, -10, -14)
    shade = 1.0 - 0.38 * ao * strength + 0.22 * relief * strength
    shade *= GLOBAL_LIGHT
    shade *= 1.0 + (0.05 * FINE + 0.07 * MOTTLE) * strength
    rgb = np.clip(rgb * shade[..., None], 0, 1)
    return np.concatenate([rgb, a[..., None]], -1)


def lum(rgb):
    return 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]


def mask_and_shade(px, base_rgb, select=None):
    """Máscara chapada + sombreamento relativo à cor base (escurece com preto, clareia com branco)."""
    a = px[..., 3] if select is None else px[..., 3] * select
    l0 = lum(np.array(base_rgb, dtype=np.float32) / 255.0)
    r = lum(px[..., :3]) / max(l0, 1e-3)
    dark = np.clip(1.0 - r, 0, 1)
    light = np.clip((r - 1.0) / max(1.0 / l0 - 1.0, 1e-3), 0, 1)
    mask = np.zeros_like(px)
    mask[..., :3] = 0.94
    mask[..., 3] = a
    shade = np.zeros_like(px)
    shade[..., :3] = np.where((light > dark)[..., None], 1.0, 0.0)
    shade[..., 3] = np.maximum(dark, light) * a
    return mask, shade


def save(px, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img = Image.fromarray(np.clip(px * 255 + 0.5, 0, 255).astype(np.uint8), 'RGBA')
    img.save(path.replace('.webp', '@2x.webp'), 'WEBP', quality=88, alpha_quality=100, method=6)
    img.resize((W // 2, H // 2), Image.LANCZOS).save(path, 'WEBP', quality=88, alpha_quality=100, method=6)


def out_dir(root, source, body):
    cat, ident = source.split('/')
    if cat == 'body':
        return os.path.join(root, 'body', 'base', ident)
    return os.path.join(root, cat, ident, 'all' if cat in APPEARANCE else body)


def main(spec_path, raw, root):
    spec = json.load(open(spec_path))
    body = spec['corpo']
    for c in spec['camadas']:
        stem = f"{c['source'].replace('/', '__')}__{c['layer']}{'.' + c['pose'] if c.get('pose') else ''}"
        name = f"{c['layer']}{'.' + c['pose'] if c.get('pose') else ''}"
        d = out_dir(root, c['source'], body)
        a = load(os.path.join(raw, f'{stem}__skin-2.png'))
        t = c['type']
        if t == 'base':
            save(paint(a), os.path.join(d, f'{name}.webp'))
        elif t in ('mask', 'skinmask'):
            base = HAIR_A if c['source'].split('/')[0] in ('hair', 'brows') else SKIN_A
            m, s = mask_and_shade(paint(a), base)
            save(m, os.path.join(d, f'{name}.mask.webp'))
            save(s, os.path.join(d, f'{name}.shade.webp'))
        elif t == 'mixed':
            b = load(os.path.join(raw, f'{stem}__skin-5.png'))
            skin = (np.abs(a[..., :3] - b[..., :3]).sum(-1) > 0.06).astype(np.float32)
            fixed = a.copy()
            fixed[..., 3] *= 1.0 - skin
            _, s = mask_and_shade(a, SKIN_A, select=skin)
            if fixed[..., 3].max() > 0.01:
                save(paint(fixed, 0.4), os.path.join(d, f'{name}.webp'))
            save(s, os.path.join(d, f'{name}.shade.webp'))
        print('  ✔', os.path.relpath(d, root), name, t)


if __name__ == '__main__':
    main(*sys.argv[1:4])
