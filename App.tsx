import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSharedValue } from 'react-native-reanimated';
import * as MediaLibrary from 'expo-media-library';
import { useDeck, type SwipeAction } from './src/useDeck';
import { requestLocationPermission } from './src/library';
import { getStat } from './src/db';
import { colors, gradient } from './src/theme';
import { CardStack, type CardStackHandle } from './src/components/CardStack';
import { Header } from './src/components/Header';
import { ActionBar } from './src/components/ActionBar';
import { TrashSheet } from './src/components/TrashSheet';
import { SettingsSheet } from './src/components/SettingsSheet';
import { Celebration } from './src/components/Celebration';
import { SwipeTint } from './src/components/SwipeTint';
import { RoundStrip, type RoundEntry } from './src/components/RoundStrip';
import { WrapUp } from './src/components/WrapUp';
import { DoneScreen, ErrorScreen, IntroScreen, LimitedScreen, LoadingScreen } from './src/components/Screens';

type Access = 'checking' | 'undetermined' | 'denied' | 'limited' | 'granted';

const ROUND_SIZE = 10;

function toAccess(p: MediaLibrary.PermissionResponse): Access {
  if (p.granted) return p.accessPrivileges === 'limited' ? 'limited' : 'granted';
  return p.canAskAgain ? 'undetermined' : 'denied';
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <View style={styles.root}>
          <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} />
          <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
            <Main />
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Main() {
  const [access, setAccess] = useState<Access>('checking');
  const [limitedOk, setLimitedOk] = useState(false);

  const check = useCallback(async () => {
    try {
      setAccess(toAccess(await MediaLibrary.getPermissionsAsync()));
    } catch {
      setAccess('undetermined');
    }
  }, []);

  useEffect(() => {
    check();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && check());
    return () => sub.remove();
  }, [check]);

  const allow = async () => {
    const res = await MediaLibrary.requestPermissionsAsync();
    setAccess(toAccess(res));
    if (res.granted) await requestLocationPermission();
  };

  const ready = access === 'granted' || (access === 'limited' && limitedOk);

  if (access === 'checking') return <LoadingScreen text="" />;
  if (access === 'undetermined' || access === 'denied') return <IntroScreen onAllow={allow} denied={access === 'denied'} />;
  if (!ready) return <LimitedScreen onContinue={() => setLimitedOk(true)} />;
  return <SwipeScreen />;
}

function SwipeScreen() {
  const deck = useDeck(true);
  const stack = useRef<CardStackHandle>(null);
  const [trashOpen, setTrashOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [celebration, setCelebration] = useState<{ count: number; bytes: number } | null>(null);
  const [totals, setTotals] = useState(() => ({ freedBytes: getStat('freedBytes'), deletedCount: getStat('deletedCount') }));
  const [round, setRound] = useState<RoundEntry[]>([]);
  const [wrapOpen, setWrapOpen] = useState(false);
  const drag = { x: useSharedValue(0), y: useSharedValue(0) };
  const dragRef = useRef(drag);

  const trashCount = deck.trash.size;

  const onSwipe = useCallback(
    (action: SwipeAction) => {
      const id = deck.swipe(action);
      if (id) setRound((r) => [...r, { id, action }]);
      return id;
    },
    [deck]
  );

  const undo = () => {
    if (!deck.canUndo) return;
    deck.undo();
    setRound((r) => r.slice(0, -1));
  };

  // Ronde klaar (10 kaarten, of de stapel is op): even laten landen, dan het rondescherm.
  const queueLeft = deck.queue.length;
  useEffect(() => {
    if (round.length === 0) return;
    if (round.length < ROUND_SIZE && queueLeft > 0) return;
    const t = setTimeout(() => setWrapOpen(true), 350);
    return () => clearTimeout(t);
  }, [round.length, queueLeft]);

  const nextRound = () => {
    setWrapOpen(false);
    setRound([]);
  };

  const press = (action: SwipeAction) => stack.current?.swipe(action);

  /** Prullenbak echt wissen; true als het gelukt is. */
  const empty = async (): Promise<boolean> => {
    const res = await deck.emptyTrash();
    if (!res) return false;
    if ('error' in res) {
      Alert.alert(
        'Wissen is niet gelukt',
        `iOS heeft de foto's niet verwijderd. Controleer of de app volledige toegang heeft tot je foto's (Instellingen › Privacy › Foto's).\n\nDetails: ${res.error}`,
      );
      return false;
    }
    setTotals({ freedBytes: getStat('freedBytes'), deletedCount: getStat('deletedCount') });
    // Wacht tot het openstaande scherm dicht is (iOS toont één modal tegelijk).
    setTimeout(() => setCelebration(res), 450);
    return true;
  };

  const emptyFromSheet = async () => {
    if (await empty()) setTrashOpen(false);
  };

  const emptyFromWrap = async () => {
    if (await empty()) nextRound();
  };

  if (deck.phase === 'loading') return <LoadingScreen />;
  if (deck.phase === 'error') return <ErrorScreen onRetry={deck.reload} />;

  const done = deck.queue.length === 0;

  return (
    <View style={styles.flex}>
      <SwipeTint drag={dragRef.current} />
      <Header
        reviewed={deck.reviewed}
        total={deck.total}
        trashCount={trashCount}
        onOpenTrash={() => setTrashOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {done ? (
        <DoneScreen
          total={deck.total}
          trashCount={trashCount}
          freedBytes={totals.freedBytes}
          onOpenTrash={() => setTrashOpen(true)}
          onRestart={deck.resetKept}
        />
      ) : (
        <>
          <CardStack
            ref={stack}
            ids={deck.queue}
            drag={dragRef.current}
            getMeta={deck.getMeta}
            onSwipe={onSwipe}
            undone={deck.lastUndone}
          />
          <RoundStrip done={round} upcoming={deck.queue.slice(0, ROUND_SIZE)} size={ROUND_SIZE} />
          <ActionBar
            canUndo={deck.canUndo}
            disabled={done}
            onUndo={undo}
            onTrash={() => press('trash')}
            onLater={() => press('later')}
            onKeep={() => press('keep')}
          />
        </>
      )}

      <WrapUp
        visible={wrapOpen}
        round={round}
        trashIds={[...deck.trash.keys()]}
        trashBytes={deck.trashBytes}
        onDelete={emptyFromWrap}
        onLater={nextRound}
      />

      <TrashSheet
        visible={trashOpen}
        ids={trashOpen ? [...deck.trash.keys()].reverse() : []}
        bytes={deck.trashBytes}
        onClose={() => setTrashOpen(false)}
        onRestore={deck.restore}
        onEmpty={emptyFromSheet}
      />
      <SettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        stats={{ reviewed: deck.reviewed, total: deck.total, ...totals }}
        onResetKept={() => {
          setSettingsOpen(false);
          deck.resetKept();
        }}
      />
      <Celebration
        result={celebration}
        totalBytes={totals.freedBytes}
        totalCount={totals.deletedCount}
        onClose={() => setCelebration(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: colors.bg },
});
