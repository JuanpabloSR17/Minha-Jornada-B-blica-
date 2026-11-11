export type AppearanceCategory =
  | 'body'
  | 'skin_tone'
  | 'eyes'
  | 'brows'
  | 'expression'
  | 'beard'
  | 'hair_style'
  | 'hair_color';

/** Características físicas do personagem (IDs do catálogo de aparência). */
export type AvatarAppearance = {
  bodyId: string;
  skinToneId: string;
  eyesId: string;
  browsId: string;
  expressionId: string;
  beardId: string;
  hairStyleId: string;
  hairColorId: string;
};

export type AppearanceKey = keyof AvatarAppearance;

export type EquipmentSlot =
  | 'outfit'
  | 'back'
  | 'feet'
  | 'waist'
  | 'neck'
  | 'head'
  | 'hands'
  | 'background'
  | 'frame';

/** Um item por slot. Slots ausentes estão vazios. */
export type Equipment = Partial<Record<EquipmentSlot, string>>;

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/** Camadas de desenho (ordem visual), distintas dos slots de equipamento. */
export type LayerSlot =
  | 'background'
  | 'shadow'
  | 'cloak_back'
  | 'back_hair'
  | 'body'
  | 'face'
  | 'lower_outfit'
  | 'feet'
  | 'upper_outfit'
  | 'waist'
  | 'arms'
  | 'sleeves'
  | 'neck'
  | 'beard'
  | 'mouth'
  | 'front_hair'
  | 'headwear'
  | 'face_accessory'
  | 'cloak_front'
  | 'hand_item'
  | 'special_fx'
  | 'frame';

export type AppearanceOption = {
  id: string;
  name: string;
  description?: string;
  color?: string;
};

export type CosmeticItem = {
  id: string;
  name: string;
  slot: EquipmentSlot;
  category: string;
  description: string;
  rarity: Rarity;
  scriptureRef?: string;
  /** Camadas que este item esconde (ex.: turbante esconde a franja). */
  hides?: LayerSlot[];
  starter: boolean;
  premium: boolean;
};

export type AvatarLook = {
  appearance: AvatarAppearance;
  equipment: Equipment;
};

/** Estado persistido no servidor. */
export type AvatarState = AvatarLook & {
  version: number;
  loadoutId: string | null;
  updatedAt: string | null;
};

/** Metadados de uma camada resolvida para desenho (ver spec §5.2). */
export type AvatarLayer = {
  id: string;
  slot: LayerSlot;
  assetKey: string;
  zIndex: number;
  bodyCompatibility: string[];
  variant?: string;
};
