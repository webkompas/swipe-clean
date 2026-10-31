import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatBytes, formatNumber } from '../format';
import { colors } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  stats: { reviewed: number; total: number; freedBytes: number; deletedCount: number };
  onResetKept: () => void;
};

export function SettingsSheet({ visible, onClose, stats, onResetKept }: Props) {
  const confirmReset = () =>
    Alert.alert('Behouden foto\'s resetten?', 'Alle foto\'s die je hebt behouden komen weer in de stapel.', [
      { text: 'Annuleren', style: 'cancel' },
      { text: 'Resetten', style: 'destructive', onPress: onResetKept },
    ]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Overzicht</Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.close} accessibilityLabel="Sluiten">
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.grid}>
          <Stat label="Bekeken" value={`${formatNumber(stats.reviewed)} / ${formatNumber(stats.total)}`} />
          <Stat label="Totaal gewist" value={formatNumber(stats.deletedCount)} />
          <Stat label="Ruimte vrijgemaakt" value={formatBytes(stats.freedBytes)} color={colors.keep} />
        </View>

        <Text style={styles.section}>Uitleg</Text>
        <View style={styles.card}>
          <Row icon="arrow-back" color={colors.trash} text="Naar links: naar de prullenbak" />
          <Row icon="arrow-forward" color={colors.keep} text="Naar rechts: behouden (komt nooit meer terug)" />
          <Row icon="arrow-up" color={colors.later} text="Omhoog: later beslissen" />
          <Row icon="hand-left-outline" color={colors.accent} text="Live Photo ingedrukt houden om af te spelen" />
          <Row icon="volume-high-outline" color={colors.textDim} text="Tik op een video voor geluid" />
        </View>

        <Pressable style={styles.danger} onPress={confirmReset}>
          <Ionicons name="refresh" size={18} color={colors.trash} />
          <Text style={styles.dangerText}>Behouden foto’s resetten</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function Stat({ label, value, color = colors.text }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Row({ icon, color, text }: { icon: keyof typeof Ionicons.glyphMap; color: string; text: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={styles.rowText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: 20, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { flexGrow: 1, minWidth: '45%', backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 4 },
  statValue: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statLabel: { color: colors.textDim, fontSize: 13 },
  section: { color: colors.textDim, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginTop: 8 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { color: colors.text, fontSize: 15, flex: 1 },
  danger: {
    marginTop: 'auto',
    marginBottom: 20,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.trash + '66',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dangerText: { color: colors.trash, fontSize: 16, fontWeight: '700' },
});
