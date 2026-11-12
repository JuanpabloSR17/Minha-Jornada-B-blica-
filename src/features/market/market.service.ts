import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireSupabase } from '@/lib/supabase/client';
import { throwIfError } from '@/lib/errors';

export type MarketItem = {
  itemId: string;
  /** preço em Siclos (catálogo oficial); null = preço ainda não definido */
  price: number | null;
  status: 'available' | 'price_pending';
  /** posse pela identidade canônica (inclui posse registrada com ID antigo) */
  owned: boolean;
};

export type MarketState = {
  siclosBalance: number;
  items: MarketItem[];
  purchases: { purchaseId: string; itemId: string; price: number; createdAt: string }[];
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

export const getMarket = async () => (await rpc('get_market')) as MarketState;

/** Compra idempotente pelo ID da compra (gerado no aparelho). */
export const purchaseItem = async (purchaseId: string, itemId: string) =>
  (await rpc('purchase_market_item', { p_purchase_id: purchaseId, p_item: itemId })) as PurchaseResult;

/** Compra confirmada pelo jogador e ainda sem resposta do servidor (sobrevive a fechar o app). */
export type PendingPurchase = { purchaseId: string; itemId: string; price: number; userId: string };
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
