import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// PostgreSQL connection (from Render env vars)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Auto-seed database on first run
async function seedDatabase() {
  try {
    // Check if products table has data
    const result = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(result.rows[0].count) === 0) {
      console.log('🌱 Seeding database...');
      const sql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
      const statements = sql.split(';').filter(s => s.trim());
      for (const stmt of statements) {
        try {
          await pool.query(stmt + ';');
        } catch (e) {
          // Skip if already exists
        }
      }
      console.log('✅ Seed complete');
    } else {
      console.log(`📊 Database has ${result.rows[0].count} products, skipping seed`);
    }
  } catch (e) {
    // Tables might not exist yet, seed will run
    console.log('🌱 First run: seeding database...');
    try {
      const sql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
      const statements = sql.split(';').filter(s => s.trim());
      for (const stmt of statements) {
        try { await pool.query(stmt + ';'); } catch (e) {}
      }
      console.log('✅ Seed complete');
    } catch (e2) {
      console.error('❌ Seed error:', e2.message);
    }
  }
}

seedDatabase();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// === API Routes ===

// Products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, category, stock, min_stock, unit } = req.body;
    const result = await pool.query(
      'INSERT INTO products (name, category, stock, min_stock, unit) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, category, stock, min_stock, unit]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, category, stock, min_stock, unit } = req.body;
    const result = await pool.query(
      'UPDATE products SET name=$1, category=$2, stock=$3, min_stock=$4, unit=$5 WHERE id=$6 RETURNING *',
      [name, category, stock, min_stock, unit, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Categories
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Employees
app.get('/api/employees', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employees ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Movements
app.get('/api/movements', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM movements ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/movements', async (req, res) => {
  try {
    const { type, product_id, product, qty, date, destination, note } = req.body;
    const result = await pool.query(
      'INSERT INTO movements (type, product_id, product, qty, date, destination, note) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [type, product_id, product, qty, date, destination, note]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Attendance
app.get('/api/attendance', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM attendance ORDER BY employee_id, day');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/attendance', async (req, res) => {
  try {
    const { employee_id, day, value, period } = req.body;
    const result = await pool.query(`
      INSERT INTO attendance (employee_id, day, value, period) VALUES ($1,$2,$3,$4)
      ON CONFLICT (employee_id, day, period) DO UPDATE SET value = $3
      RETURNING *
    `, [employee_id, day, value, period || '2026-06-1ra']);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const { name, type, type_label, project, salary, discounts } = req.body;
    const result = await pool.query(
      'UPDATE employees SET name=$1, type=$2, type_label=$3, project=$4, salary=$5, discounts=$6 WHERE id=$7 RETURNING *',
      [name, type, type_label, project, salary, discounts, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve React frontend in production
app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Aplik API running on port ${PORT}`);
});