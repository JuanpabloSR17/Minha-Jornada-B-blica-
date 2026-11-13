import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ImageBackground, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { CinemaTheme, useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing } from '@/theme/tokens';
import { AppText, Button, Card, ConfirmDialog, Notice, Screen } from '@/ui';
import { fmt, strings } from '@/i18n';
import { errorCode, errorMessage } from '@/lib/errors';
import { useAuth } from '@/features/auth/AuthProvider';
import { StepHeader } from '@/features/avatar/components/StepHeader';
import { ItemIcon } from '@/features/avatar/components/ItemIcon';
import { RARITY_COLOR } from '@/features/avatar/components/RarityBadge';
import { displayName, displayNameOf, getItem } from '@/features/avatar/domain/catalog';
import { INVENTORY_CATEGORIES } from '@/features/avatar/domain/wardrobe';
import { uuidv4 } from '@/features/reading/mission/session';
import { getMarket, pendingPurchaseStorage, purchaseItem, type MarketItem, type MarketState, type PendingPurchase } from './market.service';

const m = strings.market;
const marketArt = require('../../../assets/journey/market.webp');
type Msg = { tone: 'success' | 'error' | 'info'; text: string; itemId?: string };

/**
 * Mercado dos Viajantes: itens que o catálogo marca para a loja, com preço em Siclos.
 * O servidor confere disponibilidade, preço, posse e saldo na hora da compra; a compra é
 * idempotente pelo ID gerado aqui, guardado até a resposta chegar.
 */
export function MarketScreen() {
  return <CinemaTheme><MarketContent /></CinemaTheme>;
}

function MarketContent() {
  const { colors } = useTheme();
  const router = useRouter();
  const { userId } = useAuth();
  const [market, setMarket] = useState<MarketState | null>(null);
  const [pending, setPending] = useState<PendingPurchase | null>(null);
  const [confirm, setConfirm] = useState<MarketItem | null>(null);
  // conteúdo do diálogo (item e saldo do momento em que foi aberto) continua igual durante a
  // animação de fechar, mesmo que o saldo mude com a resposta do servidor
  const [shown, setShown] = useState<{ item: MarketItem; balance: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg | null>(null);

  const load = useCallback(async () => {
    try {
      setMarket(await getMarket());
    } catch (e) {
      setMsg({ tone: 'error', text: errorMessage(e) });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
      if (userId) {
        void pendingPurchaseStorage.load(userId).then((p) => {
          setPending(p);
          // compra que ficou sem resposta: verifica sozinha ao abrir (mesmo ID, sem cobrança dupla),
          // para a tela não mostrar "aguardando" e "Obtido" ao mesmo tempo
          if (p) autoVerify.current = p;
        });
      }
    }, [load, userId]),
  );
  const autoVerify = useRef<PendingPurchase | null>(null);
  useEffect(() => {
    const p = autoVerify.current;
    if (p && pending?.purchaseId === p.purchaseId && !busy) {
      autoVerify.current = null;
      void send(p);
    }
  });

  const name = displayNameOf;

  /** Envia (ou reenvia) a compra pendente e trata o resultado. */
  const send = async (p: PendingPurchase) => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await purchaseItem(p.purchaseId, p.itemId);
      await pendingPurchaseStorage.clear(p.userId);
      setPending(null);
      setMsg({ tone: 'success', itemId: r.itemId, text: fmt(r.duplicate ? m.alreadyBought : m.bought, { item: name(r.itemId), balance: r.siclosBalance }) });
    } catch (e) {
      const code = errorCode(e);
      if (code === 'offline') {
        // a compra fica guardada: o jogador pode verificar depois sem risco de cobrança dupla
        setPending(p);
        setMsg({ tone: 'error', text: errorMessage(e) });
        // a resposta se perdeu: o registro das compras da conta diz o estado real desta compra
        try {
          const fresh = await getMarket();
          setMarket(fresh);
          const record = fresh.purchases.find((x) => x.purchaseId === p.purchaseId);
          if (record) {
            // só confirma se ESTA compra (mesmo ID) foi registrada
            await pendingPurchaseStorage.clear(p.userId);
            setPending(null);
            setMsg({ tone: 'success', itemId: p.itemId, text: fmt(m.confirmedOffline, { item: name(p.itemId) }) });
          } else if (fresh.items.find((x) => x.itemId === p.itemId)?.owned) {
            // o item chegou por outra via (escolha gratuita, outro aparelho): esta compra não existe e nada foi cobrado
            await pendingPurchaseStorage.clear(p.userId);
            setPending(null);
            setMsg({ tone: 'info', itemId: p.itemId, text: fmt(m.ownedNotPurchased, { item: name(p.itemId) }) });
          }
        } catch {
          /* sem conexão também para a vitrine: continua pendente */
        }
      } else {
        await pendingPurchaseStorage.clear(p.userId);
        setPending(null);
        setMsg({ tone: code === 'item_already_owned' ? 'info' : 'error', text: code === 'item_already_owned' ? fmt(m.ownedNotPurchased, { item: name(p.itemId) }) : errorMessage(e) });
      }
    } finally {
      setBusy(false);
      void load();
    }
  };

  /** Antes de confirmar, atualiza a vitrine: o item pode ter sido obtido pela escolha gratuita. */
  const ask = async (it: MarketItem) => {
    setMsg(null);
    try {
      const fresh = await getMarket();
      setMarket(fresh);
      const now = fresh.items.find((x) => x.itemId === it.itemId);
      if (now?.owned) {
        setMsg({ tone: 'info', text: fmt(m.alreadyOwned, { item: name(it.itemId) }) });
        return;
      }
      setShown({ item: now ?? it, balance: fresh.siclosBalance });
      setConfirm(now ?? it);
    } catch (e) {
      setMsg({ tone: 'error', text: errorMessage(e) });
    }
  };

  const buy = async () => {
    const it = confirm;
    setConfirm(null);
    if (!it || !userId || it.price == null) return;
    const p: PendingPurchase = { purchaseId: uuidv4(), itemId: it.itemId, price: it.price, userId };
    await pendingPurchaseStorage.save(p).catch(() => undefined);
    setPending(p);
    await send(p);
  };

  if (!market) {
    return (
      <Screen>
        <StepHeader title={m.title} onBack={() => router.back()} />
        {msg ? <Notice tone={msg.tone}>{msg.text}</Notice> : <ActivityIndicator color={colors.primary} />}
      </Screen>
    );
  }

  const balance = market.siclosBalance;
  const confirmItem = shown ? getItem(shown.item.itemId) : null;

  return (
    <Screen>
      <StepHeader title={m.title} onBack={() => router.back()} />
      <ImageBackground source={marketArt} resizeMode="cover" testID="market-banner"
        style={[styles.banner, { borderColor: colors.borderStrong }]}>
        <View style={styles.bannerText}>
          <AppText variant="heading" style={styles.balance} color={colors.primary}>{fmt(m.balance, { balance })}</AppText>
          <AppText variant="caption" muted>{m.intro}</AppText>
        </View>
      </ImageBackground>

      {busy && pending ? <ActivityIndicator color={colors.primary} /> : null}
      {pending && !busy ? (
        <Card style={{ borderColor: colors.danger }}>
          <AppText variant="heading">{m.pendingTitle}</AppText>
          <AppText muted>{fmt(m.pendingBody, { item: name(pending.itemId), price: pending.price })}</AppText>
          <Button title={m.pendingCheck} loading={busy} onPress={() => void send(pending)} />
          <Button variant="ghost" title={m.pendingDiscard} disabled={busy}
            onPress={() => { void pendingPurchaseStorage.clear(pending.userId); setPending(null); void load(); }} />
        </Card>
      ) : null}

      {msg ? <Notice tone={msg.tone}>{msg.text}</Notice> : null}
      {msg?.itemId ? <Button variant="secondary" title={m.seeItem} onPress={() => router.push({ pathname: '/avatar/item/[id]', params: { id: msg.itemId! } })} /> : null}
      {market.items.length === 0 ? <Notice tone="info">{m.empty}</Notice> : null}

      {market.items.map((it) => {
        const item = getItem(it.itemId);
        if (!item) return null;
        const category = INVENTORY_CATEGORIES.find((c) => c.slot === item.slot)?.label ?? item.category;
        const short = it.price != null ? it.price - balance : 0;
        return (
          <View key={it.itemId} style={[styles.row, { borderColor: RARITY_COLOR[item.rarity], backgroundColor: colors.surface }]}
            accessible={false} testID={`market-${it.itemId}`}>
            <View style={[styles.icon, { backgroundColor: colors.stage }]}>
              <ItemIcon item={item} size={60} />
            </View>
            <View style={styles.info}>
              <AppText variant="label">{displayName(item)}</AppText>
              <AppText variant="caption" color={RARITY_COLOR[item.rarity]}>{strings.rarity[item.rarity]} · {category}</AppText>
              <AppText variant="label">{it.price != null ? fmt(m.price, { price: it.price }) : m.pricePending}</AppText>
              {it.owned ? (
                <AppText variant="caption" color={colors.success}>{m.owned}</AppText>
              ) : it.status === 'price_pending' ? (
                <AppText variant="caption" muted>{m.pricePending}</AppText>
              ) : short > 0 ? (
                <AppText variant="caption" muted>{fmt(m.missing, { n: short })}</AppText>
              ) : (
                <Button compact title={m.buy} accessibilityLabel={`${m.buy} ${item.name}`} variant="gold"
                  disabled={busy || !!pending} onPress={() => void ask(it)} />
              )}
            </View>
          </View>
        );
      })}

      <ConfirmDialog
        visible={!!confirm}
        title={m.confirmTitle}
        body={shown && confirmItem && shown.item.price != null
          ? fmt(m.confirmBody, { item: confirmItem.name, rarity: strings.rarity[confirmItem.rarity], price: shown.item.price, balance: shown.balance, after: shown.balance - shown.item.price })
          : ''}
        confirmLabel={fmt(m.confirm, { price: shown?.item.price ?? 0 })}
        onConfirm={() => void buy()}
        onCancel={() => setConfirm(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: { minHeight: 180, justifyContent: 'flex-end', borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden' },
  bannerText: { backgroundColor: 'rgba(12, 10, 22, 0.9)', padding: spacing.md, gap: spacing.xs },
  balance: { fontFamily: fonts.display },
  row: { flexDirection: 'row', gap: spacing.md, borderWidth: 1, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center' },
  icon: { width: 64, height: 64, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, minWidth: 0, gap: 2 },
});
