import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { formatNumber } from '../format';
import { colors } from '../theme';

type Props = {
  reviewed: number;
  total: number;
  trashCount: number;
  onOpenTrash: () => void;
  onOpenSettings: () => void;
};

export function Header({ reviewed, total, trashCount, onOpenTrash, onOpenSettings }: Props) {
  const pct = total > 0 ? Math.min(1, reviewed / total) : 0;
  const progress = useSharedValue(pct);
  useEffect(() => {
    progress.value = withSpring(pct, { damping: 20 });
  }, [pct, progress]);
  const bar = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable onPress={onOpenSettings} hitSlop={12} style={styles.iconBtn} accessibilityLabel="Instellingen">
          <Ionicons name="settings-outline" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.center}>
          <Text style={styles.count}>
            {formatNumber(reviewed)} <Text style={styles.dim}>/ {formatNumber(total)}</Text>
          </Text>
          <Text style={styles.label}>bekeken</Text>
        </View>
        <Pressable onPress={onOpenTrash} hitSlop={12} style={styles.iconBtn} accessibilityLabel="Prullenbak">
          <Ionicons name="trash-outline" size={22} color={colors.text} />
          {trashCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{trashCount > 999 ? '999+' : trashCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, bar]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  center: { alignItems: 'center' },
  count: { color: colors.text, fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
  dim: { color: colors.textDim, fontWeight: '600' },
  label: { color: colors.textDim, fontSize: 12, marginTop: 1 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: colors.trash,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.surface, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2, backgroundColor: colors.keep },
});
