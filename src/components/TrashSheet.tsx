import { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { imageSource } from '../library';
import { formatBytes, formatNumber } from '../format';
import { colors } from '../theme';

type Props = {
  visible: boolean;
  ids: string[];
  bytes: number;
  onClose: () => void;
  onRestore: (id: string) => void;
  onEmpty: () => Promise<void>;
};

const COLS = 3;
const GAP = 3;

export function TrashSheet({ visible, ids, bytes, onClose, onRestore, onEmpty }: Props) {
  const { width } = useWindowDimensions();
  const [busy, setBusy] = useState(false);
  const tile = (width - GAP * (COLS + 1)) / COLS;

  const empty = async () => {
    setBusy(true);
    try {
      await onEmpty();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Prullenbak</Text>
            <Text style={styles.sub}>
              {formatNumber(ids.length)} items{bytes > 0 ? ` · ${formatBytes(bytes)} vrij te maken` : ''}
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12} style={styles.close} accessibilityLabel="Sluiten">
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>

        {ids.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="sparkles-outline" size={48} color={colors.textDim} />
            <Text style={styles.emptyText}>De prullenbak is leeg</Text>
          </View>
        ) : (
          <>
            <Text style={styles.hint}>Tik op een foto om hem terug te zetten.</Text>
            <FlatList
              data={ids}
              keyExtractor={(id) => id}
              numColumns={COLS}
              contentContainerStyle={{ padding: GAP, paddingBottom: 140 }}
              columnWrapperStyle={{ gap: GAP }}
              ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    onRestore(item);
                  }}
                  style={{ width: tile, height: tile }}
                >
                  <Image source={imageSource(item)} style={styles.thumb} contentFit="cover" recyclingKey={item} />
                  <View style={styles.restore}>
                    <Ionicons name="arrow-undo" size={14} color="#fff" />
                  </View>
                </Pressable>
              )}
            />
            <View style={styles.footer}>
              <Pressable style={[styles.cta, busy && { opacity: 0.6 }]} onPress={empty} disabled={busy}>
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="trash" size={20} color="#fff" />
                    <Text style={styles.ctaText}>Definitief wissen ({formatNumber(ids.length)})</Text>
                  </>
                )}
              </Pressable>
              <Text style={styles.note}>Gewiste items staan nog 30 dagen in “Recent verwijderd” op je iPhone.</Text>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 8 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  sub: { color: colors.textDim, fontSize: 14, marginTop: 2 },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  hint: { color: colors.textDim, fontSize: 13, paddingHorizontal: 20, paddingBottom: 8 },
  thumb: { flex: 1, borderRadius: 6, backgroundColor: colors.surface },
  restore: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    paddingBottom: 34,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 10,
  },
  cta: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.trash,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  note: { color: colors.textDim, fontSize: 12, textAlign: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { color: colors.textDim, fontSize: 16 },
});
