#!/usr/bin/env python3
"""Aviso (não bloqueia): camadas com névoa de alfa residual.

Pixels com alfa entre 1 e 15 espalhados pelo canvas (ruído de compressão com perdas do canal alfa ou sobra
de recorte) escurecem levemente o fundo em todo o retângulo do canvas e aparecem como uma borda reta no palco
do guarda-roupa. Corrija na exportação: canal alfa sem perdas (WebP lossless, ou alpha_quality=100 com
exact) e pixels de fundo com alfa 0.

Uso: python3 scripts/art-alpha-check.py <arquivos .webp/.png...>
"""
import sys

from PIL import Image

LIMIT = 0.05  # mais de 5% do canvas com alfa residual
bad = 0
for path in sys.argv[1:]:
    im = Image.open(path).convert('RGBA')
    a = im.getchannel('A')
    hist = a.histogram()
    total = im.width * im.height
    faint = sum(hist[1:16]) / total
    if faint > LIMIT:
        bad += 1
        print(f'aviso: {path}: {faint * 100:.1f}% do canvas com alfa residual (1–15); exporte o alfa sem perdas e o fundo com alfa 0')
if not bad:
    print('alfa: sem névoa residual')
