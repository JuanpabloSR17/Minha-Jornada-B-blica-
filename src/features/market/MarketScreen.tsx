import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { CinemaTheme, useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing } from '@/theme/tokens';
import { AppText, Button, Card, ConfirmDialog, Notice, Screen } from '@/ui';
import { fmt, strings } from '@/i18n';
import { errorCode, errorMessage } from '@/lib/errors';
import { useAuth } from '@/features/auth/AuthProvider';
import { StepHeader } from '@/features/avatar/components/StepHeader';
import { RARITY_COLOR } from '@/features/avatar/components/RarityBadge';
import { uuidv4 } from '@/features/reading/mission/session';
import { FirelightPortrait } from '@/features/avatar/styles/cinematic';
import { wearFrom } from '@/features/avatar/styles/archetypes';
import { getSkin, skinToneColor, styleLook } from '@/features/skins/catalog';
import { getSkinMarket, pendingSkinStorage, purchaseSkin, type PendingSkinPurchase, type SkinMarketState, type SkinOffer } from './market.service';

const m = strings.market;
const marketArt = require('../../../assets/journey/market.webp');
const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
type Msg = { tone: 'success' | 'error' | 'info'; text: string };
const nameOf = (id: string) => getSkin(id)?.name ?? id;
/** milhar com ponto, como no Brasil (1.000) */
const n = (v: number) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

function RotationCountdown({ deadline }: { deadline: number }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [deadline]);
  const minutes = Math.max(0, Math.ceil((deadline - now) / 60_000));
  const time = `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}min`;
  return <AppText variant="caption" testID="market-refresh">{minutes ? fmt(m.remaining, { time }) : m.updating}</AppText>;
}

/** Seletor dos 3 estilos da skin (cores, rosto e cabelo), pelo tom de pele de cada um. */
function StylePicker({ skinId, value, onChange }: { skinId: string; value: number; onChange: (i: number) => void }) {
  const skin = getSkin(skinId);
  if (!skin) return null;
  return (
    <View style={styles.styles} accessibilityRole="radiogroup" accessibilityLabel={m.styles}>
      {skin.styles.map((st, i) => (
        <Pressable key={i} accessibilityRole="radio" accessibilityState={{ checked: i === value }} aria-checked={i === value}
          accessibilityLabel={fmt(m.styleLabel, { n: i + 1, skin: skin.name })}
          onPress={() => onChange(i)} hitSlop={8}
          style={[styles.styleDot, { backgroundColor: skinToneColor(st), borderColor: i === value ? '#E9BA5B' : 'rgba(246,236,214,0.35)' }]} />
      ))}
    </View>
  );
}

/**
 * Mercado dos Viajantes, só com skins. Preço justo em dias de leitura (Comum 4, Rara 10, Épica 25
 * dias de meta); a Épica da semana sai de graça no dia de presente. O servidor confere vitrine,
 * preço, posse e saldo; a compra é idempotente pelo ID gerado aqui, guardado até a resposta chegar.
 */
export function MarketScreen() {
  return <CinemaTheme><MarketContent /></CinemaTheme>;
}

function MarketContent() {
  const { colors } = useTheme();
  const router = useRouter();
  const { userId } = useAuth();
  const [market, setMarket] = useState<SkinMarketState | null>(null);
  const [pending, setPending] = useState<PendingSkinPurchase | null>(null);
  const [confirm, setConfirm] = useState<{ offer: SkinOffer; balance: number; offerDay: string } | null>(null);
  const [shown, setShown] = useState<{ offer: SkinOffer; balance: number; offerDay: string } | null>(null);
  const [style, setStyle] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requested = useRef(0);
  const purchasing = useRef(false);
  const autoVerify = useRef<PendingSkinPurchase | null>(null);

  const refresh = useCallback(async () => {
    const request = ++requested.current;
    try {
      const state = await getSkinMarket();
      if (request === requested.current) {
        setMarket(state);
        setLoadError(null);
      }
      return state;
    } catch (e) {
      if (request === requested.current) setLoadError(errorMessage(e));
      throw e;
    }
  }, []);
  const load = useCallback(async () => {
    try {
      await refresh();
    } catch { /* a última vitrine continua na tela com a opção de tentar de novo */ }
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void load();
      const resume = AppState.addEventListener('change', (state) => {
        if (state === 'active') void load();
      });
      if (userId) {
        void pendingSkinStorage.load(userId).then((p) => {
          if (!active || purchasing.current) return;
          // compra que ficou sem resposta: verifica sozinha ao abrir (mesmo ID, sem cobrança dupla)
          autoVerify.current = p;
          setPending(p);
        });
      }
      return () => {
        active = false;
        resume.remove();
      };
    }, [load, userId]),
  );
  const deadline = market?.offerDeadline;
  useFocusEffect(useCallback(() => {
    if (deadline == null) return;
    const timer = setTimeout(() => void load(), Math.max(250, deadline - Date.now() + 250));
    return () => clearTimeout(timer);
  }, [deadline, load]));
  useEffect(() => {
    const p = autoVerify.current;
    if (p && pending?.purchaseId === p.purchaseId && !busy) {
      autoVerify.current = null;
      void send(p);
    }
  });

  /** Envia (ou reenvia) a compra pendente e trata o resultado. */
  const send = async (p: PendingSkinPurchase) => {
    if (purchasing.current) return;
    purchasing.current = true;
    setBusy(true);
    setMsg(null);
    try {
      const r = await purchaseSkin(p);
      await pendingSkinStorage.clear(p.userId);
      setPending(null);
      setMsg({ tone: 'success', text: fmt(r.duplicate ? m.alreadyBought : m.bought, { item: nameOf(r.skinId), balance: n(r.siclosBalance) }) });
    } catch (e) {
      const code = errorCode(e);
      if (code === 'offline') {
        setPending(p);
        setMsg({ tone: 'error', text: errorMessage(e) });
        // a resposta se perdeu: o registro de compras da conta diz o estado real desta compra
        try {
          const fresh = await refresh();
          if (fresh.purchases.some((x) => x.purchaseId === p.purchaseId)) {
            await pendingSkinStorage.clear(p.userId);
            setPending(null);
            setMsg({ tone: 'success', text: fmt(m.confirmedOffline, { item: nameOf(p.skinId) }) });
          } else if (fresh.owned.includes(p.skinId)) {
            await pendingSkinStorage.clear(p.userId);
            setPending(null);
            setMsg({ tone: 'info', text: fmt(m.ownedNotPurchased, { item: nameOf(p.skinId) }) });
          }
        } catch { /* sem conexão também para a vitrine: continua pendente */ }
      } else {
        await pendingSkinStorage.clear(p.userId);
        setPending(null);
        setMsg(code === 'skin_already_owned'
          ? { tone: 'info', text: fmt(m.ownedNotPurchased, { item: nameOf(p.skinId) }) }
          : { tone: 'error', text: errorMessage(e) });
      }
    } finally {
      purchasing.current = false;
      setBusy(false);
      void load();
    }
  };

  /** Antes de confirmar, atualiza a vitrine: a skin pode ter chegado por outra via ou a oferta virado. */
  const ask = async (offer: SkinOffer) => {
    setMsg(null);
    try {
      const fresh = await refresh();
      const now = fresh.offers.find((x) => x.skinId === offer.skinId);
      if (fresh.owned.includes(offer.skinId) || now?.owned) {
        setMsg({ tone: 'info', text: fmt(m.alreadyOwned, { item: nameOf(offer.skinId) }) });
        return;
      }
      if (!now) {
        setMsg({ tone: 'info', text: strings.errors.market_offer_expired });
        return;
      }
      if (fresh.siclosBalance < now.price) {
        setMsg({ tone: 'info', text: strings.errors.insufficient_siclos });
        return;
      }
      const c = { offer: now, balance: fresh.siclosBalance, offerDay: fresh.rotation.day };
      setShown(c);
      setConfirm(c);
    } catch (e) {
      setMsg({ tone: 'error', text: errorMessage(e) });
    }
  };

  const buy = async () => {
    const c = confirm;
    setConfirm(null);
    if (!c || !userId || purchasing.current || pending) return;
    const p: PendingSkinPurchase = { purchaseId: uuidv4(), skinId: c.offer.skinId, price: c.offer.price, userId, offerDay: c.offerDay };
    purchasing.current = true;
    setBusy(true);
    await pendingSkinStorage.save(p).catch(() => undefined);
    setPending(p);
    purchasing.current = false;
    await send(p);
  };

  if (!market) {
    return (
      <Screen>
        <StepHeader title={m.title} onBack={() => router.back()} />
        {loadError ? (
          <>
            <Notice tone="error">{loadError}</Notice>
            <Button title={strings.common.retry} onPress={() => void load()} />
          </>
        ) : <ActivityIndicator color={colors.primary} />}
      </Screen>
    );
  }

  const balance = market.siclosBalance;
  const epic = market.offers.find((o) => o.rarity === 'epic');
  const rares = market.offers.filter((o) => o.rarity === 'rare');
  const commons = market.offers.filter((o) => o.rarity === 'common');

  function action(o: SkinOffer, name: string) {
    if (o.owned) return <AppText variant="label" color={colors.success}>{m.owned}</AppText>;
    const short = o.price - balance;
    if (short > 0) return <AppText variant="caption" muted>{fmt(m.missing, { n: n(short) })}</AppText>;
    return (
      <Button compact variant="gold" title={o.gift ? m.claim : m.buy}
        accessibilityLabel={`${o.gift ? m.claim : m.buy} ${name}`}
        disabled={busy || !!pending} onPress={() => void ask(o)} />
    );
  }

  function card(o: SkinOffer, big = false) {
    const skin = getSkin(o.skinId);
    if (!skin) return null;
    const idx = style[o.skinId] ?? 0;
    const look = styleLook(skin.styles[idx] ?? skin.styles[0]!);
    const color = RARITY_COLOR[o.rarity];
    const days = market!.days[o.rarity];
    return (
      <View key={o.skinId} testID={`market-${o.skinId}`} accessible={false}
        style={[big ? styles.featured : styles.card, { borderColor: color, backgroundColor: colors.surface }]}>
        <View style={[styles.portrait, { borderColor: color }]}>
          <FirelightPortrait look={look} wear={wearFrom(skin.preview)} width={big ? 168 : 112} />
        </View>
        <View style={styles.info}>
          <AppText variant="label" style={styles.name}>{skin.name}</AppText>
          <AppText variant="caption" color={color} style={styles.rarity}>{strings.rarity[o.rarity]} · {skin.scriptureRef}</AppText>
          <StylePicker skinId={o.skinId} value={idx} onChange={(i) => setStyle((s) => ({ ...s, [o.skinId]: i }))} />
          <View style={styles.priceRow}>
            {o.gift ? (
              <>
                <AppText variant="label" color={colors.primary}>{m.free}</AppText>
                <AppText variant="caption" muted style={styles.strike}>{fmt(m.price, { price: n(market!.prices.epic) })}</AppText>
              </>
            ) : (
              <>
                <AppText variant="label" color={colors.primary}>{fmt(m.price, { price: n(o.price) })}</AppText>
                <AppText variant="caption" muted>{fmt(m.days, { n: days })}</AppText>
              </>
            )}
          </View>
          {action(o, skin.name)}
        </View>
      </View>
    );
  }

  const shownSkin = shown ? getSkin(shown.offer.skinId) : null;

  return (
    <Screen>
      <StepHeader title={m.title} onBack={() => router.back()} />
      <ImageBackground source={marketArt} resizeMode="cover" testID="market-banner"
        style={[styles.banner, { borderColor: colors.borderStrong }]}>
        <View style={styles.bannerText}>
          <AppText variant="heading" style={styles.balance} color={colors.primary}>{fmt(m.balance, { balance: n(balance) })}</AppText>
          <AppText variant="caption" muted>{m.intro}</AppText>
        </View>
      </ImageBackground>

      <Card style={{ borderColor: colors.borderStrong }} testID="market-fair">
        <AppText variant="heading">{m.fairTitle}</AppText>
        <AppText variant="caption" muted>
          {fmt(m.fairBody, {
            perGoal: market.siclosPerGoal, common: market.days.common, rare: market.days.rare, epic: market.days.epic,
            commonPrice: n(market.prices.common), rarePrice: n(market.prices.rare), epicPrice: n(market.prices.epic),
          })}
        </AppText>
      </Card>

      {busy && pending ? <ActivityIndicator color={colors.primary} /> : null}
      {pending && !busy ? (
        <Card style={{ borderColor: colors.danger }}>
          <AppText variant="heading">{m.pendingTitle}</AppText>
          <AppText muted>{fmt(m.pendingBody, { item: nameOf(pending.skinId), price: n(pending.price) })}</AppText>
          <Button title={m.pendingCheck} loading={busy} onPress={() => void send(pending)} />
          <Button variant="ghost" title={m.pendingDiscard} disabled={busy}
            onPress={() => { void pendingSkinStorage.clear(pending.userId); setPending(null); void load(); }} />
        </Card>
      ) : null}
      {msg ? <Notice tone={msg.tone}>{msg.text}</Notice> : null}
      {loadError ? (
        <Card>
          <Notice tone="error">{loadError}</Notice>
          <Button compact title={strings.common.retry} onPress={() => void load()} />
        </Card>
      ) : null}
      {market.offers.length === 0 ? <Notice tone="info">{m.empty}</Notice> : null}

      <View style={styles.schedule}>
        <AppText variant="caption" muted>{m.rotationTime}</AppText>
        {deadline != null ? <RotationCountdown deadline={deadline} /> : null}
      </View>

      {epic ? (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <AppText variant="heading" accessibilityRole="header">{m.weekly}</AppText>
            <View style={[styles.badge, { backgroundColor: epic.gift ? colors.primary : 'transparent', borderColor: colors.primary }]}>
              <AppText variant="caption" color={epic.gift ? '#241606' : colors.primary} style={styles.badgeText}>
                {epic.gift ? m.gift : fmt(m.giftDay, { day: WEEKDAYS[market.giftWeekday] ?? '' })}
              </AppText>
            </View>
          </View>
          {card(epic, true)}
        </View>
      ) : null}
      {rares.length ? (
        <View style={styles.section}>
          <AppText variant="heading" accessibilityRole="header">{m.rares}</AppText>
          {rares.map((o) => card(o))}
        </View>
      ) : null}
      {commons.length ? (
        <View style={styles.section}>
          <AppText variant="heading" accessibilityRole="header">{m.commons}</AppText>
          {commons.map((o) => card(o))}
        </View>
      ) : null}
      <AppText variant="caption" muted>{m.previewNote}</AppText>

      <ConfirmDialog
        visible={!!confirm}
        title={shown?.offer.gift ? m.confirmGiftTitle : m.confirmTitle}
        body={shown && shownSkin
          ? shown.offer.gift
            ? fmt(m.confirmGiftBody, { item: shownSkin.name, rarity: strings.rarity[shownSkin.rarity as 'epic'], balance: n(shown.balance) })
            : fmt(m.confirmBody, { item: shownSkin.name, rarity: strings.rarity[shownSkin.rarity as 'epic'], price: n(shown.offer.price), balance: n(shown.balance), after: n(shown.balance - shown.offer.price) })
          : ''}
        confirmLabel={shown?.offer.gift ? m.confirmGift : fmt(m.confirm, { price: n(shown?.offer.price ?? 0) })}
        onConfirm={() => void buy()}
        onCancel={() => setConfirm(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: { minHeight: 160, justifyContent: 'flex-end', borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden' },
  bannerText: { backgroundColor: 'rgba(12, 10, 22, 0.9)', padding: spacing.md, gap: spacing.xs },
  balance: { fontFamily: fonts.display },
  section: { gap: spacing.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, flexWrap: 'wrap' },
  schedule: { gap: 2 },
  badge: { borderWidth: 1.5, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeText: { fontWeight: '700' },
  card: { flexDirection: 'row', gap: spacing.md, borderWidth: 1.5, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center' },
  featured: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, borderWidth: 2, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center' },
  portrait: { borderWidth: 1.5, borderRadius: 8, overflow: 'hidden' },
  info: { flex: 1, minWidth: 140, gap: 4 },
  name: { fontFamily: fonts.display, fontSize: 16, lineHeight: 21 },
  rarity: { fontWeight: '700' },
  styles: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  styleDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 3 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, flexWrap: 'wrap' },
  strike: { textDecorationLine: 'line-through' },
});
