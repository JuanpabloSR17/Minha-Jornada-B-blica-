/* eslint-disable */
// GERADO por scripts/gen-skin-art.mjs a partir de assets/skins. Não editar à mão.
export type SkinVariant = 'padrao' | 'feminino';
export type SkinArt = { name?: string; icon: number; styles: number[] };
export const SKIN_ART: Record<string, Partial<Record<SkinVariant, SkinArt>>> = {
  comum_parteira: {
    padrao: { icon: require('../../../assets/skins/comum_parteira/icone.webp'), styles: [
      require('../../../assets/skins/comum_parteira/estilo-1/corpo.webp'),
      require('../../../assets/skins/comum_parteira/estilo-2/corpo.webp'),
      require('../../../assets/skins/comum_parteira/estilo-3/corpo.webp'),
    ] },
  },
  comum_peregrino_exodo: {
    padrao: { icon: require('../../../assets/skins/comum_peregrino_exodo/icone.webp'), styles: [
      require('../../../assets/skins/comum_peregrino_exodo/estilo-1/corpo.webp'),
      require('../../../assets/skins/comum_peregrino_exodo/estilo-2/corpo.webp'),
      require('../../../assets/skins/comum_peregrino_exodo/estilo-3/corpo.webp'),
    ] },
    feminino: { name: "Peregrina do Êxodo", icon: require('../../../assets/skins/comum_peregrino_exodo/feminino/icone.webp'), styles: [
      require('../../../assets/skins/comum_peregrino_exodo/feminino/estilo-1/corpo.webp'),
      require('../../../assets/skins/comum_peregrino_exodo/feminino/estilo-2/corpo.webp'),
      require('../../../assets/skins/comum_peregrino_exodo/feminino/estilo-3/corpo.webp'),
    ] },
  },
  comum_tecela: {
    padrao: { icon: require('../../../assets/skins/comum_tecela/icone.webp'), styles: [
      require('../../../assets/skins/comum_tecela/estilo-1/corpo.webp'),
      require('../../../assets/skins/comum_tecela/estilo-2/corpo.webp'),
      require('../../../assets/skins/comum_tecela/estilo-3/corpo.webp'),
    ] },
  },
  lendario_moises: {
    padrao: { icon: require('../../../assets/skins/lendario_moises/icone.webp'), styles: [
      require('../../../assets/skins/lendario_moises/estilo-1/corpo.webp'),
      require('../../../assets/skins/lendario_moises/estilo-2/corpo.webp'),
      require('../../../assets/skins/lendario_moises/estilo-3/corpo.webp'),
    ] },
    feminino: { name: "Manto de Moisés", icon: require('../../../assets/skins/lendario_moises/feminino/icone.webp'), styles: [
      require('../../../assets/skins/lendario_moises/feminino/estilo-1/corpo.webp'),
      require('../../../assets/skins/lendario_moises/feminino/estilo-2/corpo.webp'),
      require('../../../assets/skins/lendario_moises/feminino/estilo-3/corpo.webp'),
    ] },
  },
  raro_levita: {
    padrao: { icon: require('../../../assets/skins/raro_levita/icone.webp'), styles: [
      require('../../../assets/skins/raro_levita/estilo-1/corpo.webp'),
      require('../../../assets/skins/raro_levita/estilo-2/corpo.webp'),
      require('../../../assets/skins/raro_levita/estilo-3/corpo.webp'),
    ] },
    feminino: { name: "Traje levítico", icon: require('../../../assets/skins/raro_levita/feminino/icone.webp'), styles: [
      require('../../../assets/skins/raro_levita/feminino/estilo-1/corpo.webp'),
      require('../../../assets/skins/raro_levita/feminino/estilo-2/corpo.webp'),
      require('../../../assets/skins/raro_levita/feminino/estilo-3/corpo.webp'),
    ] },
  },
};
