import Database from 'better-sqlite3'
import { join } from 'node:path'
import { DATA_DIR } from './env'

export const db = new Database(join(DATA_DIR, 'noel.db'))
db.pragma('journal_mode = WAL')

db.exec(`
CREATE TABLE IF NOT EXISTS mails (
  id TEXT PRIMARY KEY,
  account TEXT NOT NULL,
  uid INTEGER,
  from_name TEXT,
  from_addr TEXT,
  subject TEXT,
  date INTEGER,
  snippet TEXT,
  category TEXT,
  summary TEXT,
  reason TEXT,
  pushed INTEGER DEFAULT 0,
  created_at INTEGER
);
CREATE TABLE IF NOT EXISTS rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_type TEXT,       -- 'sender' | 'domain' | 'subject'
  value TEXT,
  category TEXT,
  created_at INTEGER
);
CREATE TABLE IF NOT EXISTS push_subs (
  endpoint TEXT PRIMARY KEY,
  p256dh TEXT,
  auth TEXT,
  created_at INTEGER
);
CREATE TABLE IF NOT EXISTS coach_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT,
  content TEXT,
  created_at INTEGER
);
CREATE TABLE IF NOT EXISTS meta ( key TEXT PRIMARY KEY, value TEXT );
`)

export type MailRow = {
  id: string; account: string; uid: number | null
  from_name: string; from_addr: string; subject: string; date: number
  snippet: string; category: string; summary: string; reason: string
  pushed: number; created_at: number
}
export type Rule = { id: number; match_type: string; value: string; category: string; created_at: number }

export const Mails = {
  exists: (id: string) => !!db.prepare('SELECT 1 FROM mails WHERE id=?').get(id),
  insert: (m: MailRow) =>
    db.prepare(`INSERT OR IGNORE INTO mails
      (id,account,uid,from_name,from_addr,subject,date,snippet,category,summary,reason,pushed,created_at)
      VALUES (@id,@account,@uid,@from_name,@from_addr,@subject,@date,@snippet,@category,@summary,@reason,@pushed,@created_at)`).run(m),
  all: () => db.prepare('SELECT * FROM mails ORDER BY date DESC').all() as MailRow[],
  byCategory: (c: string) => db.prepare('SELECT * FROM mails WHERE category=? ORDER BY date DESC').all(c) as MailRow[],
  get: (id: string) => db.prepare('SELECT * FROM mails WHERE id=?').get(id) as MailRow | undefined,
  setCategory: (id: string, category: string, reason: string) =>
    db.prepare('UPDATE mails SET category=?, reason=? WHERE id=?').run(category, reason, id),
  markPushed: (id: string) => db.prepare('UPDATE mails SET pushed=1 WHERE id=?').run(id),
  unpushedImportant: () => db.prepare("SELECT * FROM mails WHERE category='Wichtig' AND pushed=0 ORDER BY date DESC").all() as MailRow[],
  pruneOlderThan: (ts: number) => db.prepare('DELETE FROM mails WHERE date < ?').run(ts),
  reclassifyBySender: (addr: string, category: string, reason: string) =>
    db.prepare('UPDATE mails SET category=?, reason=? WHERE from_addr=?').run(category, reason, addr),
}

export const Rules = {
  all: () => db.prepare('SELECT * FROM rules ORDER BY created_at DESC').all() as Rule[],
  add: (match_type: string, value: string, category: string) =>
    db.prepare('INSERT INTO rules (match_type,value,category,created_at) VALUES (?,?,?,?)')
      .run(match_type, value.toLowerCase(), category, Date.now()),
}

export const Push = {
  all: () => db.prepare('SELECT * FROM push_subs').all() as { endpoint: string; p256dh: string; auth: string }[],
  add: (endpoint: string, p256dh: string, auth: string) =>
    db.prepare('INSERT OR REPLACE INTO push_subs (endpoint,p256dh,auth,created_at) VALUES (?,?,?,?)')
      .run(endpoint, p256dh, auth, Date.now()),
  remove: (endpoint: string) => db.prepare('DELETE FROM push_subs WHERE endpoint=?').run(endpoint),
}

export const Coach = {
  history: () => db.prepare('SELECT role,content FROM coach_messages ORDER BY id ASC').all() as { role: string; content: string }[],
  add: (role: string, content: string) =>
    db.prepare('INSERT INTO coach_messages (role,content,created_at) VALUES (?,?,?)').run(role, content, Date.now()),
}

export const Meta = {
  get: (key: string) => (db.prepare('SELECT value FROM meta WHERE key=?').get(key) as { value: string } | undefined)?.value,
  set: (key: string, value: string) => db.prepare('INSERT OR REPLACE INTO meta (key,value) VALUES (?,?)').run(key, value),
}
