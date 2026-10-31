import { memo, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import type { AssetMetadata } from 'expo-media-library';
import { MediaView } from './MediaView';
import { getPlaceName } from '../library';
import { formatDate } from '../format';
import { colors, radius } from '../theme';
import type { SwipeAction } from '../useDeck';

export type CardStackHandle = { swipe: (action: SwipeAction) => void };

type Leaving = { key: string; id: string; action: SwipeAction; x: number; y: number; vx: number; vy: number };

type Props = {
  ids: string[];
  getMeta: (id: string) => AssetMetadata | undefined;
  onSwipe: (action: SwipeAction) => void;
  undone: { id: string; action: SwipeAction } | null;
  ref?: Ref<CardStackHandle>;
};

const VISIBLE = 3;
const SPRING = { damping: 18, stiffness: 180, mass: 0.9 };

export function CardStack({ ids, getMeta, onSwipe, undone, ref }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [leaving, setLeaving] = useState<Leaving[]>([]);

  // Stabiele callback (via refs), zodat kaarten niet bij elke swipe opnieuw renderen.
  const idsRef = useRef(ids);
  const onSwipeRef = useRef(onSwipe);
  useLayoutEffect(() => {
    idsRef.current = ids;
    onSwipeRef.current = onSwipe;
  }, [ids, onSwipe]);

  const commit = useCallback((action: SwipeAction, x: number, y: number, vx: number, vy: number) => {
    const id = idsRef.current[0];
    if (!id) return;
    Haptics.impactAsync(action === 'trash' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    setLeaving((l) => [...l, { key: `${id}-${Date.now()}`, id, action, x, y, vx, vy }]);
    onSwipeRef.current(action);
  }, []);

  useImperativeHandle(ref, () => ({ swipe: (action) => commit(action, 0, 0, 0, 0) }), [commit]);

  const removeLeaving = useCallback((key: string) => setLeaving((l) => l.filter((x) => x.key !== key)), []);

  const visible = ids.slice(0, VISIBLE);

  return (
    <View style={styles.area} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {size.w > 0 &&
        visible
          .map((id, index) => {
            const meta = getMeta(id);
            if (!meta) return null;
            const enterFrom = index === 0 && undone?.id === id ? undone.action : null;
            return (
              <Card key={id} meta={meta} index={index} size={size} onCommit={commit} enterFrom={enterFrom} />
            );
          })
          .reverse()}
      {size.w > 0 &&
        leaving.map((l) => {
          const meta = getMeta(l.id);
          return meta ? <LeavingCard key={l.key} item={l} meta={meta} size={size} onDone={removeLeaving} /> : null;
        })}
    </View>
  );
}

// ---------------------------------------------------------------------------

type CardProps = {
  meta: AssetMetadata;
  index: number;
  size: { w: number; h: number };
  onCommit: (action: SwipeAction, x: number, y: number, vx: number, vy: number) => void;
  enterFrom: SwipeAction | null;
};

function startOffset(action: SwipeAction | null, size: { w: number; h: number }) {
  if (action === 'keep') return { x: size.w * 1.4, y: 0 };
  if (action === 'trash') return { x: -size.w * 1.4, y: 0 };
  if (action === 'later') return { x: 0, y: -size.h * 1.2 };
  return { x: 0, y: 0 };
}

const Card = memo(function Card({ meta, index, size, onCommit, enterFrom }: CardProps) {
  const start = startOffset(enterFrom, size);
  const x = useSharedValue(start.x);
  const y = useSharedValue(start.y);
  const depth = useSharedValue(index);
  const armed = useSharedValue(0);
  const isTop = index === 0;

  useEffect(() => {
    depth.set(withSpring(index, SPRING));
  }, [index, depth]);

  useEffect(() => {
    if (enterFrom) {
      x.set(withSpring(0, SPRING));
      y.set(withSpring(0, SPRING));
    }
    // alleen bij mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const thresholdX = size.w * 0.3;
  const thresholdY = size.h * 0.18;

  const pan = usePanGesture({
    enabled: isTop,
    minDistance: 6,
    onUpdate: (e) => {
      'worklet';
      x.set(e.translationX);
      y.set(e.translationY);
      const next =
        -e.translationY > thresholdY && Math.abs(e.translationX) < thresholdX
          ? 3
          : e.translationX > thresholdX
            ? 1
            : e.translationX < -thresholdX
              ? 2
              : 0;
      if (next !== armed.value) {
        armed.set(next);
        if (next !== 0) scheduleOnRN(Haptics.selectionAsync);
      }
    },
    onDeactivate: (e) => {
      'worklet';
      const { translationX: tx, translationY: ty, velocityX: vx, velocityY: vy } = e;
      let action: SwipeAction | null = null;
      if ((-ty > thresholdY || vy < -900) && Math.abs(tx) < thresholdX && Math.abs(vx) < 900) action = 'later';
      else if (tx > thresholdX || vx > 800) action = 'keep';
      else if (tx < -thresholdX || vx < -800) action = 'trash';
      armed.set(0);
      if (action) {
        scheduleOnRN(onCommit, action, tx, ty, vx, vy);
      } else {
        x.set(withSpring(0, SPRING));
        y.set(withSpring(0, SPRING));
      }
    },
  });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(x.value, [-size.w, 0, size.w], [-12, 0, 12], Extrapolation.CLAMP);
    return {
      opacity: interpolate(depth.value, [0, 1, 2, 3], [1, 1, 0.6, 0]),
      transform: [
        { translateX: x.value },
        { translateY: y.value + depth.value * 12 },
        { scale: 1 - depth.value * 0.05 },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, cardStyle]} pointerEvents={isTop ? 'auto' : 'none'}>
        <MediaView meta={meta} active={isTop} />
        <Stamps x={x} y={y} size={size} />
        <CardFooter meta={meta} active={isTop} />
      </Animated.View>
    </GestureDetector>
  );
});

function LeavingCard({
  item,
  meta,
  size,
  onDone,
}: {
  item: Leaving;
  meta: AssetMetadata;
  size: { w: number; h: number };
  onDone: (key: string) => void;
}) {
  const x = useSharedValue(item.x);
  const y = useSharedValue(item.y);

  useEffect(() => {
    const D = 200;
    const done = (finished?: boolean) => {
      'worklet';
      if (finished) scheduleOnRN(onDone, item.key);
    };
    if (item.action === 'later') {
      x.set(withTiming(item.x, { duration: D }));
      y.set(withTiming(-size.h * 1.3, { duration: D }, done));
    } else {
      const dir = item.action === 'keep' ? 1 : -1;
      x.set(withTiming(dir * size.w * 1.6, { duration: D }, done));
      y.set(withTiming(item.y + item.vy * 0.12, { duration: D }));
    }
  }, [item, size, x, y, onDone]);

  const style = useAnimatedStyle(() => {
    const rotate = interpolate(x.value, [-size.w, 0, size.w], [-12, 0, 12], Extrapolation.CLAMP);
    return { transform: [{ translateX: x.value }, { translateY: y.value }, { rotate: `${rotate}deg` }] };
  });

  return (
    <Animated.View style={[styles.card, style]} pointerEvents="none">
      <MediaView meta={meta} active={false} />
      <Stamps x={x} y={y} size={size} forced={item.action} />
    </Animated.View>
  );
}

function Stamps({
  x,
  y,
  size,
  forced,
}: {
  x: SharedValue<number>;
  y: SharedValue<number>;
  size: { w: number; h: number };
  forced?: SwipeAction;
}) {
  const keep = useAnimatedStyle(() => ({
    opacity: forced === 'keep' ? 1 : interpolate(x.value, [20, size.w * 0.3], [0, 1], Extrapolation.CLAMP),
  }));
  const trash = useAnimatedStyle(() => ({
    opacity: forced === 'trash' ? 1 : interpolate(x.value, [-20, -size.w * 0.3], [0, 1], Extrapolation.CLAMP),
  }));
  const later = useAnimatedStyle(() => ({
    opacity:
      forced === 'later'
        ? 1
        : interpolate(-y.value, [20, size.h * 0.18], [0, 1], Extrapolation.CLAMP) *
          interpolate(Math.abs(x.value), [0, size.w * 0.3], [1, 0], Extrapolation.CLAMP),
  }));
  return (
    <>
      <Animated.View style={[styles.stamp, styles.stampLeft, { borderColor: colors.keep }, keep]}>
        <Ionicons name="checkmark" size={26} color={colors.keep} />
        <Text style={[styles.stampText, { color: colors.keep }]}>BEHOUDEN</Text>
      </Animated.View>
      <Animated.View style={[styles.stamp, styles.stampRight, { borderColor: colors.trash }, trash]}>
        <Ionicons name="trash" size={22} color={colors.trash} />
        <Text style={[styles.stampText, { color: colors.trash }]}>WISSEN</Text>
      </Animated.View>
      <Animated.View style={[styles.stamp, styles.stampBottom, { borderColor: colors.later }, later]}>
        <Ionicons name="time" size={22} color={colors.later} />
        <Text style={[styles.stampText, { color: colors.later }]}>LATER</Text>
      </Animated.View>
    </>
  );
}

function CardFooter({ meta, active }: { meta: AssetMetadata; active: boolean }) {
  const [place, setPlace] = useState<string | null>(null);
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    getPlaceName(meta.id).then((p) => !cancelled && setPlace(p));
    return () => {
      cancelled = true;
    };
  }, [active, meta.id]);
  const date = formatDate(meta.creationTime);
  if (!date && !place) return null;
  return (
    <View style={styles.footer} pointerEvents="none">
      {date ? <Text style={styles.footerText}>{date}</Text> : null}
      {date && place ? <Text style={styles.footerDot}>·</Text> : null}
      {place ? (
        <>
          <Ionicons name="location-sharp" size={13} color="#fff" />
          <Text style={styles.footerText} numberOfLines={1}>
            {place}
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  area: { flex: 1, marginHorizontal: 16, marginVertical: 8 },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  stamp: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 3,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  stampLeft: { top: 40, left: 20, transform: [{ rotate: '-12deg' }] },
  stampRight: { top: 40, right: 20, transform: [{ rotate: '12deg' }] },
  stampBottom: { bottom: 110, alignSelf: 'center' },
  stampText: { fontSize: 22, fontWeight: '900', letterSpacing: 1.5 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  footerText: { color: '#fff', fontSize: 15, fontWeight: '600', flexShrink: 1 },
  footerDot: { color: 'rgba(255,255,255,0.7)', fontSize: 15 },
});
