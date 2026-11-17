import { COSMETIC_ITEMS } from '../../domain/catalog';
import { cloakKind, glyphOf, headKind, wearFrom } from '../archetypes';

const WEAR = ['outfit', 'back', 'head', 'neck', 'chest', 'hands'];

describe('arquétipos dos estilos de personagem', () => {
  it('todo item vestível de busto e de mão vira um desenho', () => {
    const items = COSMETIC_ITEMS.filter((i) => WEAR.includes(i.slot));
    const missing = items.filter((i) => {
      const w = wearFrom({ [i.slot]: i.id });
      const key = ({ outfit: 'tunic', back: 'cloak', head: 'head', neck: 'neck', chest: 'chest', hands: 'hand' } as const)[i.slot as 'outfit'];
      return !w[key];
    });
    expect(missing.map((i) => i.id)).toEqual([]);
    expect(items.length).toBeGreaterThan(100);
  });
  it('separa coroas, mantos e objetos pelo tipo', () => {
    expect(headKind('Coroa da Aliança Davídica')).toBe('crown');
    expect(headKind('Coroa da Sabedoria')).toBe('wreath-flower');
    expect(headKind('Coroa da Glória')).toBe('wreath-laurel');
    expect(cloakKind('Manto do Profeta')).toBe('hair');
    expect(cloakKind('Manto de Viagem')).toBe('hood');
    expect(cloakKind('Capa de Rute')).toBe('shawl');
    expect(glyphOf('Harpa de Davi')).toBe('harp');
    expect(glyphOf('Escudo da Fé')).toBe('shield');
    expect(glyphOf('Rolo do Escriba')).toBe('scroll');
    expect(glyphOf('Cetro de Ouro')).toBe('scepter');
  });
  it('a Túnica de José é listrada (Gn 37:3)', () => {
    const jose = COSMETIC_ITEMS.find((i) => i.name === 'Túnica de José')!;
    expect(wearFrom({ outfit: jose.id }).tunic?.stripes?.length).toBeGreaterThan(2);
  });
});
