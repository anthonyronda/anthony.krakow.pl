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
      author_name  TEXT    NOT NULL,
      author_email TEXT    NOT NULL,
      body         TEXT    NOT NULL,
      status       TEXT    NOT NULL DEFAULT 'pending',
      created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
