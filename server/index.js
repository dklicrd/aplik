import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { initDB, db as _db, isPostgres as _isP } from './db.js';

// File upload config
const uploadDir = path.join(__dirname, '../uploads');
try { fs.mkdirSync(uploadDir, { recursive: true }); } catch (e) {}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `prod-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(path.extname(file.originalname).toLowerCase());
    cb(null, ok);
  }
});

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
    const prodCount = parseInt(result.rows[0].c);
    // Siempre forzar seed si hay menos de 37 empleados (seed desactualizado)
    let empCount = 0;
    try {
      const empResult = await db.query('SELECT COUNT(*) as c FROM employees');
      empCount = parseInt(empResult.rows[0].c);
    } catch(e) {}
    
    if (prodCount === 0 || empCount < 37) {
      console.log(`🌱 Seeding database (products=${prodCount}, employees=${empCount})...`);
      const seedFile = isPostgres ? 'seed.pg.sql' : 'seed.sql';
      const sql = fs.readFileSync(path.join(__dirname, seedFile), 'utf8');
      db.exec(sql);
      console.log('✅ Seed complete');
    } else {
      console.log(`📊 Database has ${prodCount} products, ${empCount} employees, skipping seed`);
    }
  } catch (e) {
    console.log('🌱 First run: seeding database...');
    const seedFile = isPostgres ? 'seed.pg.sql' : 'seed.sql';
    const sql = fs.readFileSync(path.join(__dirname, seedFile), 'utf8');
    db.exec(sql);
    console.log('✅ Seed complete');
  }  // === Auto-migrate: add missing columns ===
  try {
    // Check if price_neto column exists
    const colCheck = await db.query('SELECT price_neto FROM products LIMIT 1');
    console.log('✅ Column price_neto exists');
  } catch (e) {
    console.log('🔧 Migrating: adding price_neto and price_bruto columns...');
    try {
      if (isPostgres) {
        await db.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS price_neto REAL DEFAULT 0');
        await db.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS price_bruto REAL DEFAULT 0');
        await db.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT \'\'');
      } else {
        await db.query('ALTER TABLE products ADD COLUMN price_neto REAL DEFAULT 0');
        await db.query('ALTER TABLE products ADD COLUMN price_bruto REAL DEFAULT 0');
        await db.query('ALTER TABLE products ADD COLUMN image_url TEXT DEFAULT \'\'');
      }
      console.log('✅ Migration complete');
    } catch (migErr) {
      console.log('⚠️ Migration note:', migErr.message);
    }
  }

  // === Seed / ensure default admin user (PostgreSQL-safe) ===
  try {
    const adminHash = await bcrypt.hash('admin123', 10);
    const adminPerms = JSON.stringify({ dashboard: true, inventario: true, asistencia: true, nomina: true, presupuestos: true, proyectos: true, almacenes: true, usuarios: true });
    if (isPostgres) {
      await db.query(`
        INSERT INTO users (username, password, role, permissions)
        VALUES ($1, $2, 'admin', $3)
        ON CONFLICT (username) DO UPDATE SET password = $2
      `, ['admin', adminHash, adminPerms]);
    } else {
      await db.query('INSERT OR IGNORE INTO users (username, password, role, permissions) VALUES (?,?,?,?)',
        ['admin', adminHash, 'admin', adminPerms]);
    }
    console.log('✅ Admin user ensured');
  } catch (e) {
    if (e.message && e.message.includes('relation "users" does not exist')) {
      console.log('⚠️ Users table not ready yet (will be created by seed)');
    } else {
      console.error('⚠️ Admin ensure error:', e.message);
    }
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
      const q = pgParams('INSERT INTO employees (name, type, type_label, project, salary, discounts) VALUES (?,?,?,?,?,?)',
        [name, type || 'C', type_label || 'Aprendiz', project || 'PYG', salary || 1100, discounts || 0]);
      const result = await db.query(q.text, q.params);
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
      const q = pgParams('SELECT * FROM products WHERE id = ?', [req.params.id]);
      const result = await db.query(q.text, q.params);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.post('/api/products', async (req, res) => {
    try {
      const { name, category, stock, min_stock, unit, price_neto, image_url } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
      if (!category || !category.trim()) return res.status(400).json({ error: 'La categoría es obligatoria' });
      const neto = Number(price_neto) || 0;
      const bruto = Math.round(neto * 1.18 * 100) / 100;
      const q = pgParams('INSERT INTO products (name, category, stock, min_stock, unit, price_neto, price_bruto, image_url) VALUES (?,?,?,?,?,?,?,?)',
        [name, category, stock, min_stock, unit, neto, bruto, image_url || '']);
      const result = await db.query(q.text, q.params);
      res.status(201).json({ id: result.rowCount || result.changes, name, category, stock, min_stock, unit, price_neto: neto, price_bruto: bruto, image_url: image_url || '' });
    } catch (err) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.put('/api/products/:id', async (req, res) => {
    try {
      console.log('[PUT /api/products/:id] body:', JSON.stringify(req.body));
      const { name, category, stock, min_stock, unit, price_neto, image_url } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
      if (!category || !category.trim()) return res.status(400).json({ error: 'La categoría es obligatoria' });
      const neto = Number(price_neto) || 0;
      const bruto = Math.round(neto * 1.18 * 100) / 100;
      const q = pgParams('UPDATE products SET name=?, category=?, stock=?, min_stock=?, unit=?, price_neto=?, price_bruto=?, image_url=? WHERE id=?',
        [name, category, stock, min_stock, unit, neto, bruto, image_url || '', req.params.id]);
      await db.query(q.text, q.params);
      res.json({ id: parseInt(req.params.id), name, category, stock, min_stock, unit, price_neto: neto, price_bruto: bruto, image_url: image_url || '' });
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
      const { type, product_id, product_name, qty, from_warehouse_id, to_warehouse_id, project_id, project_name, note } = req.body;
      
      if (!type || !product_id || !qty) {
        return res.status(400).json({ error: 'type, product_id y qty son obligatorios' });
      }
      
      const qtyNum = Number(qty);
      if (qtyNum <= 0) return res.status(400).json({ error: 'La cantidad debe ser positiva' });
      
      if (type === 'entrada') {
        // Entrada de material a un almacén
        const wh = to_warehouse_id || from_warehouse_id;
        if (!wh) return res.status(400).json({ error: 'Se requiere warehouse_id para entrada' });
        
        // Insertar o actualizar product_stock
        if (isPostgres) {
          await db.query(
            `INSERT INTO product_stock (product_id, warehouse_id, quantity) VALUES ($1, $2, $3)
             ON CONFLICT (product_id, warehouse_id) DO UPDATE SET quantity = product_stock.quantity + $3`,
            [product_id, wh, qtyNum]
          );
        } else {
          // SQLite path
          const existing = await db.query(`SELECT id FROM product_stock WHERE product_id = ? AND warehouse_id = ?`, [product_id, wh]);
          if (existing.rows.length > 0) {
            await db.query(`UPDATE product_stock SET quantity = quantity + ? WHERE product_id = ? AND warehouse_id = ?`, [qtyNum, product_id, wh]);
          } else {
            await db.query(`INSERT INTO product_stock (product_id, warehouse_id, quantity) VALUES (?,?,?)`, [product_id, wh, qtyNum]);
          }
        }
        
        // Registrar movimiento
        const mv = await db.query(
          'INSERT INTO movements (type, product_id, product_name, qty, to_warehouse_id, note, date) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          ['entrada', product_id, product_name || '', qtyNum, wh, note || '', new Date().toISOString().split('T')[0]]
        );
        res.status(201).json({ success: true, type: 'entrada', product_id, qty: qtyNum, warehouse_id: wh });
        
      } else if (type === 'salida') {
        // Salida a proyecto o consumo
        const wh = from_warehouse_id;
        if (!wh) return res.status(400).json({ error: 'Se requiere warehouse_id (origen) para salida' });
        
        // Verificar stock suficiente
        const check = await db.query(
          'SELECT quantity FROM product_stock WHERE product_id = $1 AND warehouse_id = $2',
          [product_id, wh]
        );
        const currentStock = check.rows.length > 0 ? Number(check.rows[0].quantity) : 0;
        if (currentStock < qtyNum) {
          return res.status(400).json({ error: `Stock insuficiente en el almacén. Disponible: ${currentStock}` });
        }
        
        await db.query(
          'UPDATE product_stock SET quantity = quantity - $1 WHERE product_id = $2 AND warehouse_id = $3',
          [qtyNum, product_id, wh]
        );
        
        // Registrar movimiento
        await db.query(
          'INSERT INTO movements (type, product_id, product_name, qty, from_warehouse_id, project_id, project_name, note, date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
          ['salida', product_id, product_name || '', qtyNum, wh, project_id || null, project_name || '', note || '', new Date().toISOString().split('T')[0]]
        );
        res.status(201).json({ success: true, type: 'salida', product_id, qty: qtyNum, warehouse_id: wh, project: project_name });
        
      } else if (type === 'transferencia') {
        // Transferencia entre almacenes
        if (!from_warehouse_id || !to_warehouse_id) {
          return res.status(400).json({ error: 'Se requieren warehouse_id de origen y destino' });
        }
        
        // Verificar stock en origen
        const check = await db.query(
          'SELECT quantity FROM product_stock WHERE product_id = $1 AND warehouse_id = $2',
          [product_id, from_warehouse_id]
        );
        const currentStock = check.rows.length > 0 ? Number(check.rows[0].quantity) : 0;
        if (currentStock < qtyNum) {
          return res.status(400).json({ error: `Stock insuficiente en origen. Disponible: ${currentStock}` });
        }
        
        // Restar de origen
        await db.query(
          'UPDATE product_stock SET quantity = quantity - $1 WHERE product_id = $2 AND warehouse_id = $3',
          [qtyNum, product_id, from_warehouse_id]
        );
        
        // Sumar a destino
        if (isPostgres) {
          await db.query(
            `INSERT INTO product_stock (product_id, warehouse_id, quantity) VALUES ($1, $2, $3)
             ON CONFLICT (product_id, warehouse_id) DO UPDATE SET quantity = product_stock.quantity + $3`,
            [product_id, to_warehouse_id, qtyNum]
          );
        } else {
          const existing = await db.query(`SELECT id FROM product_stock WHERE product_id = ? AND warehouse_id = ?`, [product_id, to_warehouse_id]);
          if (existing.rows.length > 0) {
            await db.query(`UPDATE product_stock SET quantity = quantity + ? WHERE product_id = ? AND warehouse_id = ?`, [qtyNum, product_id, to_warehouse_id]);
          } else {
            await db.query(`INSERT INTO product_stock (product_id, warehouse_id, quantity) VALUES (?,?,?)`, [product_id, to_warehouse_id, qtyNum]);
          }
        }
        
        // Registrar movimiento
        await db.query(
          'INSERT INTO movements (type, product_id, product_name, qty, from_warehouse_id, to_warehouse_id, note, date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
          ['transferencia', product_id, product_name || '', qtyNum, from_warehouse_id, to_warehouse_id, note || '', new Date().toISOString().split('T')[0]]
        );
        res.status(201).json({ success: true, type: 'transferencia', product_id, qty: qtyNum, from: from_warehouse_id, to: to_warehouse_id });
        
      } else {
        res.status(400).json({ error: 'Tipo no válido. Usar: entrada, salida, transferencia' });
      }
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
      const tables = ['movements', 'attendance', 'products', 'employees', 'categories', 'users'];
      for (const t of tables) {
        try {
          if (isPostgres) {
            await db.query(`TRUNCATE TABLE ${t} RESTART IDENTITY CASCADE`);
          } else {
            await db.query(`DELETE FROM ${t}`);
          }
        } catch (e) {}
      }

      const seedFile = isPostgres ? 'seed.pg.sql' : 'seed.sql';
      const sqlFile = fs.readFileSync(path.join(__dirname, seedFile), 'utf8');
      const statements = sqlFile.split(';').filter(s => s.trim());
      let count = 0, errors = 0;
      const errorLog = [];

      for (const stmt of statements) {
        try {
          await db.query(stmt + ';');
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

  // Add a simple /api/reseed/password endpoint (no auth) to force password update
  app.post('/api/reseed/password', async (req, res) => {
    try {
      const hash = bcrypt.hashSync('admin123', 10);
      // Try update first, then insert
      try {
        await db.query('UPDATE users SET password = ? WHERE username = \'admin\'', [hash]);
        const r = await db.query('SELECT COUNT(*) as c FROM users WHERE username=\'admin\'');
        if (parseInt(r.rows[0].c) > 0) {
          return res.json({ status: 'updated', hash_verifies: bcrypt.compareSync('admin123', hash) });
        }
      } catch(e) {}
      // If no admin user, insert one
      try {
        await db.query('INSERT INTO users (username, password, role) VALUES (?,?,?)', ['admin', hash, 'admin']);
        res.json({ status: 'created', hash_verifies: bcrypt.compareSync('admin123', hash) });
      } catch(e) {
        res.status(500).json({ error: e.message || String(e) });
      }
    } catch(e) {
      res.status(500).json({ error: e.message || String(e) });
    }
  });
  app.post('/api/upload', authMiddleware, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se subió ninguna imagen' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
  });

  // Serve uploads as static files
  app.use('/uploads', express.static(uploadDir));

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