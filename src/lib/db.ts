import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), 'db.sqlite');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS link_clicks (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      url    TEXT    NOT NULL UNIQUE,
      clicks INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS comments (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      page_slug    TEXT    NOT NULL,
      locale       TEXT    NOT NULL,
      anchor_text  TEXT    NOT NULL,
      range_start  INTEGER NOT NULL,
      range_end    INTEGER NOT NULL,
      context_html TEXT    NOT NULL DEFAULT '',
      author_name  TEXT    NOT NULL,
      author_email TEXT    NOT NULL,
      body         TEXT    NOT NULL,
      status       TEXT    NOT NULL DEFAULT 'pending',
      created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user (
      id             TEXT    PRIMARY KEY,
      name           TEXT    NOT NULL,
      email          TEXT    NOT NULL UNIQUE,
      emailVerified  INTEGER NOT NULL DEFAULT 0,
      image          TEXT,
      createdAt      TEXT    NOT NULL DEFAULT (datetime('now')),
      updatedAt      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS session (
      id        TEXT PRIMARY KEY,
      expiresAt TEXT    NOT NULL,
      token     TEXT    NOT NULL UNIQUE,
      createdAt TEXT    NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT    NOT NULL DEFAULT (datetime('now')),
      ipAddress TEXT,
      userAgent TEXT,
      userId    TEXT    NOT NULL REFERENCES user(id)
    );

    CREATE TABLE IF NOT EXISTS account (
      id                      TEXT PRIMARY KEY,
      accountId               TEXT NOT NULL,
      providerId              TEXT NOT NULL,
      userId                  TEXT NOT NULL REFERENCES user(id),
      password                TEXT,
      createdAt               TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt               TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS verification (
      id         TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value      TEXT NOT NULL,
      expiresAt  TEXT NOT NULL,
      createdAt  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Migration: add context_html column to existing databases that predate it
  const cols = db.prepare('PRAGMA table_info(comments)').all() as { name: string }[];
  if (!cols.some((c) => c.name === 'context_html')) {
    db.exec("ALTER TABLE comments ADD COLUMN context_html TEXT NOT NULL DEFAULT ''");
  }
}
