import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

type Props = {
  canUndo: boolean;
  disabled: boolean;
  onUndo: () => void;
  onTrash: () => void;
  onLater: () => void;
  onKeep: () => void;
};

export function ActionBar({ canUndo, disabled, onUndo, onTrash, onLater, onKeep }: Props) {
  return (
    <View style={styles.row}>
      <RoundButton icon="arrow-undo" color={colors.accent} size={52} onPress={onUndo} disabled={!canUndo} label="Ongedaan maken" />
      <RoundButton icon="close" color={colors.trash} size={72} onPress={onTrash} disabled={disabled} label="Wissen" />
      <RoundButton icon="time-outline" color={colors.later} size={52} onPress={onLater} disabled={disabled} label="Later beslissen" />
      <RoundButton icon="checkmark" color={colors.keep} size={72} onPress={onKeep} disabled={disabled} label="Behouden" />
    </View>
  );
}

function RoundButton({
  icon,
  color,
  size,
  onPress,
  disabled,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  onPress: () => void;
  disabled?: boolean;
  label: string;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      onPressIn={() => scale.set(withSpring(0.88, { damping: 15, stiffness: 400 }))}
      onPressOut={() => scale.set(withSpring(1, { damping: 12, stiffness: 300 }))}
    >
      <Animated.View
        style={[
          styles.btn,
          { width: size, height: size, borderRadius: size / 2, borderColor: color + '55', opacity: disabled ? 0.35 : 1 },
          style,
        ]}
      >
        <Ionicons name={icon} size={size * 0.45} color={color} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', paddingHorizontal: 16, paddingVertical: 10 },
  btn: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1.5 },
});
