import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireSupabase } from '@/lib/supabase/client';
import { throwIfError } from '@/lib/errors';

export type MarketItem = {
  itemId: string;
  /** preço em Siclos (catálogo oficial); null = preço ainda não definido */
  price: number | null;
  status: 'available' | 'price_pending';
  section?: 'essentials' | 'daily';
  /** posse pela identidade canônica (inclui posse registrada com ID antigo) */
  owned: boolean;
};

export type MarketState = {
  siclosBalance: number;
  items: MarketItem[];
  purchases: { purchaseId: string; itemId: string; price: number; createdAt: string }[];
  rotation?: { day: string; serverNow: string; nextAt: string };
  /** Hora local equivalente ao fim da oferta, calculada pelo intervalo do servidor. */
  offerDeadline?: number;
};

export type PurchaseResult = {
  purchaseId: string;
  itemId: string;
  requestedItemId: string;
  price: number;
  granted: string[];
  siclosBalance: number;
  /** a mesma compra já tinha sido registrada (reenvio): nada foi debitado de novo */
  duplicate: boolean;
};

const rpc = async (fn: string, args?: Record<string, unknown>) => throwIfError(await requireSupabase().rpc(fn, args));

export async function getMarket(): Promise<MarketState> {
  const market = (await rpc('get_market')) as MarketState;
  const rotation = market.rotation;
  if (!rotation) return market;
  const remaining = Date.parse(rotation.nextAt) - Date.parse(rotation.serverNow);
  return Number.isFinite(remaining) ? { ...market, offerDeadline: Date.now() + Math.max(0, remaining) } : market;
}

/** Compra idempotente pelo ID da compra (gerado no aparelho). */
export const purchaseItem = async (purchase: PendingPurchase) =>
  (await rpc('purchase_market_item', {
    p_purchase_id: purchase.purchaseId,
    p_item: purchase.itemId,
    ...(purchase.offerDay ? { p_price: purchase.price, p_offer_day: purchase.offerDay } : {}),
  })) as PurchaseResult;

/** Compra confirmada pelo jogador e ainda sem resposta do servidor (sobrevive a fechar o app). */
export type PendingPurchase = { purchaseId: string; itemId: string; price: number; userId: string; offerDay?: string };
const key = (userId: string) => `jb.market.pending.${userId}`;

export const pendingPurchaseStorage = {
  async load(userId: string): Promise<PendingPurchase | null> {
    try {
      const raw = await AsyncStorage.getItem(key(userId));
      const p = raw ? (JSON.parse(raw) as PendingPurchase) : null;
      return p && p.userId === userId ? p : null;
    } catch {
      return null;
    }
  },
  save: (p: PendingPurchase) => AsyncStorage.setItem(key(p.userId), JSON.stringify(p)),
  clear: (userId: string) => AsyncStorage.removeItem(key(userId)).catch(() => undefined),
};

// ------------------------------------------------------------------ loja de skins

export type SkinOffer = {
  skinId: string;
  rarity: 'common' | 'rare' | 'epic';
  /** preço de hoje em Siclos (0 = presente do dia) */
  price: number;
  gift: boolean;
  owned: boolean;
};

export type SkinMarketState = {
  siclosBalance: number;
  siclosPerGoal: number;
  prices: { common: number; rare: number; epic: number };
  days: { common: number; rare: number; epic: number };
  /** dia da semana (0 = domingo) em que a Épica da semana sai de graça */
  giftWeekday: number;
  rotation: { day: string; serverNow: string; nextAt: string };
  offers: SkinOffer[];
  owned: string[];
  purchases: { purchaseId: string; skinId: string; price: number; gift: boolean; createdAt: string }[];
  /** hora local equivalente à próxima virada (pelo intervalo do servidor) */
  offerDeadline?: number;
};

export type SkinPurchaseResult = { purchaseId: string; skinId: string; price: number; gift: boolean; siclosBalance: number; duplicate: boolean };

export async function getSkinMarket(): Promise<SkinMarketState> {
  const market = (await rpc('get_skin_market')) as SkinMarketState;
  const remaining = Date.parse(market.rotation.nextAt) - Date.parse(market.rotation.serverNow);
  return Number.isFinite(remaining) ? { ...market, offerDeadline: Date.now() + Math.max(0, remaining) } : market;
}

/** Compra (ou resgate do presente) idempotente pelo ID gerado no aparelho. */
export const purchaseSkin = async (p: PendingSkinPurchase) =>
  (await rpc('purchase_skin', { p_purchase_id: p.purchaseId, p_skin: p.skinId, p_price: p.price, p_offer_day: p.offerDay })) as SkinPurchaseResult;

/** Compra confirmada pelo jogador e ainda sem resposta do servidor (sobrevive a fechar o app). */
export type PendingSkinPurchase = { purchaseId: string; skinId: string; price: number; userId: string; offerDay: string };
const skinKey = (userId: string) => `jb.skins.pending.${userId}`;

export const pendingSkinStorage = {
  async load(userId: string): Promise<PendingSkinPurchase | null> {
    try {
      const raw = await AsyncStorage.getItem(skinKey(userId));
      const p = raw ? (JSON.parse(raw) as PendingSkinPurchase) : null;
      return p && p.userId === userId ? p : null;
    } catch {
      return null;
    }
  },
  save: (p: PendingSkinPurchase) => AsyncStorage.setItem(skinKey(p.userId), JSON.stringify(p)),
  clear: (userId: string) => AsyncStorage.removeItem(skinKey(userId)).catch(() => undefined),
};
