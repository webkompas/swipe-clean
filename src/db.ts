import * as SQLite from 'expo-sqlite';

export type Status = 'kept' | 'trash';

const db = SQLite.openDatabaseSync('swipeclean.db');

db.execSync(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS decisions (
    id TEXT PRIMARY KEY NOT NULL,
    status TEXT NOT NULL,
    size INTEGER,
    decided_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS stats (
    key TEXT PRIMARY KEY NOT NULL,
    value INTEGER NOT NULL
  );
`);

export function loadDecisions(): { kept: Set<string>; trash: Map<string, number | null> } {
  const rows = db.getAllSync<{ id: string; status: Status; size: number | null }>(
    'SELECT id, status, size FROM decisions ORDER BY decided_at ASC'
  );
  const kept = new Set<string>();
  const trash = new Map<string, number | null>();
  for (const r of rows) {
    if (r.status === 'kept') kept.add(r.id);
    else trash.set(r.id, r.size);
  }
  return { kept, trash };
}

export function setDecision(id: string, status: Status, size: number | null = null) {
  db.runSync(
    'INSERT OR REPLACE INTO decisions (id, status, size, decided_at) VALUES (?, ?, ?, ?)',
    id,
    status,
    size,
    Date.now()
  );
}

export function setSize(id: string, size: number) {
  db.runSync('UPDATE decisions SET size = ? WHERE id = ?', size, id);
}

export function removeDecision(id: string) {
  db.runSync('DELETE FROM decisions WHERE id = ?', id);
}

export function removeDecisions(ids: string[]) {
  db.withTransactionSync(() => {
    for (const id of ids) db.runSync('DELETE FROM decisions WHERE id = ?', id);
  });
}

export function clearKept() {
  db.runSync("DELETE FROM decisions WHERE status = 'kept'");
}

export function getStat(key: string): number {
  return db.getFirstSync<{ value: number }>('SELECT value FROM stats WHERE key = ?', key)?.value ?? 0;
}

export function addStat(key: string, delta: number) {
  db.runSync(
    'INSERT INTO stats (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = value + excluded.value',
    key,
    delta
  );
}
