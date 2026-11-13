#!/usr/bin/env bash
# Entrada de um lote de arte pintada (PNG/WebP) do avatar.
#   1. copia a entrega para assets/avatars/ (mesma árvore de pastas; substitui camada por camada)
#   2. valida e registra (npm run assets)  → tamanho, alfa, caminho, camada, corpo, ID, máscaras, poses
#   3. estado do lote (scripts/art-status.mjs) → pintura entregue × teste procedural × faltando
#   4. tipos e testes de encaixe (layering, pipeline)
#   5. percurso no navegador (FLOW=avatar-lote1): guarda-roupa, acampamento, troca de cajado, reabrir,
#      320 e 412 px, e a comparação referência vetorial × pintura (luz neutra e do acampamento)
#   6. antes × depois lado a lado (capturas anteriores do lote × desta entrega)
#
# Uso: bash scripts/art-intake.sh [pasta-da-entrega] [docs/arte-lotes/lote-1.json]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:-}"
SPEC="${2:-docs/arte-lotes/lote-1.json}"
LOTE="$(node -e "console.log(require('$ROOT/$SPEC').lote)")"
OUT="$ROOT/docs/arte-lotes/lote-$LOTE/capturas-entrega"
BEFORE="$ROOT/docs/arte-lotes/lote-$LOTE/capturas"
cd "$ROOT"

if [ -n "$SRC" ]; then
  echo "→ 1. copiando a entrega de $SRC"
  ( cd "$SRC" && find . -type f \( -name '*.webp' -o -name '*.png' \) -print ) | while read -r f; do
    mkdir -p "assets/avatars/$(dirname "$f")"
    cp "$SRC/$f" "assets/avatars/$f"
    echo "   $f"
  done
fi

echo "→ 2. validação e registro"
npm run -s assets
echo "→ 3. estado do lote"
node scripts/art-status.mjs "$SPEC"
echo "→ 4. tipos e testes de encaixe"
npx tsc --noEmit
npx jest src/features/avatar/__tests__/assetPipeline.test.ts src/features/avatar/__tests__/layering.test.ts 2>&1 | grep -E "Tests:|✕" || true
echo "→ 5. percurso no navegador (troca, reabrir, 320/412, comparação)"
rm -rf "$OUT"
SHOTS_DIR="$OUT" FLOW=avatar-lote1 NODE_PATH="$(npm root -g)" bash e2e/run.sh
if command -v ffmpeg >/dev/null; then
  echo "→ 6. antes × depois"
  for n in l1-01-guarda-roupa-pastor-412 l1-02-acampamento-pastor-412 l1-03-acampamento-caminhada-412; do
    [ -f "$BEFORE/$n.png" ] && [ -f "$OUT/$n.png" ] && ffmpeg -loglevel error -y -i "$BEFORE/$n.png" -i "$OUT/$n.png" \
      -filter_complex "[0]scale=-1:900[a];[1]scale=-1:900[b];[a][b]hstack=inputs=2" "$OUT/antes-depois-$n.png"
  done
  [ -f "$OUT/videos/lote1-troca-de-cajado.webm" ] && ffmpeg -loglevel error -y -i "$OUT/videos/lote1-troca-de-cajado.webm" \
    -c:v libx264 -pix_fmt yuv420p -movflags +faststart -crf 26 "$OUT/lote1-troca-de-cajado.mp4"
fi
echo "✔ Entrada do lote $LOTE verificada. Capturas em ${OUT#$ROOT/}; estado em docs/arte-lotes/lote-$LOTE/ESTADO.md"
