import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatBytes, formatNumber } from '../format';
import { colors } from '../theme';

function Button({ label, onPress, variant = 'primary' }: { label: string; onPress: () => void; variant?: 'primary' | 'ghost' }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.btn, variant === 'ghost' && styles.ghost, pressed && { opacity: 0.8 }]}>
      <Text style={[styles.btnText, variant === 'ghost' && { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export function IntroScreen({ onAllow, denied }: { onAllow: () => void; denied: boolean }) {
  return (
    <View style={styles.center}>
      <View style={styles.logo}>
        <Ionicons name="images" size={44} color={colors.keep} />
      </View>
      <Text style={styles.title}>Swipe Clean</Text>
      <Text style={styles.body}>
        Ruim je galerij op zoals je swipet:{'\n'}
        <Text style={{ color: colors.trash }}>← wissen</Text> · <Text style={{ color: colors.keep }}>behouden →</Text> ·{' '}
        <Text style={{ color: colors.later }}>↑ later</Text>
      </Text>
      <Text style={styles.small}>
        Kies bij de vraag om toegang voor “Volledige toegang”, zodat de app willekeurig uit je hele galerij kan kiezen. We vragen ook om je locatie,
        zodat de plaatsnaam bij een foto verschijnt (optioneel).
      </Text>
      {denied ? (
        <>
          <Text style={[styles.small, { color: colors.trash }]}>Geen toegang tot je foto’s. Zet dit aan in Instellingen.</Text>
          <Button label="Open Instellingen" onPress={() => Linking.openSettings()} />
        </>
      ) : (
        <Button label="Geef toegang tot foto’s" onPress={onAllow} />
      )}
    </View>
  );
}

export function LimitedScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <View style={styles.center}>
      <Ionicons name="lock-open-outline" size={48} color={colors.accent} />
      <Text style={styles.title}>Beperkte toegang</Text>
      <Text style={styles.body}>
        Je hebt maar een deel van je foto’s gedeeld. Voor echt willekeurige foto’s uit je hele galerij heeft de app “Volledige toegang” nodig.
      </Text>
      <Text style={styles.small}>Instellingen → Swipe Clean (of Expo Go) → Foto’s → Volledige toegang</Text>
      <Button label="Open Instellingen" onPress={() => Linking.openSettings()} />
      <Button label="Doorgaan met selectie" variant="ghost" onPress={onContinue} />
    </View>
  );
}

export function LoadingScreen({ text = 'Galerij laden en schudden…' }: { text?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.keep} />
      <Text style={styles.small}>{text}</Text>
    </View>
  );
}

export function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Ionicons name="alert-circle-outline" size={48} color={colors.trash} />
      <Text style={styles.title}>Er ging iets mis</Text>
      <Text style={styles.body}>De galerij kon niet geladen worden.</Text>
      <Button label="Opnieuw proberen" onPress={onRetry} />
    </View>
  );
}

export function DoneScreen({
  total,
  trashCount,
  freedBytes,
  onOpenTrash,
  onRestart,
}: {
  total: number;
  trashCount: number;
  freedBytes: number;
  onOpenTrash: () => void;
  onRestart: () => void;
}) {
  return (
    <View style={styles.center}>
      <Text style={{ fontSize: 64 }}>🏆</Text>
      <Text style={styles.title}>Galerij doorgewerkt!</Text>
      <Text style={styles.body}>
        Je hebt alle {formatNumber(total)} items bekeken.
        {freedBytes > 0 ? `\nTotaal vrijgemaakt: ${formatBytes(freedBytes)}.` : ''}
      </Text>
      {trashCount > 0 ? <Button label={`Prullenbak legen (${formatNumber(trashCount)})`} onPress={onOpenTrash} /> : null}
      <Button label="Opnieuw beginnen" variant={trashCount > 0 ? 'ghost' : 'primary'} onPress={onRestart} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 },
  logo: { width: 88, height: 88, borderRadius: 26, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', textAlign: 'center' },
  body: { color: colors.text, fontSize: 17, lineHeight: 25, textAlign: 'center' },
  small: { color: colors.textDim, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  btn: {
    alignSelf: 'stretch',
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.keep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghost: { backgroundColor: colors.surface },
  btnText: { color: '#04140B', fontSize: 17, fontWeight: '800' },
});
