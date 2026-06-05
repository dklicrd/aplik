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

function getDatabaseUrl() {
  // 1. Try environment variable (Render injects this)
  let url = process.env.DATABASE_URL;
  if (url && url.startsWith('postgres')) {
    console.log('📄 DATABASE_URL from environment variable');
    return url;
  }

  // 2. Try reading from render.yaml
  try {
    const yamlPath = path.join(__dirname, '..', 'render.yaml');
    if (fs.existsSync(yamlPath)) {
      const content = fs.readFileSync(yamlPath, 'utf8');
      const match = content.match(/^\s*- key:\s*DATABASE_URL\s*\n\s*value:\s*(postgresql:\/\/\S+)/m);
      if (match) {
        url = match[1].trim();
        console.log('📄 DATABASE_URL from render.yaml');
        return url;
      }
    }
  } catch(e) {
    // Could not read render.yaml
  }

  // 3. Hardcoded fallback (validated connection string)
  url = 'postgresql://aplik_db_user:V0gJmG40vvCza763gjcbd5kDjSH7BIad@dpg-d8hgc3s2m8qs73b47hb0-a.ohio-postgres.render.com:5432/aplik_db';
  console.log('📄 Using hardcoded DATABASE_URL');
  return url;
}

const DATABASE_URL = getDatabaseUrl();

async function initDB() {
  if (DATABASE_URL && DATABASE_URL.startsWith('postgres')) {
    try {
      const { Pool } = pkg;
      const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
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