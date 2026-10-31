import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { formatBytes, formatNumber } from '../format';
import { colors } from '../theme';

type Props = {
  result: { count: number; bytes: number } | null;
  totalBytes: number;
  totalCount: number;
  onClose: () => void;
};

export function Celebration({ result, totalBytes, totalCount, onClose }: Props) {
  const scale = useSharedValue(0.6);
  const emoji = useSharedValue(0);

  useEffect(() => {
    if (!result) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    scale.value = 0.6;
    scale.value = withSpring(1, { damping: 11, stiffness: 160 });
    emoji.value = 0;
    emoji.value = withDelay(150, withSequence(withSpring(1.3, { damping: 6 }), withSpring(1)));
  }, [result, scale, emoji]);

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const emojiStyle = useAnimatedStyle(() => ({ transform: [{ scale: emoji.value }] }));

  return (
    <Modal visible={!!result} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.card, cardStyle]}>
          <Animated.Text style={[styles.emoji, emojiStyle]}>🎉</Animated.Text>
          <Text style={styles.big}>
            {result && result.bytes > 0 ? `${formatBytes(result.bytes)} vrijgemaakt` : `${formatNumber(result?.count ?? 0)} items gewist`}
          </Text>
          {result && result.bytes > 0 ? <Text style={styles.sub}>{formatNumber(result.count)} items gewist</Text> : null}
          <View style={styles.divider} />
          <Text style={styles.total}>
            Totaal opgeruimd: <Text style={styles.totalStrong}>{formatBytes(totalBytes)}</Text> · {formatNumber(totalCount)} items
          </Text>
          <View style={styles.btn}>
            <Text style={styles.btnText}>Verder swipen</Text>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', backgroundColor: colors.card, borderRadius: 28, padding: 28, alignItems: 'center', gap: 6 },
  emoji: { fontSize: 64, marginBottom: 8 },
  big: { color: colors.text, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  sub: { color: colors.textDim, fontSize: 15 },
  divider: { height: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: colors.border, marginVertical: 14 },
  total: { color: colors.textDim, fontSize: 14, textAlign: 'center' },
  totalStrong: { color: colors.keep, fontWeight: '800' },
  btn: { marginTop: 18, alignSelf: 'stretch', height: 52, borderRadius: 16, backgroundColor: colors.keep, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#04140B', fontSize: 16, fontWeight: '800' },
});
