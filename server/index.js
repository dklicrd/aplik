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

  // === Seed default users (PostgreSQL-safe) ===
  try {
    // Try to count users — if table doesn't exist, catch creates it
    const userCount = await db.query('SELECT COUNT(*) as c FROM users');
    if (parseInt(userCount.rows[0].c) === 0) {
      const adminHash = await bcrypt.hash('admin123', 10);
      const adminPerms = JSON.stringify({ dashboard: true, inventario: true, asistencia: true, nomina: true, presupuestos: true, usuarios: true });
      if (isPostgres) {
        await db.query('INSERT INTO users (username, password, role, permissions) VALUES ($1,$2,$3,$4)',
          ['admin', adminHash, 'admin', adminPerms]);
      } else {
        await db.query('INSERT OR IGNORE INTO users (username, password, role, permissions) VALUES (?,?,?,?)',
          ['admin', adminHash, 'admin', adminPerms]);
      }
      console.log('✅ Admin user seeded');
    }
  } catch (e) {
    console.log('⚠️ Users seed failed (table may not exist yet):', e.message);
  }

  // === AUTH ===
  function pgParams(sql, params) {
    if (!isPostgres) return { text: sql, params };
    let i = 0;
    return { text: sql.replace(/\?/g, () => `$${++i}`), params };
  }

  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const q = pgParams('SELECT * FROM users WHERE username = ?', [username]);
      const userResult = await db.query(q.text, q.params);
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (match) {
          const permissions = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
          const token = jwt.sign({
            id: user.id,
            username: user.username,
            role: user.role,
            permissions
          }, JWT_SECRET, { expiresIn: '24h' });
          return res.json({ token, user: { id: user.id, username: user.username, role: user.role, permissions } });
        }
      }
      // Fallback admin hardcoded
      if (username === 'admin' && password === 'admin123') {
        const defaultPerms = { dashboard: true, inventario: true, asistencia: true, nomina: true, presupuestos: true, usuarios: true };
        const token = jwt.sign({ username, role: 'admin', permissions: defaultPerms }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token, user: { username, role: 'admin', permissions: defaultPerms } });
      }
      res.status(401).json({ error: 'Credenciales inválidas' });
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.get('/api/me', authMiddleware, (req, res) => {
    res.json({ user: req.user });
  });

  // === USERS CRUD (admin only) ===
  app.get('/api/users', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Solo administradores' });
    try {
      const result = await db.query('SELECT id, username, role, permissions, created_at FROM users ORDER BY id');
      res.json(result.rows.map(u => ({
        ...u,
        permissions: typeof u.permissions === 'string' ? JSON.parse(u.permissions) : u.permissions
      })));
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.post('/api/users', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Solo administradores' });
    try {
      const { username, password, role, permissions } = req.body;
      if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
      const hashed = await bcrypt.hash(password, 10);
      const perms = permissions || '{"dashboard":true,"inventario":true,"asistencia":true,"nomina":true,"presupuestos":true,"usuarios":false}';
      const q = pgParams('INSERT INTO users (username, password, role, permissions) VALUES (?,?,?,?)',
        [username, hashed, role || 'user', typeof perms === 'string' ? perms : JSON.stringify(perms)]);
      const result = await db.query(q.text, q.params);
      const id = result.rowCount || result.changes;
      res.status(201).json({ id, username, role: role || 'user' });
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.put('/api/users/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Solo administradores' });
    try {
      const { username, password, role, permissions } = req.body;
      const perms = typeof permissions === 'string' ? permissions : JSON.stringify(permissions);
      if (password) {
        const hashed = await bcrypt.hash(password, 10);
        const q = pgParams('UPDATE users SET username=?, password=?, role=?, permissions=? WHERE id=?',
          [username, hashed, role, perms, req.params.id]);
        await db.query(q.text, q.params);
      } else {
        const q = pgParams('UPDATE users SET username=?, role=?, permissions=? WHERE id=?',
          [username, role, perms, req.params.id]);
        await db.query(q.text, q.params);
      }
      res.json({ id: parseInt(req.params.id), username, role });
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.delete('/api/users/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Solo administradores' });
    try {
      const q = pgParams('DELETE FROM users WHERE id = ?', [req.params.id]);
      await db.query(q.text, q.params);
      res.json({ deleted: true });
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  // === PROJECTS CRUD ===
  app.get('/api/projects', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM projects ORDER BY name');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.post('/api/projects', authMiddleware, async (req, res) => {
    try {
      const { name, code, location, status, budget, client, notes } = req.body;
      if (!name) return res.status(400).json({ error: 'Nombre requerido' });
      const q = pgParams('INSERT INTO projects (name, code, location, status, budget, client, notes) VALUES (?,?,?,?,?,?,?)',
        [name, code || '', location || '', status || 'activo', budget || 0, client || '', notes || '']);
      const result = await db.query(q.text, q.params);
      const id = result.rowCount || result.changes;
      res.status(201).json({ id, name, code });
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.put('/api/projects/:id', authMiddleware, async (req, res) => {
    try {
      const { name, code, location, status, budget, client, notes } = req.body;
      const q = pgParams('UPDATE projects SET name=?, code=?, location=?, status=?, budget=?, client=?, notes=? WHERE id=?',
        [name, code, location, status, budget, client, notes, req.params.id]);
      await db.query(q.text, q.params);
      res.json({ id: parseInt(req.params.id) });
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.delete('/api/projects/:id', authMiddleware, async (req, res) => {
    try {
      const q = pgParams('DELETE FROM projects WHERE id = ?', [req.params.id]);
      await db.query(q.text, q.params);
      res.json({ deleted: true });
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  // === WAREHOUSES CRUD ===
  app.get('/api/warehouses', async (req, res) => {
    try {
      const result = await db.query('SELECT w.*, p.name as project_name FROM warehouses w LEFT JOIN projects p ON w.project_id = p.id ORDER BY w.name');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  // === BUDGETS ===
  app.get('/api/budgets', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM budgets ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (err) {
      res.json([]);
    }
  });

  app.post('/api/warehouses', authMiddleware, async (req, res) => {
    try {
      const { name, type, location, project_id } = req.body;
      if (!name) return res.status(400).json({ error: 'Nombre requerido' });
      const q = pgParams('INSERT INTO warehouses (name, type, location, project_id) VALUES (?,?,?,?)',
        [name, type || 'secundario', location || '', project_id || null]);
      const result = await db.query(q.text, q.params);
      const id = result.rowCount || result.changes;
      res.status(201).json({ id, name, type });
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.put('/api/warehouses/:id', authMiddleware, async (req, res) => {
    try {
      const { name, type, location, project_id } = req.body;
      const q = pgParams('UPDATE warehouses SET name=?, type=?, location=?, project_id=? WHERE id=?',
        [name, type, location, project_id || null, req.params.id]);
      await db.query(q.text, q.params);
      res.json({ id: parseInt(req.params.id) });
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.delete('/api/warehouses/:id', authMiddleware, async (req, res) => {
    try {
      const q = pgParams('DELETE FROM warehouses WHERE id = ?', [req.params.id]);
      await db.query(q.text, q.params);
      res.json({ deleted: true });
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  // === TRANSFERS ===
  app.get('/api/transfers', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM transfers ORDER BY date DESC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.post('/api/transfers', authMiddleware, async (req, res) => {
    try {
      const { product_id, product_name, qty, from_location, to_location, note } = req.body;
      const q = pgParams('INSERT INTO transfers (product_id, product_name, qty, from_location, to_location, note) VALUES (?,?,?,?,?,?)',
        [product_id, product_name, qty, from_location, to_location, note || '']);
      const result = await db.query(q.text, q.params);
      // Update product stock
      const upd = pgParams('UPDATE products SET stock = stock - ? WHERE id = ?', [qty, product_id]);
      await db.query(upd.text, upd.params);
      const id = result.rowCount || result.changes;
      res.status(201).json({ id, product_name, qty, from_location, to_location });
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  // === EXPORT PDF (simple JSON endpoint, frontend generates PDF) ===
  app.get('/api/nomina/export', async (req, res) => {
    try {
      const employees = await db.query('SELECT * FROM employees ORDER BY name');
      const attendance = await db.query('SELECT * FROM attendance ORDER BY employee_id, day');
      const attMap = {};
      for (const a of attendance.rows) {
        attMap[a.employee_id] = (attMap[a.employee_id] || 0) + Number(a.value);
      }
      const rows = employees.rows.map(e => ({
        name: e.name,
        project: e.project,
        type: e.type,
        type_label: e.type_label,
        salary: e.salary,
        days: attMap[e.id] || 0,
        gross: (attMap[e.id] || 0) * Number(e.salary),
        discount: Number(e.discounts || 0),
        net: ((attMap[e.id] || 0) * Number(e.salary)) - Number(e.discounts || 0)
      }));
      const total = rows.reduce((s, r) => s + r.net, 0);
      res.json({ rows, total, date: new Date().toISOString().slice(0, 10) });
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
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