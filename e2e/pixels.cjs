/* eslint-disable */
// Comparação visual tolerante para capturas com arte pintada (PNG/WebP redimensionada pelo navegador):
// o reamostragem pode variar alguns pixels de borda entre dois carregamentos sem mudar o visual.
const { PNG } = require('pngjs');

/** Fração de pixels cuja diferença (soma RGBA) passa do limiar. Tamanhos diferentes = 1. */
function diffRatio(a, b, threshold = 40) {
  const pa = PNG.sync.read(a);
  const pb = PNG.sync.read(b);
  if (pa.width !== pb.width || pa.height !== pb.height) return 1;
  let n = 0;
  for (let i = 0; i < pa.data.length; i += 4) {
    const d = Math.abs(pa.data[i] - pb.data[i]) + Math.abs(pa.data[i + 1] - pb.data[i + 1]) + Math.abs(pa.data[i + 2] - pb.data[i + 2]) + Math.abs(pa.data[i + 3] - pb.data[i + 3]);
    if (d > threshold) n++;
  }
  return n / (pa.width * pa.height);
}

/** Mesmo visual: no máximo 0,5% dos pixels com diferença perceptível. */
const sameLook = (a, b) => diffRatio(a, b) <= 0.005;

module.exports = { diffRatio, sameLook };
