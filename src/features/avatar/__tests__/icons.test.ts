import { ICON_IDS, hasItemIcon } from '../art/icons';
import { isArtifact } from '@/features/journey/art/artifacts';
import { COSMETIC_ITEMS, getItem } from '../domain/catalog';
import raw from '../catalog/catalog.json';

const MARKET = (raw.items as { id: string; shopEligible?: boolean }[]).filter((i) => i.shopEligible).map((i) => i.id);

// prioridade do lote 1 de ícones: prova 3D + iniciais + Mercado + artefatos de Êxodo 25 (sem repetição)
const PROOF = ['tunic-linen', 'cloak-night', 'staff-shepherd'];
const ARTIFACTS = ['holy_arca_da_alianca_representacao', 'holy_mesa_dos_paes_da_presenca', 'holy_candelabro_do_tabernaculo'];
const priority = () => [...new Set([
  ...PROOF,
  ...COSMETIC_ITEMS.filter((i) => i.acquisition === 'starter' || i.starter).map((i) => i.id),
  ...MARKET,
  ...ARTIFACTS,
])];

describe('ícones de inventário (lote 1)', () => {
  it('todo item prioritário tem miniatura própria por ID canônico', () => {
    const missing = priority().filter((id) => !hasItemIcon(id) && !isArtifact(id));
    expect(missing).toEqual([]);
    expect(priority()).toHaveLength(63);
  });

  it('miniaturas só para IDs canônicos existentes', () => {
    for (const id of ICON_IDS) expect(getItem(id)?.id).toBe(id);
  });

  it('cobertura total registrada', () => {
    const covered = COSMETIC_ITEMS.filter((i) => hasItemIcon(i.id) || isArtifact(i.id)).length;
    expect(COSMETIC_ITEMS).toHaveLength(185);
    expect(covered).toBe(63);
  });
});
