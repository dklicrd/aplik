import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, isPostgres, translateSQL } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Auto-seed
async function seedDatabase() {
  try {
    const result = await db.query('SELECT COUNT(*) as c FROM products');
    if (parseInt(result.rows[0].c) === 0) {
      console.log('🌱 Seeding database...');
      const sql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
      db.exec(translateSQL(sql, db._type));
      console.log('✅ Seed complete');
    } else {
      console.log(`📊 Database has ${result.rows[0].c} products, skipping seed`);
    }
  } catch (e) {
    console.log('🌱 First run: seeding database...');
    try {
      const sql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
      db.exec(translateSQL(sql, db._type));
      console.log('✅ Seed complete');
    } catch (e2) {
      console.error('❌ Seed error:', e2.message);
    }
  }
}

seedDatabase();

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), db: db._type });
});

// DB Stats
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
    res.json({ error: e.message });
  }
});

// === Products ===
app.get('/api/products', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM products ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, category, stock, min_stock, unit } = req.body;
    const sql = isPostgres
      ? 'INSERT INTO products (name, category, stock, min_stock, unit) VALUES ($1,$2,$3,$4,$5) RETURNING *'
      : 'INSERT INTO products (name, category, stock, min_stock, unit) VALUES (?,?,?,?,?)';
    const result = await db.query(sql, [name, category, stock, min_stock, unit]);
    const inserted = isPostgres ? result.rows[0] : { ...req.body, id: result.changes };
    res.status(201).json(inserted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, category, stock, min_stock, unit } = req.body;
    const sql = isPostgres
      ? 'UPDATE products SET name=$1, category=$2, stock=$3, min_stock=$4, unit=$5 WHERE id=$6 RETURNING *'
      : 'UPDATE products SET name=?, category=?, stock=?, min_stock=?, unit=? WHERE id=?';
    await db.query(sql, [name, category, stock, min_stock, unit, req.params.id]);
    res.json({ id: parseInt(req.params.id), name, category, stock, min_stock, unit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Categories ===
app.get('/api/categories', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Employees ===
app.get('/api/employees', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM employees ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const { name, type, type_label, project, salary, discounts } = req.body;
    const sql = isPostgres
      ? 'UPDATE employees SET name=$1, type=$2, type_label=$3, project=$4, salary=$5, discounts=$6 WHERE id=$7'
      : 'UPDATE employees SET name=?, type=?, type_label=?, project=?, salary=?, discounts=? WHERE id=?';
    await db.query(sql, [name, type, type_label, project, salary, discounts, req.params.id]);
    res.json({ id: parseInt(req.params.id), name, type, type_label, project, salary, discounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Movements ===
app.get('/api/movements', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM movements ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/movements', async (req, res) => {
  try {
    const { type, product_id, product, qty, date, destination, note } = req.body;
    const sql = isPostgres
      ? 'INSERT INTO movements (type, product_id, product, qty, date, destination, note) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *'
      : 'INSERT INTO movements (type, product_id, product, qty, date, destination, note) VALUES (?,?,?,?,?,?,?)';
    const result = await db.query(sql, [type, product_id, product, qty, date, destination, note]);
    res.status(201).json(isPostgres ? result.rows[0] : { id: result.changes, type, product_id, product, qty, date, destination, note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Attendance ===
app.get('/api/attendance', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM attendance ORDER BY employee_id, day');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/attendance', async (req, res) => {
  try {
    const { employee_id, day, value, period } = req.body;
    if (isPostgres) {
      await db.query(
        `INSERT INTO attendance (employee_id, day, value, period) VALUES ($1,$2,$3,$4)
         ON CONFLICT (employee_id, day, period) DO UPDATE SET value = $3`,
        [employee_id, day, value, period || '2026-06-1ra']
      );
    } else {
      // SQLite: delete + insert
      await db.query('DELETE FROM attendance WHERE employee_id = ? AND day = ?', [employee_id, day]);
      await db.query('INSERT INTO attendance (employee_id, day, value, period) VALUES (?,?,?,?)',
        [employee_id, day, value, period || '2026-06-1ra']);
    }
    res.json({ employee_id, day, value, period });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Reseed ===
app.post('/api/reseed/force', async (req, res) => {
  try {
    const tables = ['movements', 'attendance', 'products', 'employees', 'categories'];
    for (const t of tables) {
      try {
        if (isPostgres) {
          await db.query(`TRUNCATE TABLE ${t} CASCADE`);
        } else {
          await db.query(`DELETE FROM ${t}`);
        }
      } catch (e) {}
    }
    if (isPostgres) {
      try { await db.query("ALTER SEQUENCE products_id_seq RESTART WITH 1"); } catch(e){}
      try { await db.query("ALTER SEQUENCE employees_id_seq RESTART WITH 1"); } catch(e){}
      try { await db.query("ALTER SEQUENCE movements_id_seq RESTART WITH 1"); } catch(e){}
    }

    const sqlFile = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    const statements = sqlFile.split(';').filter(s => s.trim());
    let count = 0, errors = 0;
    const errorLog = [];

    for (const stmt of statements) {
      try {
        db.exec(translateSQL(stmt + ';', db._type));
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
    res.status(500).json({ error: e.message });
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