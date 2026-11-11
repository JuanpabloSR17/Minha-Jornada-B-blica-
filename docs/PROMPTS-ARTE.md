# Prompts e fluxo para ilustrações geradas por ferramenta de imagem

Este ambiente de desenvolvimento **não tem** gerador de imagens. Este guia prepara o trabalho para
quem for gerar e tratar as ilustrações. Nenhuma ilustração definitiva foi produzida aqui.

O resultado esperado são **camadas PNG/WebP transparentes** no canvas 1024×1536, encaixadas nos
moldes de `docs/art-templates/` — não imagens completas do personagem.

## 1. Bloco de estilo (cole no início de todo prompt)

```
2D illustrated character art for a premium mobile adventure RPG set in the ancient Near East
(biblical era). Hand-painted watercolor and gouache look with elegant thin warm-brown ink
outlines, soft shading, visible fabric folds, embroidery and stitching. Stylized human
proportions, about 5.5 to 6 heads tall, friendly but mature, for teens and adults.
Harmonious earthy palette (sand, ochre, terracotta, olive) with turquoise, indigo and gold
accents. Front view, standing, arms relaxed at the sides, neutral pose, full body,
centered, plain transparent background, even soft lighting from the upper left.
```

### Negativo (o que evitar)

```
chibi, big head, toddler proportions, cartoon emoji, sticker, flat vector clipart, anime
exaggeration, 3D render, photorealistic, harsh black outlines, neon colors, fantasy armor,
weapons pointed at viewer, halos, glowing magic, sensational religious imagery, text, logo,
watermark, cropped feet, dynamic pose, perspective tilt, background scenery (except for
background assets)
```

## 2. Personagens de validação (folhas de referência)

Gerar primeiro uma **folha de referência** de cada personagem para fixar o estilo. Ela NÃO é um asset:
serve para guiar as camadas.

| # | Personagem | Corpo | Prompt (após o bloco de estilo) |
|---|---|---|---|
| 1 | Explorador | body-a (esguio) | `young explorer, slender build, curious kind expression, voluminous curly black hair, warm brown skin, sand linen tunic with turquoise embroidery, ochre desert shawl, leather sandals` |
| 2 | Aventureiro | body-b (atlético) | `adventurer in his late twenties, athletic broad-shouldered build, confident calm expression, short textured dark-brown hair, trimmed short beard, medium-brown skin, indigo tunic with gold vertical stripes, brown wool cloak, wrapped leather travel boots` |
| 3 | Peregrina | body-c (robusto) | `pilgrim woman, sturdy full-figured build, joyful warm expression, long wavy auburn hair, light olive skin, terracotta wrap tunic with green knotted sash, leather sandals` |

Peça variações de pele e cabelo **depois**, nas camadas tingíveis (seção 5), não regenerando o personagem.

## 3. Prompts por peça (sempre sobre manequim neutro)

Use o molde do corpo (`docs/art-templates/molde-body-x.png`) como **referência de pose / img2img /
ControlNet (openpose ou lineart)**, para a peça sair já no lugar certo. Gere a peça **vestida no
manequim**, depois recorte (seção 4).

| Peça (ID) | Camadas | Prompt (após o bloco de estilo) |
|---|---|---|
| `tunic-linen` | upper_outfit, sleeves | `knee-length sand-colored linen tunic, three-quarter bell sleeves, chest slit with turquoise swirl embroidery, turquoise embroidered hem band, side slits, worn on a plain mannequin` |
| `tunic-indigo` | upper_outfit, sleeves | `knee-length deep indigo wool tunic, elbow sleeves, two gold vertical woven stripes (clavi) from shoulders to hem, gold diamond pattern at hem, round neckline with gold trim, on a plain mannequin` |
| `tunic-terracotta` | upper_outfit, sleeves | `terracotta wrap-style tunic crossing over the chest, three-quarter sleeves with cream cuffs, olive-green fabric sash tied in a knot at the right hip with long hanging ends, cream diamond hem band, on a plain mannequin` |
| `tunic-joseph` | upper_outfit, sleeves | `ankle-length richly woven robe with long sleeves, vertical bands of crimson, saffron, indigo, olive green, purple, orange and teal separated by thin gold threads, gold embroidered collar, cuffs and hem, festive but humble, inspired by Genesis 37:3, on a plain mannequin` |
| `cloak-wool` | cloak_back, cloak_front | `long brown sheep-wool mantle draped over both shoulders and hanging to the ankles, open in front, cream stripe border near the hem, small bronze clasp, heavy soft folds, on a plain mannequin` |
| `cloak-desert` | cloak_back, cloak_front | `light ochre desert shawl-cloak wrapped around the neck in loose folds, falling behind to the calves with an asymmetric hem, fringed edge, turquoise painted swirl motifs, on a plain mannequin` |
| `sandals-leather` | feet | `simple brown leather sandals with crossing straps and ankle strap, on mannequin feet, front view` |
| `boots-travel` | feet | `mid-calf wrapped leather travel boots with cream leather straps wound around the shaft and a folded cuff, on mannequin legs, front view` |
| `hair-curly` | back_hair, front_hair | `voluminous shoulder-length curly black hair with defined coils and soft highlights, on a bald mannequin head, front view` |
| `hair-short` | back_hair, front_hair | `short textured dark hair, slightly tousled top, tapered sides, on a bald mannequin head, front view` |
| `hair-long-wavy` | back_hair, front_hair | `long wavy hair parted in the middle, falling over the shoulders to mid-back, on a bald mannequin head, front view` |
| `bg-parchment` | background | `soft painted landscape of the Judean desert at golden hour, distant blue hills, cypress trees, warm sky, no people, wide format that can extend beyond the frame` |

Para cabelos, gere em **cor neutra clara** (cinza-areia): a cor final vem do tingimento.

## 4. Recorte em camadas (feito por artista)

1. Abra o molde `molde-body-x.png` (1024×1536) e a peça gerada; alinhe ombros, pulsos, joelhos e
   tornozelos aos pontos azuis.
2. Separe as camadas exigidas pela peça (tabela acima e `docs/ARTE.md` §4):
   - túnica: corpo da túnica (`upper_outfit`) e mangas (`sleeves`) em arquivos separados;
   - manto: parte de trás (`cloak_back`) e parte que cai sobre os ombros (`cloak_front`);
   - cabelo: massa traseira (`back_hair`) e franja/mechas da frente (`front_hair`).
3. Apague tudo que é manequim. Mantenha transparência real (sem fundo branco).
4. Repita para os três corpos (as roupas mudam de largura). Se uma peça servir igualmente aos
   três, exporte uma vez em `all/`.
5. Exporte WebP com alfa: `camada.webp` (1024×1536) e, se quiser, `camada@2x.webp` (2048×3072).
   Sugestão: `cwebp -q 85 -alpha_q 90 entrada.png -o camada.webp`.

## 5. Pele e cabelo tingíveis

- `body.mask.webp` / `back_hair.mask.webp`: só a forma, em cor chapada clara.
- `body.shade.webp` / `back_hair.shade.webp`: sombras e luzes translúcidas (sem cor base).
- O app pinta a máscara com o tom escolhido (6 tons de pele, 8 cores de cabelo) e aplica o
  sombreamento por cima, sem precisar de 48 versões de cada cabelo.

## 6. Entrega e verificação

```bash
# coloque os arquivos em assets/avatars/{categoria}/{assetId}/{corpo|all}/
npm run assets        # valida e gera o registro (falha se algo estiver fora do padrão)
npm start             # confira no criador e no guarda-roupa
```

Ferramenta interna para conferir encaixe: `/dev/avatar-lab?compare=outfit/tunic-joseph`
(mostra a peça nos três corpos e se cada um usa ilustração final ou arte provisória), com o app
rodando em desenvolvimento ou com `EXPO_PUBLIC_AVATAR_LAB=1`.

Só depois da aprovação visual do conjunto de validação o catálogo deve ser expandido.
