import { memo, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { Asset, MediaSubtype, MediaType, type AssetMetadata } from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { imageSource } from '../library';
import { formatDuration } from '../format';
import { colors } from '../theme';

type Props = { meta: AssetMetadata; active: boolean };

function MediaViewBase({ meta, active }: Props) {
  const src = imageSource(meta.id);
  const isVideo = meta.mediaType === MediaType.VIDEO;
  const isLive = !!meta.mediaSubtypes?.includes(MediaSubtype.LIVE_PHOTO);
  const [liveUri, setLiveUri] = useState<string | null>(null);
  const [livePlaying, setLivePlaying] = useState(false);

  useEffect(() => {
    if (!active || !isLive) return;
    let cancelled = false;
    new Asset(meta.id)
      .getLivePhotoVideoUri()
      .then((uri) => !cancelled && setLiveUri(uri))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [active, isLive, meta.id]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Wazige achtergrond zodat staande en liggende foto's mooi gevuld zijn */}
      <Image source={src} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={40} recyclingKey={meta.id + 'bg'} />
      <View style={[StyleSheet.absoluteFill, styles.dim]} />

      {isVideo && active ? (
        <VideoLayer id={meta.id} poster={src} duration={meta.duration} />
      ) : (
        <Pressable
          style={StyleSheet.absoluteFill}
          disabled={!isLive || !liveUri}
          delayLongPress={200}
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setLivePlaying(true);
          }}
          onPressOut={() => setLivePlaying(false)}
        >
          <Image source={src} style={StyleSheet.absoluteFill} contentFit="contain" transition={120} recyclingKey={meta.id} />
          {livePlaying && liveUri ? <LiveLayer uri={liveUri} /> : null}
        </Pressable>
      )}

      {isVideo && !active ? (
        <View style={styles.badge}>
          <Ionicons name="play" size={12} color="#fff" />
          <Text style={styles.badgeText}>{formatDuration(meta.duration)}</Text>
        </View>
      ) : null}
      {isLive ? (
        <View style={[styles.badge, livePlaying && { backgroundColor: colors.accent }]}>
          <Ionicons name="radio-button-on" size={12} color={livePlaying ? '#000' : '#fff'} />
          <Text style={[styles.badgeText, livePlaying && { color: '#000' }]}>LIVE</Text>
        </View>
      ) : null}
      {isLive && active && liveUri && !livePlaying ? (
        <Text style={styles.hint}>Houd ingedrukt om af te spelen</Text>
      ) : null}
    </View>
  );
}

function VideoLayer({ id, poster, duration }: { id: string; poster: string; duration: number | null }) {
  const player = useVideoPlayer(imageSource(id), (p) => {
    p.loop = true;
    p.muted = true;
    p.timeUpdateEventInterval = 0.25;
    p.play();
  });
  const { muted } = useEvent(player, 'mutedChange', { muted: true });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const time = useEvent(player, 'timeUpdate', { currentTime: 0, currentLiveTimestamp: null, currentOffsetFromLive: null, bufferedPosition: 0 });

  // Terugval: als PhotoKit-URI niet laadt (bijv. iCloud), haal het bestand op.
  useEffect(() => {
    if (status !== 'error') return;
    new Asset(id)
      .getUri()
      .then((uri) => player.replaceAsync(uri))
      .then(() => player.play())
      .catch(() => {});
  }, [status, id, player]);

  const total = player.duration || duration || 0;
  const progress = total > 0 ? Math.min(1, time.currentTime / total) : 0;

  const toggleSound = () => {
    // eslint-disable-next-line react-hooks/immutability
    player.muted = !player.muted;
  };

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={toggleSound}>
      <Image source={poster} style={StyleSheet.absoluteFill} contentFit="contain" />
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} />
      <View style={styles.sound}>
        <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={18} color="#fff" />
      </View>
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatDuration(time.currentTime)}</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.timeText}>{formatDuration(total)}</Text>
      </View>
    </Pressable>
  );
}

function LiveLayer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.play();
  });
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} />;
}

export const MediaView = memo(MediaViewBase);

const styles = StyleSheet.create({
  dim: { backgroundColor: 'rgba(0,0,0,0.45)' },
  badge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  hint: {
    position: 'absolute',
    top: 18,
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
  },
  sound: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  timeRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: { color: '#fff', fontSize: 12, fontVariant: ['tabular-nums'] },
  track: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  fill: { height: 3, backgroundColor: '#fff' },
});
