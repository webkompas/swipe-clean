import { useCallback, useEffect, useRef, useState } from 'react';
import * as MediaLibrary from 'expo-media-library';
import type { AssetMetadata } from 'expo-media-library';
import * as db from './db';
import { deleteAssets, getAssetSize, loadAllMetadata } from './library';
import { randomInt, shuffle } from './format';

export type SwipeAction = 'keep' | 'trash' | 'later';
type HistoryEntry = { id: string; action: SwipeAction };

export type Phase = 'loading' | 'ready' | 'error';

const LATER_MIN_GAP = 10;
const HISTORY_LIMIT = 50;

export function useDeck(enabled: boolean) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [queue, setQueue] = useState<string[]>([]);
  const [trash, setTrash] = useState<Map<string, number | null>>(new Map());
  const [keptCount, setKeptCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [lastUndone, setLastUndone] = useState<HistoryEntry | null>(null);

  const meta = useRef(new Map<string, AssetMetadata>());
  const kept = useRef(new Set<string>());
  const history = useRef<HistoryEntry[]>([]);
  const queueRef = useRef<string[]>([]);
  const trashRef = useRef(trash);

  const commitQueue = (q: string[]) => {
    queueRef.current = q;
    setQueue(q);
  };
  const commitTrash = (t: Map<string, number | null>) => {
    trashRef.current = t;
    setTrash(t);
  };

  const recount = () => {
    let k = 0;
    for (const id of kept.current) if (meta.current.has(id)) k++;
    setKeptCount(k);
    setTotal(meta.current.size);
  };

  /** Volledige (her)lading: alles ophalen, al beoordeelde eruit, eerlijk schudden. */
  const reload = useCallback(async () => {
    try {
      const all = await loadAllMetadata();
      meta.current = new Map(all.map((a) => [a.id, a]));
      const saved = db.loadDecisions();
      kept.current = saved.kept;
      // Prullenbak-items die buiten de app al verwijderd zijn, opruimen.
      const gone = [...saved.trash.keys()].filter((id) => !meta.current.has(id));
      if (gone.length) db.removeDecisions(gone);
      gone.forEach((id) => saved.trash.delete(id));
      commitTrash(saved.trash);
      const fresh = all
        .map((a) => a.id)
        .filter((id) => !saved.kept.has(id) && !saved.trash.has(id));
      commitQueue(shuffle(fresh));
      history.current = [];
      setCanUndo(false);
      recount();
      setPhase('ready');
    } catch (e) {
      console.warn(e);
      setPhase('error');
    }
  }, []);

  /** Wijzigingen in de galerij (nieuwe foto's, elders verwijderd) verwerken zonder te herschudden. */
  const sync = useCallback(async () => {
    try {
      const all = await loadAllMetadata();
      const next = new Map(all.map((a) => [a.id, a]));
      const q = queueRef.current.filter((id) => next.has(id));
      const known = new Set([...q, ...kept.current, ...trashRef.current.keys()]);
      for (const a of all) {
        if (!known.has(a.id)) q.splice(randomInt(Math.min(q.length, 1), q.length), 0, a.id);
      }
      const t = new Map(trashRef.current);
      const gone = [...t.keys()].filter((id) => !next.has(id));
      if (gone.length) {
        db.removeDecisions(gone);
        gone.forEach((id) => t.delete(id));
        commitTrash(t);
      }
      history.current = history.current.filter((h) => next.has(h.id));
      setCanUndo(history.current.length > 0);
      meta.current = next;
      commitQueue(q);
      recount();
    } catch (e) {
      console.warn(e);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // Laden is asynchroon (externe bron); setState gebeurt pas na de await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sub = MediaLibrary.addListener(() => {
      clearTimeout(timer);
      timer = setTimeout(sync, 800);
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [enabled, reload, sync]);

  const swipe = useCallback((action: SwipeAction) => {
    const [id, ...rest] = queueRef.current;
    if (!id) return;
    if (action === 'later') {
      const pos = rest.length <= LATER_MIN_GAP ? rest.length : randomInt(LATER_MIN_GAP, rest.length);
      rest.splice(pos, 0, id);
    } else if (action === 'keep') {
      db.setDecision(id, 'kept');
      kept.current.add(id);
      setKeptCount((c) => c + 1);
    } else {
      db.setDecision(id, 'trash');
      const t = new Map(trashRef.current);
      t.set(id, null);
      commitTrash(t);
      getAssetSize(id).then((size) => {
        if (size == null || !trashRef.current.has(id)) return;
        db.setSize(id, size);
        const t2 = new Map(trashRef.current);
        t2.set(id, size);
        commitTrash(t2);
      });
    }
    commitQueue(rest);
    history.current = [...history.current, { id, action }].slice(-HISTORY_LIMIT);
    setCanUndo(true);
    setLastUndone(null);
  }, []);

  const undo = useCallback(() => {
    const entry = history.current.pop();
    setCanUndo(history.current.length > 0);
    if (!entry) return;
    const q = queueRef.current.filter((x) => x !== entry.id);
    if (entry.action === 'keep') {
      db.removeDecision(entry.id);
      kept.current.delete(entry.id);
      setKeptCount((c) => Math.max(0, c - 1));
    } else if (entry.action === 'trash') {
      db.removeDecision(entry.id);
      const t = new Map(trashRef.current);
      t.delete(entry.id);
      commitTrash(t);
    }
    commitQueue([entry.id, ...q]);
    setLastUndone(entry);
  }, []);

  /** Item uit de prullenbak terugzetten: komt willekeurig terug in de stapel. */
  const restore = useCallback((id: string) => {
    db.removeDecision(id);
    const t = new Map(trashRef.current);
    t.delete(id);
    commitTrash(t);
    history.current = history.current.filter((h) => h.id !== id);
    setCanUndo(history.current.length > 0);
    const q = [...queueRef.current];
    q.splice(randomInt(Math.min(q.length, 1), q.length), 0, id);
    commitQueue(q);
  }, []);

  /** Echt verwijderen uit de galerij. iOS toont één bevestigingsvenster. */
  const emptyTrash = useCallback(async (): Promise<{ count: number; bytes: number } | null> => {
    const entries = [...trashRef.current.entries()];
    if (!entries.length) return null;
    const ids = entries.map(([id]) => id);
    try {
      await deleteAssets(ids);
    } catch {
      return null; // Geannuleerd in het iOS-venster.
    }
    const bytes = entries.reduce((s, [, size]) => s + (size ?? 0), 0);
    db.removeDecisions(ids);
    db.addStat('freedBytes', bytes);
    db.addStat('deletedCount', ids.length);
    ids.forEach((id) => meta.current.delete(id));
    history.current = history.current.filter((h) => h.action !== 'trash');
    setCanUndo(history.current.length > 0);
    commitTrash(new Map());
    recount();
    return { count: ids.length, bytes };
  }, []);

  /** Alle "behouden" vergeten, zodat alles opnieuw langskomt. */
  const resetKept = useCallback(async () => {
    db.clearKept();
    setPhase('loading');
    await reload();
  }, [reload]);

  const getMeta = useCallback((id: string) => meta.current.get(id), []);

  const trashBytes = [...trash.values()].reduce<number>((s, v) => s + (v ?? 0), 0);

  return {
    phase,
    queue,
    trash,
    trashBytes,
    reviewed: keptCount + trash.size,
    total,
    canUndo,
    lastUndone,
    getMeta,
    swipe,
    undo,
    restore,
    emptyTrash,
    resetKept,
    reload,
  };
}

export type Deck = ReturnType<typeof useDeck>;
