import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Drag } from './CardStack';
import { colors } from '../theme';

/** Kleurt het hele scherm mee tijdens het swipen: rood = wissen, groen = behouden, blauw = later. */
export function SwipeTint({ drag }: { drag: Drag }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const range = width * 0.35;

  const keep = useAnimatedStyle(() => ({
    opacity: interpolate(drag.x.value, [0, range], [0, 0.55], Extrapolation.CLAMP),
  }));
  const trash = useAnimatedStyle(() => ({
    opacity: interpolate(drag.x.value, [0, -range], [0, 0.55], Extrapolation.CLAMP),
  }));
  const later = useAnimatedStyle(() => ({
    opacity:
      interpolate(-drag.y.value, [0, height * 0.15], [0, 0.45], Extrapolation.CLAMP) *
      interpolate(Math.abs(drag.x.value), [0, range], [1, 0], Extrapolation.CLAMP),
  }));

  const box = { top: -insets.top, bottom: -insets.bottom, left: 0, right: 0 };
  return (
    <View style={[styles.wrap, box]} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.keep }, keep]} />
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.trash }, trash]} />
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.later }, later]} />
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { position: 'absolute' } });
