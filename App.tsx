import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import { useDeck, type SwipeAction } from './src/useDeck';
import { requestLocationPermission } from './src/library';
import { getStat } from './src/db';
import { formatNumber } from './src/format';
import { colors } from './src/theme';
import { CardStack, type CardStackHandle } from './src/components/CardStack';
import { Header } from './src/components/Header';
import { ActionBar } from './src/components/ActionBar';
import { TrashSheet } from './src/components/TrashSheet';
import { SettingsSheet } from './src/components/SettingsSheet';
import { Celebration } from './src/components/Celebration';
import { Toast, type ToastData } from './src/components/Toast';
import { DoneScreen, ErrorScreen, IntroScreen, LimitedScreen, LoadingScreen } from './src/components/Screens';

type Access = 'checking' | 'undetermined' | 'denied' | 'limited' | 'granted';

const TRASH_REMINDER_EVERY = 50;

function toAccess(p: MediaLibrary.PermissionResponse): Access {
  if (p.granted) return p.accessPrivileges === 'limited' ? 'limited' : 'granted';
  return p.canAskAgain ? 'undetermined' : 'denied';
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
          <Main />
        </SafeAreaView>
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
  const [toast, setToast] = useState<ToastData | null>(null);
  const [totals, setTotals] = useState(() => ({ freedBytes: getStat('freedBytes'), deletedCount: getStat('deletedCount') }));
  const lastReminder = useRef(0);

  const hideToast = useCallback(() => setToast(null), []);

  // Herinnering bij elke 50 items in de prullenbak.
  const trashCount = deck.trash.size;
  const explained = useRef(false);
  useEffect(() => {
    // Eerste keer iets in de prullenbak: uitleggen dat wissen pas bij legen gebeurt.
    if (trashCount === 1 && !explained.current) {
      explained.current = true;
      setToast({
        key: Date.now(),
        text: 'In de prullenbak gezet. Leeg de prullenbak om echt te wissen.',
        action: { label: 'Bekijken', onPress: () => setTrashOpen(true) },
      });
      lastReminder.current = 0;
      return;
    }
    const bucket = Math.floor(trashCount / TRASH_REMINDER_EVERY);
    if (bucket > lastReminder.current) {
      setToast({
        key: Date.now(),
        text: `${formatNumber(trashCount)} items in de prullenbak. Tijd om te legen?`,
        action: { label: 'Bekijken', onPress: () => setTrashOpen(true) },
      });
    }
    lastReminder.current = bucket;
  }, [trashCount]);

  const press = (action: SwipeAction) => stack.current?.swipe(action);

  const empty = async () => {
    const res = await deck.emptyTrash();
    if (!res) return;
    if ('error' in res) {
      Alert.alert(
        'Wissen is niet gelukt',
        `iOS heeft de foto's niet verwijderd. Controleer of de app volledige toegang heeft tot je foto's (Instellingen › Privacy › Foto's).\n\nDetails: ${res.error}`,
      );
      return;
    }
    setTotals({ freedBytes: getStat('freedBytes'), deletedCount: getStat('deletedCount') });
    setTrashOpen(false);
    // Wacht tot het prullenbak-scherm dicht is (iOS toont één modal tegelijk).
    setTimeout(() => setCelebration(res), 450);
  };

  if (deck.phase === 'loading') return <LoadingScreen />;
  if (deck.phase === 'error') return <ErrorScreen onRetry={deck.reload} />;

  const done = deck.queue.length === 0;

  return (
    <View style={styles.flex}>
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
          <CardStack ref={stack} ids={deck.queue} getMeta={deck.getMeta} onSwipe={deck.swipe} undone={deck.lastUndone} />
          <ActionBar
            canUndo={deck.canUndo}
            disabled={done}
            onUndo={deck.undo}
            onTrash={() => press('trash')}
            onLater={() => press('later')}
            onKeep={() => press('keep')}
          />
        </>
      )}

      <Toast toast={toast} onHide={hideToast} />

      <TrashSheet
        visible={trashOpen}
        ids={[...deck.trash.keys()].reverse()}
        bytes={deck.trashBytes}
        onClose={() => setTrashOpen(false)}
        onRestore={deck.restore}
        onEmpty={empty}
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
