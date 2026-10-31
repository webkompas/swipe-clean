export function formatNumber(n: number): string {
  return n.toLocaleString('nl-NL');
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(0, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toLocaleString('nl-NL', { maximumFractionDigits: 1 })} GB`;
}

export function formatDate(ms: number | null): string | null {
  if (!ms) return null;
  // Sommige bronnen geven seconden i.p.v. milliseconden.
  const value = ms < 1e12 ? ms * 1000 : ms;
  return new Date(value).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDuration(seconds: number | null): string {
  if (!seconds || seconds < 0) return '0:00';
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Fisher–Yates: elke volgorde even waarschijnlijk. */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Willekeurige positie in [min, max]. */
export function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}
