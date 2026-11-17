import { useEffect } from 'react';
import { Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { formatBytes, formatNumber } from '../format';
import { brightGradient } from '../theme';

type Props = {
  result: { count: number; bytes: number } | null;
  totalBytes: number;
  totalCount: number;
  onClose: () => void;
};

function splitBytes(bytes: number): [string, string] {
  const [num, unit] = formatBytes(bytes).split(' ');
  return [num, unit ?? ''];
}

export function Celebration({ result, totalBytes, totalCount, onClose }: Props) {
  const ring = useSharedValue(0.5);
  const fade = useSharedValue(0);

  useEffect(() => {
    if (!result) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    ring.set(0.5);
    ring.set(withSpring(1, { damping: 10, stiffness: 120 }));
    fade.set(0);
    fade.set(withDelay(200, withSpring(1)));
  }, [result, ring, fade]);

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: ring.value }] }));
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  const showBytes = totalBytes > 0;
  const [num, unit] = showBytes ? splitBytes(totalBytes) : [formatNumber(totalCount), totalCount === 1 ? 'item' : 'items'];
  const just = result ? (result.bytes > 0 ? formatBytes(result.bytes) : `${formatNumber(result.count)} items`) : '';

  const share = () => {
    Share.share({
      message: showBytes
        ? `Ik heb al ${formatBytes(totalBytes)} vrijgemaakt op mijn iPhone met Swipe Clean 🧹📸`
        : `Ik heb al ${formatNumber(totalCount)} foto's opgeruimd met Swipe Clean 🧹📸`,
    }).catch(() => {});
  };

  return (
    <Modal visible={!!result} animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
      <LinearGradient colors={brightGradient} style={styles.flex}>
        <SafeAreaView style={styles.root}>
          <View style={styles.top}>
            <Text style={styles.title}>Lekker bezig!</Text>
            <Text style={styles.sub}>Je hebt net {just} vrijgemaakt.</Text>
          </View>

          <Animated.View style={[styles.ring, ringStyle]}>
            <View style={styles.ringInner}>
              <Text style={styles.num} adjustsFontSizeToFit numberOfLines={1}>
                {num}
              </Text>
              <Text style={styles.unit}>{unit}</Text>
              <Text style={styles.caption}>totaal vrijgemaakt</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.bottom, fadeStyle]}>
            <Pressable style={styles.share} onPress={share}>
              <Ionicons name="share-outline" size={20} color="#fff" />
              <Text style={styles.shareText}>Deel je resultaat</Text>
            </Pressable>
            <Pressable style={styles.primary} onPress={onClose}>
              <Text style={styles.primaryText}>Doorgaan</Text>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

const RING = 250;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'space-between' },
  top: { alignItems: 'center', gap: 6, marginTop: 24 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900' },
  sub: { color: 'rgba(255,255,255,0.85)', fontSize: 16 },
  ring: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 10,
    borderColor: 'rgba(255,255,255,0.9)',
    padding: 10,
    shadowColor: '#fff',
    shadowOpacity: 0.5,
    shadowRadius: 24,
  },
  ringInner: {
    flex: 1,
    borderRadius: RING / 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  num: { color: '#fff', fontSize: 72, fontWeight: '900', fontVariant: ['tabular-nums'] },
  unit: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: -6 },
  caption: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 6 },
  bottom: { alignSelf: 'stretch', gap: 12 },
  share: {
    flexDirection: 'row',
    gap: 8,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  shareText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  primary: { height: 56, borderRadius: 28, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#3B2FB8', fontSize: 17, fontWeight: '800' },
});
