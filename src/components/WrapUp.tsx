import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { imageSource } from '../library';
import { formatBytes, formatNumber } from '../format';
import { colors, gradient } from '../theme';
import type { RoundEntry } from './RoundStrip';

type Props = {
  visible: boolean;
  round: RoundEntry[];
  trashIds: string[];
  trashBytes: number;
  onDelete: () => Promise<void>;
  onLater: () => void;
};

/** Na elke ronde: meteen wissen of later. */
export function WrapUp({ visible, round, trashIds, trashBytes, onDelete, onLater }: Props) {
  const [busy, setBusy] = useState(false);
  const kept = round.filter((r) => r.action === 'keep').length;
  const trashed = round.filter((r) => r.action === 'trash');
  const n = trashIds.length;
  const older = n - trashed.length;
  const preview = (trashed.length ? trashed.map((t) => t.id) : trashIds).slice(-6);

  const del = async () => {
    setBusy(true);
    try {
      await onDelete();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onLater}>
      <LinearGradient colors={gradient} style={styles.flex}>
        <SafeAreaView style={styles.root}>
          <View style={styles.top}>
            <Text style={styles.title}>{n > 0 ? 'Klaar om op te ruimen?' : 'Ronde klaar!'}</Text>
            <Text style={styles.sub}>
              {formatNumber(kept)} behouden · {formatNumber(trashed.length)} naar de prullenbak
            </Text>
          </View>

          {n > 0 ? (
            <View style={styles.panel}>
              <View style={styles.grid}>
                {preview.map((id) => (
                  <Image key={id} source={imageSource(id)} style={styles.tile} contentFit="cover" cachePolicy="memory" />
                ))}
              </View>
              <Text style={styles.panelText}>
                {formatNumber(n)} {n === 1 ? 'item' : 'items'} in de prullenbak
                {older > 0 ? ` (waarvan ${formatNumber(older)} van eerder)` : ''}
                {trashBytes > 0 ? ` · ${formatBytes(trashBytes)}` : ''}
              </Text>
            </View>
          ) : (
            <View style={styles.panel}>
              <Ionicons name="sparkles" size={56} color={colors.accent} />
              <Text style={styles.panelText}>Niets te wissen deze ronde. Lekker bezig!</Text>
            </View>
          )}

          <View style={styles.bottom}>
            {n > 0 ? (
              <>
                <Pressable style={styles.primary} onPress={del} disabled={busy}>
                  {busy ? (
                    <ActivityIndicator color="#0D0F24" />
                  ) : (
                    <Text style={styles.primaryText}>
                      Nu wissen ({formatNumber(n)})
                    </Text>
                  )}
                </Pressable>
                <Text style={styles.note}>iOS vraagt één keer om bevestiging. Gewiste items staan nog 30 dagen in “Recent verwijderd”.</Text>
                <Pressable style={styles.ghost} onPress={onLater} disabled={busy}>
                  <Text style={styles.ghostText}>Later wissen</Text>
                </Pressable>
              </>
            ) : (
              <Pressable style={styles.primary} onPress={onLater}>
                <Text style={styles.primaryText}>Volgende ronde</Text>
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, padding: 24, justifyContent: 'space-between' },
  top: { gap: 6, marginTop: 24 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900' },
  sub: { color: colors.textDim, fontSize: 15 },
  panel: {
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  tile: { width: 88, height: 110, borderRadius: 14, backgroundColor: colors.surface },
  panelText: { color: colors.text, fontSize: 15, textAlign: 'center' },
  bottom: { gap: 12 },
  primary: { height: 56, borderRadius: 28, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#0D0F24', fontSize: 17, fontWeight: '800' },
  note: { color: colors.textDim, fontSize: 12, textAlign: 'center' },
  ghost: { height: 48, alignItems: 'center', justifyContent: 'center' },
  ghostText: { color: colors.text, fontSize: 16, fontWeight: '700' },
});
