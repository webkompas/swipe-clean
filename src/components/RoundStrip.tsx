import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { imageSource } from '../library';
import { colors } from '../theme';
import type { SwipeAction } from '../useDeck';

export type RoundEntry = { id: string; action: SwipeAction };

type Props = { done: RoundEntry[]; upcoming: string[]; size: number };

const ICON: Record<SwipeAction, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  keep: { name: 'checkmark', color: colors.keep },
  trash: { name: 'trash', color: colors.trash },
  later: { name: 'time', color: colors.later },
};

/** Fotostrip van de huidige ronde: gedaan · huidig · komend, met "3 van 10". */
export const RoundStrip = memo(function RoundStrip({ done, upcoming, size }: Props) {
  const total = Math.min(size, done.length + upcoming.length);
  if (total === 0) return null;
  const current = upcoming[0];
  const rest = upcoming.slice(1, total - done.length);
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {done.map((e, i) => (
          <View key={`${e.id}-${i}`} style={styles.thumb}>
            <Image source={imageSource(e.id)} style={[StyleSheet.absoluteFill, styles.dim]} contentFit="cover" cachePolicy="memory" />
            <View style={[styles.badge, { backgroundColor: ICON[e.action].color }]}>
              <Ionicons name={ICON[e.action].name} size={9} color="#fff" />
            </View>
          </View>
        ))}
        {current ? (
          <View style={[styles.thumb, styles.current]}>
            <Image source={imageSource(current)} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory" />
          </View>
        ) : null}
        {rest.map((id) => (
          <View key={id} style={styles.thumb}>
            <Image source={imageSource(id)} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory" />
          </View>
        ))}
      </View>
      <Text style={styles.label}>
        {Math.min(done.length + 1, total)} VAN {total}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6, paddingTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  thumb: { width: 26, height: 34, borderRadius: 6, overflow: 'hidden', backgroundColor: colors.surface },
  current: { width: 32, height: 42, borderRadius: 8, borderWidth: 2, borderColor: colors.text },
  dim: { opacity: 0.45 },
  badge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 13,
    height: 13,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: colors.textDim, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
});
