-- Aplik Dashboard — Universal Seed (PostgreSQL + SQLite)
-- Note: SQLite uses INTEGER PRIMARY KEY AUTOINCREMENT
-- PostgreSQL uses SERIAL PRIMARY KEY (which is handled in seed.js)

-- Categories
DROP TABLE IF EXISTS categories;
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT
);

INSERT INTO categories (name, color) VALUES
  ('pintura', '#3498db'),
  ('herramienta', '#e67e22'),
  ('producto', '#2ecc71');

-- Products
DROP TABLE IF EXISTS products;
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT,
  stock REAL DEFAULT 0,
  min_stock REAL DEFAULT 3,
  unit TEXT DEFAULT 'unidad',
  price REAL DEFAULT 0,
  image_url TEXT DEFAULT ''
);

INSERT INTO products (id, name, category, stock, min_stock, unit, price) VALUES
  (1, 'Vara de 8 a 16', 'herramienta', 3, 5, 'unidad', 0),
  (2, 'Tubos Sellador Polyflex', 'producto', 91, 20, 'tubo', 0),
  (3, 'Silicone Natural Ultra Clear', 'producto', 0, 5, 'unidad', 0),
  (4, 'Rollo Lona 4mm', 'herramienta', 32, 5, 'rollo', 0),
  (5, 'Porta Rolos Extrafuerte', 'herramienta', 3, 3, 'unidad', 0),
  (6, 'Piedra de Pulir', 'herramienta', 0, 5, 'unidad', 0),
  (7, 'Motas Rugosas', 'herramienta', 6, 5, 'unidad', 0),
  (8, 'Motas Pequeñas Finas', 'herramienta', 0, 5, 'unidad', 0),
  (9, 'Motas Extra Rugosa', 'herramienta', 0, 5, 'unidad', 0),
  (10, 'Motas Anti Gota Lanco', 'herramienta', 0, 5, 'unidad', 0),
  (11, 'Malla de Refuerzo', 'producto', 1, 5, 'unidad', 0),
  (12, 'Gal Varsol', 'producto', 5.5, 3, 'galón', 0),
  (13, 'Gal Semigloss Zero 6I3-8', 'pintura', 0, 3, 'galón', 0),
  (14, 'Gal Seal Coat SW-6080', 'pintura', 0, 3, 'galón', 0),
  (15, 'Gal Seal Coat Lino', 'pintura', 0, 3, 'galón', 0),
  (16, 'Gal Seal Coat Arena del Sur', 'pintura', 0, 3, 'galón', 0),
  (17, 'Gal Masilla Crack Filler', 'producto', 1, 3, 'galón', 0),
  (18, 'Gal Lucidux Limpia Parabrisas', 'producto', 1, 2, 'galón', 0),
  (19, 'Gal Galvacon', 'producto', 0, 3, 'galón', 0),
  (20, 'Gal Durex 6L2-4 Gris', 'pintura', 0, 2, 'galón', 0),
  (21, 'Gal Durex 1P3-7 Azul Claro', 'pintura', 0, 2, 'galón', 0),
  (22, 'Gal Durex 1F3-8 Naranja Oscuro', 'pintura', 0, 2, 'galón', 0),
  (23, 'Gal Durex 1C2-8 Rosado', 'pintura', 0, 2, 'galón', 0),
  (24, 'Gal Durex 1A1-8 Morado', 'pintura', 0, 2, 'galón', 0),
  (25, 'Gal Dry Coat', 'producto', 0, 2, 'galón', 0),
  (26, 'Gal Citrus Cleaner', 'producto', 0, 2, 'galón', 0),
  (27, 'Gal CB-Crete', 'producto', 4, 3, 'galón', 0),
  (28, 'Express Lino Natural', 'pintura', 0, 3, 'cubeta', 0),
  (29, 'Espátula Plástica', 'herramienta', 0, 5, 'unidad', 0),
  (30, 'Espátula de Rosca', 'herramienta', 0, 5, 'unidad', 0),
  (31, 'Cub Urethanizer', 'producto', 0, 3, 'cubeta', 0),
  (32, 'Cub Ultra Siliconizer', 'producto', 0, 3, 'cubeta', 0),
  (33, 'Cub Total Duna', 'pintura', 6, 3, 'cubeta', 0),
  (34, 'Cub Total Blanco', 'pintura', 18, 10, 'cubeta', 0),
  (35, 'Cub Texturizada Naranja', 'pintura', 0, 3, 'cubeta', 0),
  (36, 'Cub Texturizada Blanco (Cano)', 'pintura', 0, 3, 'cubeta', 0),
  (37, 'Cub Texturizada Blanco', 'pintura', 0, 3, 'cubeta', 0),
  (38, 'Cub Texturizada Arena del Sur', 'pintura', 8, 5, 'cubeta', 0),
  (39, 'Cub Super Track', 'producto', 3, 3, 'cubeta', 0),
  (40, 'Cub Siliconizer Rojo Teja', 'producto', 0, 3, 'cubeta', 0),
  (41, 'Cub Siliconizer 1000', 'producto', 1, 3, 'cubeta', 0),
  (42, 'Cub Siliconizer', 'producto', 0, 5, 'cubeta', 0),
  (43, 'Cub Semigloss Zero 6I3-3', 'pintura', 0, 2, 'cubeta', 0),
  (44, 'Cub Seal Coat Verde Softball', 'pintura', 0, 2, 'cubeta', 0),
  (45, 'Cub Seal Coat SM2-8 Verde Modif.', 'pintura', 2, 3, 'cubeta', 0),
  (46, 'Cub Seal Coat N9-4', 'pintura', 0, 2, 'cubeta', 0),
  (47, 'Cub Seal Coat Castaño', 'pintura', 6, 5, 'cubeta', 0),
  (48, 'Cub Seal Coat Blanco', 'pintura', 0, 3, 'cubeta', 0),
  (49, 'Cub Seal Coat 6L2-7', 'pintura', 2, 3, 'cubeta', 0),
  (50, 'Cub Seal Coat 6L2-6', 'pintura', 1, 3, 'cubeta', 0),
  (51, 'Cub Protecto Coat N8-4 Mindful', 'pintura', 0, 2, 'cubeta', 0),
  (52, 'Cub Protecto Coat Blanco Mate', 'pintura', 2, 3, 'cubeta', 0),
  (53, 'Cub Protecto Coat Arena del Sur', 'pintura', 0, 3, 'cubeta', 0),
  (54, 'Cub Protecto Coat 6L2-4', 'pintura', 0.75, 3, 'cubeta', 0),
  (55, 'Cub Protecto Coat 6J2-4', 'pintura', 1, 3, 'cubeta', 0),
  (56, 'Cub Primer Super', 'producto', 0, 5, 'cubeta', 0),
  (57, 'Cub Primer Sealer', 'producto', 5, 5, 'cubeta', 0),
  (58, 'Cub Preseal', 'producto', 0, 3, 'cubeta', 0),
  (59, 'Cub Microtop', 'producto', 0, 10, 'cubeta', 0),
  (60, 'Cub Maxima Armor 6L2-7', 'pintura', 0, 2, 'cubeta', 0),
  (61, 'Cub Maxima Armor 3R1-8', 'pintura', 0, 2, 'cubeta', 0),
  (62, 'Cub Level Tech', 'producto', 0, 3, 'cubeta', 0),
  (63, 'Cub Express Arena del Sur', 'pintura', 0, 5, 'cubeta', 0),
  (64, 'Cub Express 6L2-4 Gris Sambil', 'pintura', 0, 2, 'cubeta', 0),
  (65, 'Cub Duraflex', 'producto', 0, 5, 'cubeta', 0),
  (66, 'Cub Cover Up Arena del Sur', 'pintura', 0, 3, 'cubeta', 0),
  (67, 'Cub Cemento Plástico', 'producto', 0, 5, 'cubeta', 0),
  (68, 'Cub CB-Crete', 'producto', 0, 3, 'cubeta', 0),
  (69, 'Cub CB 1000', 'producto', 0, 3, 'cubeta', 0),
  (70, 'Cub Aquaproof Wall', 'producto', 0, 3, 'cubeta', 0),
  (71, 'Cub Aquaproof Primer', 'producto', 0, 3, 'cubeta', 0),
  (72, 'Cub Aluminio', 'pintura', 0, 5, 'cubeta', 0),
  (73, 'Cub Acrylflex', 'producto', 0, 3, 'cubeta', 0),
  (74, 'Cinta Multi Seal', 'producto', 0, 5, 'unidad', 0),
  (75, 'Cinta Ever Seal', 'producto', 0, 5, 'unidad', 0),
  (76, 'Caja Masilla Joint Compound', 'producto', 0, 5, 'caja', 0),
  (77, 'Rollo de Malla', 'herramienta', 0, 3, 'rollo', 0);

-- Employees
DROP TABLE IF EXISTS employees;
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT,
  type_label TEXT,
  project TEXT,
  salary REAL,
  discounts REAL DEFAULT 0
);

INSERT INTO employees (id, name, type, type_label, project, salary, discounts) VALUES
  (1, 'Mars', 'A', 'Buen Pintor', 'PYG', 1350, 500),
  (2, 'Alann', 'A', 'Buen Pintor', 'Luxury', 1350, 1500),
  (3, 'Luxama', 'A', 'Buen Pintor', 'PYG', 1400, 500),
  (4, 'Casimir', 'A', 'Buen Pintor', 'PYG', 1300, 1100),
  (5, 'Jonas', 'A', 'Buen Pintor', 'Luxury', 1300, 500),
  (6, 'Remy', 'A', 'Buen Pintor', 'PYG', 1200, 500),
  (7, 'Stanly', 'A', 'Buen Pintor', 'PYG', 1100, 1100),
  (8, 'Louis', 'B', 'Pintor Intermedio', 'PYG', 1100, 600),
  (9, 'Edwen', 'A', 'Buen Pintor', 'PYG', 1100, 500),
  (10, 'Brebison', 'A', 'Buen Pintor', 'PYG', 1100, 500),
  (11, 'Wender', 'B', 'Pintor Intermedio', 'PYG', 1200, 0),
  (12, 'Daniel', 'B', 'Pintor Intermedio', 'Luxury', 1100, 1100),
  (13, 'Ronaldino', 'B', 'Pintor Intermedio', 'PYG', 1100, 500),
  (14, 'Vilasson', 'B', 'Pintor Intermedio', 'PYG', 1100, 500),
  (15, 'Tito', 'C', 'Aprendiz', 'Luxury', 1100, 600),
  (16, 'Fenel', 'M', 'Masillero', 'Luxury', 1100, 500),
  (17, 'Florvil', 'M', 'Masillero', 'Luxury', 1800, 600),
  (18, 'Wilken', 'C', 'Aprendiz', 'PYG', 1800, 600),
  (19, 'Junior', 'C', 'Aprendiz', 'PYG', 1100, 0),
  (20, 'Michelet', 'M', 'Masillero', 'Luxury', 1100, 0),
  (21, 'Pierre', 'M', 'Masillero', 'Luxury', 1800, 0),
  (22, 'Joseph Osse', 'M', 'Masillero', 'Luxury', 1800, 0),
  (23, 'Widmacky', 'C', 'Aprendiz', 'PYG', 1800, 0),
  (24, 'Luvin', 'C', 'Aprendiz', 'Luxury', 1800, 600),
  (25, 'Dales', 'C', 'Aprendiz', 'PYG', 1100, 0),
  (26, 'Edelson', 'C', 'Aprendiz', 'PYG', 1100, 0),
  (27, 'Samuel', 'B', 'Pintor Intermedio', 'PYG', 1100, 600),
  (28, 'Guimi', 'C', 'Aprendiz', 'PYG', 1100, 600);

-- Movements
DROP TABLE IF EXISTS movements;
CREATE TABLE IF NOT EXISTS movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  product_id INTEGER,
  product TEXT,
  qty REAL,
  date TEXT,
  destination TEXT,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO movements (id, type, product_id, product, qty, date, destination, note) VALUES
  (1, 'entrada', 59, 'Cub Microtop', 12, '2026-03-10', NULL, 'Compra Lanco'),
  (2, 'entrada', 63, 'Cub Express Arena del Sur', 18, '2026-03-10', NULL, 'Compra Lanco'),
  (3, 'entrada', 65, 'Cub Duraflex', 3, '2026-03-11', NULL, 'Devolución de Sambil'),
  (4, 'entrada', 63, 'Cub Express Arena del Sur', 20, '2026-03-11', NULL, 'Compra Lanco'),
  (5, 'entrada', 28, 'Express Lino Natural', 4, '2026-03-11', NULL, 'Compra Lanco'),
  (6, 'salida', 34, 'Cub Total Blanco', 4, '2026-03-07', 'Centro Olímpico', NULL),
  (7, 'salida', 59, 'Cub Microtop', 2, '2026-03-09', 'Centro Olímpico', NULL),
  (8, 'salida', 57, 'Cub Primer Sealer', 2, '2026-03-09', 'Centro Olímpico', NULL);

-- Attendance
DROP TABLE IF EXISTS attendance;
CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER,
  day INTEGER,
  value REAL DEFAULT 0,
  period TEXT
);

INSERT INTO attendance (employee_id, day, value, period) VALUES
  (1, 1, 0, '2026-06-1ra'), (1, 2, 0, '2026-06-1ra'), (1, 3, 1, '2026-06-1ra'),
  (2, 1, 1, '2026-06-1ra'), (2, 2, 1, '2026-06-1ra'), (2, 3, 1, '2026-06-1ra'),
  (3, 1, 1, '2026-06-1ra'), (3, 2, 1, '2026-06-1ra'), (3, 3, 1, '2026-06-1ra'),
  (4, 1, 0, '2026-06-1ra'), (4, 2, 1, '2026-06-1ra'), (4, 3, 1, '2026-06-1ra'),
  (5, 1, 1, '2026-06-1ra'), (5, 2, 1, '2026-06-1ra'), (5, 3, 1, '2026-06-1ra'),
  (6, 1, 0, '2026-06-1ra'), (6, 2, 1, '2026-06-1ra'), (6, 3, 1, '2026-06-1ra'),
  (7, 1, 1, '2026-06-1ra'), (7, 2, 1, '2026-06-1ra'), (7, 3, 1, '2026-06-1ra'),
  (8, 1, 1, '2026-06-1ra'), (8, 2, 1, '2026-06-1ra'), (8, 3, 1, '2026-06-1ra'),
  (9, 1, 1, '2026-06-1ra'), (9, 2, 1, '2026-06-1ra'), (9, 3, 1, '2026-06-1ra'),
  (10, 1, 1, '2026-06-1ra'), (10, 2, 1, '2026-06-1ra'), (10, 3, 1, '2026-06-1ra'),
  (11, 1, 0, '2026-06-1ra'), (11, 2, 1, '2026-06-1ra'), (11, 3, 1, '2026-06-1ra'),
  (12, 1, 1, '2026-06-1ra'), (12, 2, 0, '2026-06-1ra'), (12, 3, 0, '2026-06-1ra'),
  (13, 1, 0.5, '2026-06-1ra'), (13, 2, 1, '2026-06-1ra'), (13, 3, 1, '2026-06-1ra'),
  (14, 1, 1, '2026-06-1ra'), (14, 2, 1, '2026-06-1ra'), (14, 3, 1, '2026-06-1ra'),
  (15, 1, 1, '2026-06-1ra'), (15, 2, 1, '2026-06-1ra'), (15, 3, 1, '2026-06-1ra'),
  (16, 1, 1, '2026-06-1ra'), (16, 2, 0, '2026-06-1ra'), (16, 3, 1, '2026-06-1ra'),
  (17, 1, 1, '2026-06-1ra'), (17, 2, 0, '2026-06-1ra'), (17, 3, 1, '2026-06-1ra'),
  (18, 1, 1, '2026-06-1ra'), (18, 2, 0.5, '2026-06-1ra'), (18, 3, 1, '2026-06-1ra'),
  (19, 1, 1, '2026-06-1ra'), (19, 2, 1, '2026-06-1ra'), (19, 3, 1, '2026-06-1ra'),
  (20, 1, 1, '2026-06-1ra'), (20, 2, 1, '2026-06-1ra'), (20, 3, 1, '2026-06-1ra'),
  (21, 1, 1, '2026-06-1ra'), (21, 2, 1, '2026-06-1ra'), (21, 3, 1, '2026-06-1ra'),
  (22, 1, 0.5, '2026-06-1ra'), (22, 2, 1, '2026-06-1ra'), (22, 3, 1, '2026-06-1ra'),
  (23, 1, 1, '2026-06-1ra'), (23, 2, 1, '2026-06-1ra'), (23, 3, 1, '2026-06-1ra'),
  (24, 1, 1, '2026-06-1ra'), (24, 2, 1, '2026-06-1ra'), (24, 3, 1, '2026-06-1ra'),
  (25, 1, 1, '2026-06-1ra'), (25, 2, 1, '2026-06-1ra'), (25, 3, 1, '2026-06-1ra'),
  (26, 1, 1, '2026-06-1ra'), (26, 2, 0, '2026-06-1ra'), (26, 3, 1, '2026-06-1ra'),
  (27, 1, 0, '2026-06-1ra'), (27, 2, 1, '2026-06-1ra'), (27, 3, 1, '2026-06-1ra'),
  (28, 1, 1, '2026-06-1ra'), (28, 2, 1, '2026-06-1ra'), (28, 3, 1, '2026-06-1ra');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  permissions TEXT DEFAULT '{}',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  code TEXT,
  location TEXT,
  status TEXT DEFAULT 'activo',
  budget REAL DEFAULT 0,
  start_date TEXT,
  end_date TEXT,
  client TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO projects (id, name, code, location, status, budget, client, notes) VALUES
  (1, 'Proyecto PYG', 'PYG', 'Santo Domingo', 'activo', 500000, 'PYG Construcciones', 'Proyecto principal'),
  (2, 'Proyecto Luxury', 'LUX', 'Santo Domingo', 'activo', 750000, 'Luxury Homes', 'Acabados de lujo');

-- Warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'almacen',
  location TEXT,
  project_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO warehouses (id, name, type, location) VALUES
  (1, 'Almacén Central', 'central', 'Santo Domingo'),
  (2, 'Almacén Secundario', 'secundario', 'Zona Industrial');

-- Inventory transfers
CREATE TABLE IF NOT EXISTS transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  product_name TEXT,
  qty REAL NOT NULL,
  from_location TEXT,
  to_location TEXT,
  from_type TEXT,
  to_type TEXT,
  date TEXT DEFAULT CURRENT_TIMESTAMP,
  note TEXT
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  project_name TEXT,
  client_name TEXT,
  total REAL DEFAULT 0,
  status TEXT DEFAULT 'borrador',
  items TEXT DEFAULT '[]',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);