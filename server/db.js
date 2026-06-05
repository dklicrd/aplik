// Database adapter — uses PostgreSQL when DATABASE_URL is valid, falls back to SQLite
import pkg from 'pg';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db;
let isPostgres = false;
let dbReady = false;

const DATABASE_URL = process.env.DATABASE_URL;

async function initDB() {
  if (DATABASE_URL && DATABASE_URL.startsWith('postgres')) {
    try {
      const { Pool } = pkg;
      const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 3000,
      });
      // Test connection
      await pool.query('SELECT 1');
      isPostgres = true;
      db = {
        async query(text, params = []) {
          const result = await pool.query(text, params);
          return result;
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
          const statements = text.split(';').filter(s => s.trim());
          for (const stmt of statements) {
            if (stmt) await pool.query(stmt + ';');
          }
        },
        close() { pool.end(); },
        _type: 'postgres'
      };
      console.log('📦 Using PostgreSQL');
      return;
    } catch (e) {
      console.log('⚠️ PostgreSQL connection failed, falling back to SQLite:', e.message);
    }
  }

  // SQLite fallback
  const dataDir = path.join(__dirname, '..', 'data');
  try { fs.mkdirSync(dataDir, { recursive: true }); } catch(e){}
  const sqliteDb = new Database(path.join(dataDir, 'aplik.db'));
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');

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
    _type: 'sqlite'
  };
  console.log('📦 Using SQLite (fallback)');
}

export { initDB, db, isPostgres, dbReady };