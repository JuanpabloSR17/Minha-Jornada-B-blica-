import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fonts, radius, spacing } from '@/theme/tokens';
import { AppText, Button, Icon } from '@/ui';
import { fmt, strings } from '@/i18n';
import { FirelightPortrait } from '@/features/avatar/styles/cinematic';
import { wearFrom } from '@/features/avatar/styles/archetypes';
import { SKIN_RARITY_COLOR, SKIN_RARITY_LABEL, getSkin, styleLook } from './catalog';
import { equipSkin, getMySkins, seenReadingSkins } from './skins.service';

const v = strings.vestiario;

/**
 * Comemora as skins que a leitura acabou de conquistar (Lendárias e Gloriosas). O servidor concede;
 * aqui só se mostra, uma vez por aparelho, com o atalho para vestir.
 */
export function NewSkinCelebration({ userId, refreshKey }: { userId: string | null; refreshKey?: string }) {
  const router = useRouter();
  const [ids, setIds] = useState<string[]>([]);
  const [worn, setWorn] = useState<string | null>(null);
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    Promise.all([getMySkins(), seenReadingSkins.get(userId)]).then(([mine, seen]) => {
      const fresh = mine.owned.filter((o) => o.source === 'skin-reading' && !seen.has(o.skinId)).map((o) => o.skinId);
      if (!alive || !fresh.length) return;
      setIds(fresh);
      void seenReadingSkins.add(userId, fresh);
    }, () => undefined);
    return () => { alive = false; };
  }, [userId, refreshKey]);

  return (
    <>
      {ids.map((id) => {
        const skin = getSkin(id);
        if (!skin) return null;
        const color = SKIN_RARITY_COLOR[skin.rarity];
        return (
          <View key={id} style={[styles.card, { borderColor: color }]} testID={`new-skin-${id}`} accessibilityRole="alert">
            <View style={[styles.art, { borderColor: color }]}>
              <FirelightPortrait look={styleLook(skin.styles[0]!)} wear={wearFrom(skin.preview)} width={104} />
            </View>
            <View style={styles.text}>
              <View style={styles.badge}>
                <Icon name="sparkle" color={color} size={16} />
                <AppText style={styles.rarity} color={color}>{SKIN_RARITY_LABEL[skin.rarity]}</AppText>
              </View>
              <AppText style={styles.title} color="#F6ECD6">{v.newTitle}</AppText>
              <AppText variant="caption" color="#C9BBA0">{fmt(v.newBody, { skin: skin.name })}</AppText>
              {worn === id ? (
                <AppText variant="label" color={color}>{fmt(v.wearing, { skin: skin.name, n: 1 })}</AppText>
              ) : (
                <Button compact variant="gold" icon="outfit" title={v.wearNow}
                  onPress={() => void equipSkin(id, 1).then(() => setWorn(id), () => router.push('/vestiario'))} />
              )}
              <Button compact variant="ghost" title={v.openVestiario} onPress={() => router.push('/vestiario')} />
            </View>
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 2, backgroundColor: '#1B1631' },
  art: { width: 104, height: 120, borderRadius: radius.md, borderWidth: 1, overflow: 'hidden', alignItems: 'center', backgroundColor: '#120E1C' },
  text: { flex: 1, minWidth: 0, gap: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rarity: { fontFamily: fonts.display, fontSize: 13, lineHeight: 17 },
  title: { fontFamily: fonts.display, fontSize: 19, lineHeight: 24 },
});
