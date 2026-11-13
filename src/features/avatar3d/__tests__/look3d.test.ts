import { look3d } from '../look3d';
import { defaultLook } from '@/features/avatar/domain/avatar.rules';

describe('modelo 3D a partir do visual da conta', () => {
  it('usa a cor de pele e de cabelo do catálogo e escolhe o cabelo pelo estilo', () => {
    const base = defaultLook();
    const a = look3d({ appearance: { ...base.appearance, skinToneId: 'skin-2', hairStyleId: 'hair-short', hairColorId: 'haircolor-black' }, equipment: { outfit: 'tunic-linen' } });
    expect(a.skin).toBe('#E8BC95');
    expect(a.hairColor).toBe('#1E1916');
    expect(a.meshes).toMatchObject({ hair_short: true, hair_long: false, cloak: false, staff: false });
    const b = look3d({ appearance: { ...base.appearance, skinToneId: 'skin-5', hairStyleId: 'hair-long-wavy' }, equipment: { outfit: 'tunic-linen', back: 'cloak-night', hands: 'staff-shepherd' } });
    expect(b.skin).toBe('#865233');
    expect(b.meshes).toMatchObject({ hair_short: false, hair_long: true, cloak: true, staff: true });
    expect(b.missing).toEqual([]);
  });

  it('lista as peças equipadas que ainda não têm modelo 3D', () => {
    const r = look3d({ appearance: defaultLook().appearance, equipment: { outfit: 'tunic-indigo', back: 'cloak-desert', feet: 'sandals-leather', background: 'bg-parchment' } });
    expect(r.missing.sort()).toEqual(['cloak-desert', 'sandals-leather', 'tunic-indigo']);
    expect(r.meshes.cloak).toBe(false);
  });
});
