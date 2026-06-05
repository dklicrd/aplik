import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { initDB, db as _db, isPostgres as _isP } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || 'aplik-secret-key-change-in-production';

app.use(cors());
app.use(express.json());

// Auth middleware
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// Lazy init — wait for DB before starting routes
let db, isPostgres;

async function start() {
  await initDB();
  const { db: _db, isPostgres: _isP } = await import('./db.js');
  // Re-read after initDB mutates the module
  const fresh = await import('./db.js');
  db = fresh.db;
  isPostgres = fresh.isPostgres;

  // Auto-seed — choose seed file based on engine
  try {
    const result = await db.query('SELECT COUNT(*) as c FROM products');
    if (parseInt(result.rows[0].c) === 0) {
      console.log('🌱 Seeding database...');
      const seedFile = isPostgres ? 'seed.pg.sql' : 'seed.sql';
      const sql = fs.readFileSync(path.join(__dirname, seedFile), 'utf8');
      db.exec(sql);
      console.log('✅ Seed complete');
    } else {
      console.log(`📊 Database has ${result.rows[0].c} products, skipping seed`);
    }
  } catch (e) {
    console.log('🌱 First run: seeding database...');
    const seedFile = isPostgres ? 'seed.pg.sql' : 'seed.sql';
    const sql = fs.readFileSync(path.join(__dirname, seedFile), 'utf8');
    db.exec(sql);
    console.log('✅ Seed complete');
  }

  // === AUTH ===
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (username === 'admin' && password === 'admin123') {
        const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token, user: { username, role: 'admin' } });
      }
      res.status(401).json({ error: 'Credenciales inválidas' });
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.get('/api/me', authMiddleware, (req, res) => {
    res.json({ user: req.user });
  });

  // === EMPLOYEES CRUD ===
  app.post('/api/employees', authMiddleware, async (req, res) => {
    try {
      const { name, type, type_label, project, salary, discounts } = req.body;
      if (!name) return res.status(400).json({ error: 'Nombre requerido' });
      const result = await db.query(
        'INSERT INTO employees (name, type, type_label, project, salary, discounts) VALUES (?,?,?,?,?,?)',
        [name, type || 'C', type_label || 'Aprendiz', project || 'PYG', salary || 1100, discounts || 0]
      );
      const id = result.rowCount || result.changes;
      res.status(201).json({ id, name, type, type_label, project, salary, discounts });
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.delete('/api/employees/:id', authMiddleware, async (req, res) => {
    try {
      await db.query('DELETE FROM attendance WHERE employee_id = ?', [req.params.id]);
      await db.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
      res.json({ deleted: true });
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  // === ROUTES ===

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), db: db._type });
  });

  app.get('/api/dbstats', async (req, res) => {
    try {
      const products = await db.query('SELECT COUNT(*) as c FROM products');
      const employees = await db.query('SELECT COUNT(*) as c FROM employees');
      const movements = await db.query('SELECT COUNT(*) as c FROM movements');
      const attendance = await db.query('SELECT COUNT(*) as c FROM attendance');
      res.json({
        products: products.rows[0].c,
        employees: employees.rows[0].c,
        movements: movements.rows[0].c,
        attendance: attendance.rows[0].c,
        db: db._type
      });
    } catch (e) {
      res.json({ error: e.message || String(e) });
    }
  });

  app.get('/api/products', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM products ORDER BY name');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.post('/api/products', async (req, res) => {
    try {
      const { name, category, stock, min_stock, unit } = req.body;
      const result = await db.query(
        'INSERT INTO products (name, category, stock, min_stock, unit) VALUES (?,?,?,?,?)',
        [name, category, stock, min_stock, unit]
      );
      res.status(201).json({ id: result.rowCount || result.changes, name, category, stock, min_stock, unit });
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.put('/api/products/:id', async (req, res) => {
    try {
      const { name, category, stock, min_stock, unit } = req.body;
      await db.query('UPDATE products SET name=?, category=?, stock=?, min_stock=?, unit=? WHERE id=?',
        [name, category, stock, min_stock, unit, req.params.id]);
      res.json({ id: parseInt(req.params.id), name, category, stock, min_stock, unit });
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    try {
      await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
      res.json({ deleted: true });
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.get('/api/categories', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM categories ORDER BY name');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.get('/api/employees', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM employees ORDER BY name');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.put('/api/employees/:id', async (req, res) => {
    try {
      const { name, type, type_label, project, salary, discounts } = req.body;
      await db.query('UPDATE employees SET name=?, type=?, type_label=?, project=?, salary=?, discounts=? WHERE id=?',
        [name, type, type_label, project, salary, discounts, req.params.id]);
      res.json({ id: parseInt(req.params.id), name, type, type_label, project, salary, discounts });
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.get('/api/movements', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM movements ORDER BY date DESC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.post('/api/movements', async (req, res) => {
    try {
      const { type, product_id, product, qty, date, destination, note } = req.body;
      const result = await db.query(
        'INSERT INTO movements (type, product_id, product, qty, date, destination, note) VALUES (?,?,?,?,?,?,?)',
        [type, product_id, product, qty, date, destination, note]
      );
      res.status(201).json({ id: result.changes, type, product_id, product, qty, date, destination, note });
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.get('/api/attendance', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM attendance ORDER BY employee_id, day');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.put('/api/attendance', async (req, res) => {
    try {
      const { employee_id, day, value, period } = req.body;
      await db.query('DELETE FROM attendance WHERE employee_id = ? AND day = ?', [employee_id, day]);
      await db.query('INSERT INTO attendance (employee_id, day, value, period) VALUES (?,?,?,?)',
        [employee_id, day, value, period || '2026-06-1ra']);
      res.json({ employee_id, day, value, period });
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.post('/api/reseed/force', async (req, res) => {
    try {
      const tables = ['movements', 'attendance', 'products', 'employees', 'categories'];
      for (const t of tables) {
        try { await db.query(`DELETE FROM ${t}`); } catch (e) {}
      }

      const seedFile = isPostgres ? 'seed.pg.sql' : 'seed.sql';
      const sqlFile = fs.readFileSync(path.join(__dirname, seedFile), 'utf8');
      const statements = sqlFile.split(';').filter(s => s.trim());
      let count = 0, errors = 0;
      const errorLog = [];

      for (const stmt of statements) {
        try {
          db.exec(stmt + ';');
          count++;
        } catch (e) {
          errorLog.push(e.message ? e.message.substring(0, 80) : String(e));
          errors++;
        }
      }

      let prodC = 0, empC = 0;
      try { const r = await db.query('SELECT COUNT(*) as c FROM products'); prodC = r.rows[0].c; } catch(e){}
      try { const r = await db.query('SELECT COUNT(*) as c FROM employees'); empC = r.rows[0].c; } catch(e){}

      res.json({ executed: count, errors, products: prodC, employees: empC, db: db._type, firstErrors: errorLog.slice(0, 5) });
    } catch (e) {
      res.status(500).json({ error: e.message || String(e) });
    }
  });

  // Serve frontend
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });

  app.listen(PORT, () => {
    console.log(`✅ Aplik API running on port ${PORT} (${db._type})`);
  });
}

start().catch(e => {
  console.error('❌ Failed to start:', e);
  process.exit(1);
});