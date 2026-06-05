// Database adapter — uses PostgreSQL when DATABASE_URL is set, falls back to SQLite
import pkg from 'pg';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db;
let isPostgres = false;

const DATABASE_URL = process.env.DATABASE_URL;

if (DATABASE_URL && DATABASE_URL.startsWith('postgres')) {
  // PostgreSQL mode
  const { Pool } = pkg;
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  isPostgres = true;

  db = {
    async query(text, params = []) {
      const result = await pool.query(text, params);
      return result;
    },
    async get(text, params = []) {
      const result = await pool.query(text, params);
      return result.rows[0];
    },
    async all(text, params = []) {
      const result = await pool.query(text, params);
      return result.rows;
    },
    async run(text, params = []) {
      const result = await pool.query(text, params);
      return { changes: result.rowCount };
    },
    async exec(text) {
      // Split multiple statements
      const statements = text.split(';').filter(s => s.trim());
      for (const stmt of statements) {
        await pool.query(stmt + ';');
      }
    },
    close() { pool.end(); },
    _type: 'postgres',
    _pool: pool
  };
  console.log('📦 Using PostgreSQL');
} else {
  // SQLite fallback
  const sqliteDb = new Database(path.join(__dirname, '..', 'data', 'aplik.db'));
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');
  console.log('📦 Using SQLite (fallback)');

  db = {
    query(text, params = []) {
      const isSelect = text.trim().toUpperCase().startsWith('SELECT');
      if (isSelect) {
        const stmt = sqliteDb.prepare(text);
        const rows = stmt.all(...params);
        return { rows, rowCount: rows.length };
      } else {
        const stmt = sqliteDb.prepare(text);
        const info = stmt.run(...params);
        return { rows: [], rowCount: info.changes };
      }
    },
    get(text, params = []) {
      const stmt = sqliteDb.prepare(text);
      return stmt.get(...params);
    },
    all(text, params = []) {
      const stmt = sqliteDb.prepare(text);
      return stmt.all(...params);
    },
    run(text, params = []) {
      const stmt = sqliteDb.prepare(text);
      const info = stmt.run(...params);
      return { changes: info.changes };
    },
    exec(text) {
      sqliteDb.exec(text);
    },
    close() { sqliteDb.close(); },
    _type: 'sqlite',
    _db: sqliteDb
  };
}

// Translate SQL from PostgreSQL syntax to SQLite where needed
function translateSQL(sql, target) {
  if (target !== 'sqlite') return sql;
  // Basic PostgreSQL → SQLite conversions
  let result = sql
    .replace(/RETURNING \*/g, '')
    .replace(/\\$\\d+/g, (m) => '?')
    .replace(/NOW\(\)/g, "datetime('now')")
    .replace(/CURRENT_TIMESTAMP/g, "datetime('now')")
    .replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
    .replace(/DECIMAL\([^)]+\)/g, 'REAL')
    .replace(/\\$1,\\$2,\\$3,\\$4,\\$5/g, '?,?,?,?,?')
    .replace(/\\$1,\\$2,\\$3,\\$4/g, '?,?,?,?')
    .replace(/\\$1,\\$2,\\$3/g, '?,?,?')
    .replace(/\\$1,\\$2/g, '?,?')
    .replace(/\\$1/g, '?');

  // Handle ON CONFLICT
  if (result.includes('ON CONFLICT') && !result.includes('ON CONFLICT REPLACE')) {
    result = result.replace(/ON CONFLICT[^)]+\)\s*DO NOTHING/g, '');
    result = result.replace(/ON CONFLICT[^)]+\)\s*DO UPDATE[^;]+/g, '');
  }

  return result;
}

export { db, isPostgres, translateSQL };