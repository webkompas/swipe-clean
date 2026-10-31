import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { colors } from '../theme';

export type ToastData = { key: number; text: string; action?: { label: string; onPress: () => void } };

export function Toast({ toast, onHide }: { toast: ToastData | null; onHide: () => void }) {
  const y = useSharedValue(120);

  useEffect(() => {
    if (!toast) {
      y.value = withTiming(120, { duration: 180 });
      return;
    }
    y.value = withSpring(0, { damping: 16 });
    const t = setTimeout(onHide, 4000);
    return () => clearTimeout(t);
  }, [toast, y, onHide]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }], opacity: y.value > 100 ? 0 : 1 }));

  return (
    <Animated.View style={[styles.toast, style]} pointerEvents={toast ? 'auto' : 'none'}>
      <Text style={styles.text}>{toast?.text}</Text>
      {toast?.action ? (
        <Pressable
          hitSlop={10}
          onPress={() => {
            toast.action?.onPress();
            onHide();
          }}
        >
          <Text style={styles.action}>{toast.action.label}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 110,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  text: { flex: 1, color: colors.text, fontSize: 14 },
  action: { color: colors.accent, fontSize: 14, fontWeight: '800' },
});
