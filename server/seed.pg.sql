-- Aplik Dashboard — PostgreSQL Seed
-- Uses SERIAL PRIMARY KEY and PostgreSQL-compatible syntax

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT
);


INSERT INTO categories (name, color) VALUES
  ('pintura', '#3498db'),
  ('herramienta', '#e67e22'),
  ('producto', '#2ecc71')
ON CONFLICT DO NOTHING;

-- Products
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  stock REAL DEFAULT 0,
  min_stock REAL DEFAULT 3,
  unit TEXT DEFAULT 'unidad',
  price REAL DEFAULT 0,
  image_url TEXT DEFAULT ''
);

INSERT INTO products (id, name, category, stock, min_stock, unit, price_neto, price_bruto, image_url) VALUES
  (1, 'ACRYLFLEX', 'producto', 0, 3, 'cubeta', 0, 0, ''),
  (2, 'AQUAPROOF PRIMER', 'producto', 6, 3, 'cubeta', 0, 0, ''),
  (3, 'AQUAPROOF WALL', 'producto', 4, 3, 'cubeta', 0, 0, ''),
  (4, 'CB-1000', 'producto', 0, 3, 'cubeta', 0, 0, ''),
  (5, 'CB-CRETE', 'producto', 4, 3, 'galon', 0, 0, ''),
  (6, 'CEMENTO PLASTICO', 'producto', 10, 3, 'cubeta', 0, 0, ''),
  (7, 'CITRUS CLEANER', 'producto', 0, 3, 'galon', 0, 0, ''),
  (8, 'DRY COAT CLEANER', 'producto', 0, 3, 'galon', 0, 0, ''),
  (9, 'DURAFLEX', 'producto', 19, 3, 'cubeta', 0, 0, ''),
  (10, 'DUREX 1A1-8 MORADO', 'pintura', 0, 3, 'galon', 0, 0, ''),
  (11, 'DUREX 1C2-8 ROSADO', 'pintura', 0, 3, 'galon', 0, 0, ''),
  (12, 'DUREX 1F3-8 NARANJA OSCURO', 'pintura', 0, 3, 'galon', 0, 0, ''),
  (13, 'DUREX 1P3-7 AZUL CLARO', 'pintura', 0, 3, 'galon', 0, 0, ''),
  (14, 'DUREX 6L2-4 GRIS', 'pintura', 0, 3, 'galon', 0, 0, ''),
  (15, 'ESPATULA DE ROSCA', 'herramienta', 0, 3, 'unidad', 0, 0, ''),
  (16, 'ESPATULA PLASTICA', 'herramienta', 0, 3, 'unidad', 0, 0, ''),
  (17, 'EXPRESS ARENA DEL SUR', 'pintura', 0, 3, 'cubeta', 0, 0, ''),
  (18, 'EXPRESS GRIS SAMBIL', 'pintura', 0, 3, 'cubeta', 0, 0, ''),
  (19, 'EXPRESS LINO NATURAL', 'pintura', 3, 3, 'cubeta', 0, 0, ''),
  (20, 'GALVACON', 'producto', 0, 3, 'galon', 0, 0, ''),
  (21, 'LEVEL TECH', 'producto', 1, 3, 'cubeta', 0, 0, ''),
  (22, 'LONA 4MM', 'herramienta', 25, 3, 'rollo', 0, 0, ''),
  (23, 'LUCIDUX', 'producto', 0, 3, 'galon', 0, 0, ''),
  (24, 'MALLA DE REFUERZO', 'producto', 0, 3, 'rollo', 0, 0, ''),
  (25, 'MASILLA CRACK FILLER', 'producto', 0, 3, 'galon', 0, 0, ''),
  (26, 'MASILLA JOINT COMPOUND', 'producto', 1, 3, 'caja', 0, 0, ''),
  (27, 'MAXIMA ARMOR 3R1-8', 'pintura', 2.75, 3, 'cubeta', 0, 0, ''),
  (28, 'MAXIMA ARMOR 6L2-7', 'pintura', 0, 3, 'cubeta', 0, 0, ''),
  (29, 'MICROTOP', 'producto', 12, 3, 'cubeta', 0, 0, ''),
  (30, 'MOTA ANTI GOTA', 'herramienta', 0, 3, 'unidad', 0, 0, ''),
  (31, 'MOTA EXTRA RUGOSA', 'herramienta', 0, 3, 'unidad', 0, 0, ''),
  (32, 'MOTA RUGOSA', 'herramienta', 0, 3, 'unidad', 0, 0, ''),
  (33, 'PIEDRA DE PULIR', 'herramienta', 3, 3, 'unidad', 0, 0, ''),
  (34, 'PINTURA DE ALUMINIO', 'pintura', 10, 3, 'cubeta', 0, 0, ''),
  (35, 'PORTA ROLOS', 'herramienta', 0, 3, 'unidad', 0, 0, ''),
  (36, 'PRESEAL', 'producto', 0, 3, 'cubeta', 0, 0, ''),
  (37, 'PRIMER SEALER', 'producto', 6, 3, 'cubeta', 0, 0, ''),
  (38, 'PRIMER SUPER', 'producto', 10, 3, 'cubeta', 0, 0, ''),
  (39, 'PROTECTO COAT 6J2-4', 'pintura', 1.5, 3, 'cubeta', 0, 0, ''),
  (40, 'PROTECTO COAT 6L2-4', 'pintura', 0.75, 3, 'cubeta', 0, 0, ''),
  (41, 'PROTECTO COAT ARENA DEL SUR', 'pintura', 0, 3, 'cubeta', 0, 0, ''),
  (42, 'PROTECTO COAT BLANCO MATE', 'pintura', 2, 3, 'cubeta', 0, 0, ''),
  (43, 'PROTECTO COAT N8-4 MINDFUL', 'pintura', 0, 3, 'cubeta', 0, 0, ''),
  (44, 'SEAL COAT  6L2-6', 'pintura', 1, 3, 'cubeta', 0, 0, ''),
  (45, 'SEAL COAT 6L2-7', 'pintura', 2, 3, 'cubeta', 0, 0, ''),
  (46, 'SEAL COAT ARENA DEL SUR', 'pintura', 0, 3, 'galon', 0, 0, ''),
  (47, 'SEAL COAT BLANCO', 'pintura', 0, 3, 'cubeta', 0, 0, ''),
  (48, 'SEAL COAT CASTAÑO', 'pintura', 16, 3, 'cubeta', 0, 0, ''),
  (49, 'SEAL COAT LINO', 'pintura', 0, 3, 'galon', 0, 0, ''),
  (50, 'SEAL COAT N9-4', 'pintura', 0, 3, 'cubeta', 0, 0, ''),
  (51, 'SEAL COAT SM2-8 VERDE MODIFICADO', 'pintura', 12, 3, 'cubeta', 0, 0, ''),
  (52, 'SELLADOR POLYFLEX', 'producto', 82, 3, 'tubos', 0, 0, ''),
  (53, 'SEMIGLOSS ZERO 6I3-8', 'pintura', 0, 3, 'galon', 0, 0, ''),
  (54, 'SILICONIZER', 'producto', 2, 3, 'cubeta', 0, 0, ''),
  (55, 'SILICONIZER 1000', 'producto', 0, 3, 'cubeta', 0, 0, ''),
  (56, 'SILICONIZER ROJO TEJA', 'producto', 0, 3, 'cubeta', 0, 0, ''),
  (57, 'SUPER TRACK', 'producto', 0, 3, 'cubeta', 0, 0, ''),
  (58, 'TEXTURIZADA ARENA DEL SUR', 'pintura', 3, 3, 'cubeta', 0, 0, ''),
  (59, 'TEXTURIZADA BLANCO', 'pintura', 0, 3, 'cubeta', 0, 0, ''),
  (60, 'TOTAL BLANCO', 'pintura', 14, 3, 'cubeta', 0, 0, ''),
  (61, 'TOTAL DUNA', 'pintura', 0, 3, 'cubeta', 0, 0, ''),
  (62, 'ULTRA SILICONIZER', 'producto', 0, 3, 'cubeta', 0, 0, ''),
  (63, 'URETHANIZER', 'producto', 0, 3, 'cubeta', 0, 0, ''),
  (64, 'VARA DE PINTAR DE 6 A 12', 'herramienta', 2, 3, 'unidad', 0, 0, ''),
  (65, 'VARSOL', 'producto', 5, 3, 'galon', 0, 0, '')
ON CONFLICT DO NOTHING;

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  type_label TEXT,
  project TEXT,
  salary REAL,
  discounts REAL DEFAULT 0
);

INSERT INTO employees (id, name, type, type_label, project, salary, discounts) VALUES
  (1, 'Alann', 'A', 'Buen Pintor', 'Luxury', 1350, 1500),
  (2, 'Brebison', 'A', 'Buen Pintor', 'PYG', 1100, 500),
  (3, 'Casimir', 'A', 'Buen Pintor', 'PYG', 1300, 1100),
  (4, 'Dales', 'C', 'Aprendiz', 'PYG', 1100, 0),
  (5, 'Daniel', 'B', 'Pintor Intermedio', 'Luxury', 1100, 1100),
  (6, 'Edelson', 'C', 'Aprendiz', 'PYG', 1100, 0),
  (7, 'Edwen', 'A', 'Buen Pintor', 'PYG', 1100, 500),
  (8, 'Fenel', 'M', 'Masillero', 'Luxury', 1100, 500),
  (9, 'Florvil', 'M', 'Masillero', 'Luxury', 1800, 600),
  (10, 'Guimi', 'C', 'Aprendiz', 'PYG', 1100, 600),
  (11, 'Jonas', 'A', 'Buen Pintor', 'Luxury', 1300, 500),
  (12, 'Joseph Osse', 'M', 'Masillero', 'Luxury', 1800, 0),
  (13, 'Junior', 'C', 'Aprendiz', 'PYG', 1100, 0),
  (14, 'Louis', 'B', 'Pintor Intermedio', 'PYG', 1100, 600),
  (15, 'Luvin', 'C', 'Aprendiz', 'Luxury', 1800, 600),
  (16, 'Luxama', 'A', 'Buen Pintor', 'PYG', 1400, 500),
  (17, 'Mars', 'A', 'Buen Pintor', 'PYG', 1350, 500),
  (18, 'Michelet', 'M', 'Masillero', 'Luxury', 1100, 0),
  (19, 'Pierre', 'M', 'Masillero', 'Luxury', 1800, 0),
  (20, 'Remy', 'A', 'Buen Pintor', 'PYG', 1200, 500),
  (21, 'Ronaldino', 'B', 'Pintor Intermedio', 'PYG', 1100, 500),
  (22, 'Samuel', 'B', 'Pintor Intermedio', 'PYG', 1100, 600),
  (23, 'Stanly', 'A', 'Buen Pintor', 'PYG', 1100, 1100),
  (24, 'Tito', 'C', 'Aprendiz', 'Luxury', 1100, 600),
  (25, 'Vilasson', 'B', 'Pintor Intermedio', 'PYG', 1100, 500),
  (26, 'Wender', 'B', 'Pintor Intermedio', 'PYG', 1200, 0),
  (27, 'Widmacky', 'C', 'Aprendiz', 'PYG', 1800, 0),
  (28, 'Wilken', 'C', 'Aprendiz', 'PYG', 1800, 600)
ON CONFLICT DO NOTHING;

-- Movements
CREATE TABLE IF NOT EXISTS movements (
  id SERIAL PRIMARY KEY,
  type TEXT,
  product_id INTEGER,
  product TEXT,
  qty REAL,
  date TEXT,
  destination TEXT,
  note TEXT
);

INSERT INTO movements (id, type, product_id, product, qty, date, destination, note) VALUES
  (1, 'entrada', 49, 'Pintura PVA Blanca 5G', 20, '2026-05-26', 'Almacén Central', 'Compra semanal'),
  (2, 'salida', 50, 'Pintura PVA Blanca 1G', 5, '2026-05-26', 'Proyecto Luxury', 'Inicio pintura'),
  (3, 'salida', 62, 'Rodillo 1/2 para Pared', 10, '2026-05-27', 'Proyecto PYG', 'Pedido capataz'),
  (4, 'entrada', 55, 'Pintura Impermeabilizante 5G', 15, '2026-05-28', 'Almacén Central', 'Compra mayorista'),
  (5, 'transferencia', 49, 'Pintura PVA Blanca 5G', 5, '2026-05-29', 'Almacén Secundario', 'Reabastecer'),
  (6, 'salida', 51, 'Pintura Vinílica Blanca Mate 5G', 8, '2026-05-30', 'Proyecto Luxury', 'Paredes interiores'),
  (7, 'salida', 19, 'Tornillos Drywall 1 1/2', 2, '2026-05-31', 'Proyecto PYG', 'Drywall techo'),
  (8, 'salida', 55, 'Pintura Impermeabilizante 5G', 10, '2026-06-01', 'Proyecto Luxury', 'Impermeabilizar terraza')
ON CONFLICT DO NOTHING;

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  day INTEGER,
  value REAL DEFAULT 0,
  period TEXT DEFAULT '2026-06-1ra'
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
  (28, 1, 1, '2026-06-1ra'), (28, 2, 1, '2026-06-1ra'), (28, 3, 1, '2026-06-1ra')
ON CONFLICT DO NOTHING;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  permissions TEXT DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO users (username, password, role) VALUES
  ('admin', '$2b$10$0HqQjbrZ3IH6E6.HIL2QHOCgTRcsJ9LnXY7zebqq/luqu8ln.yD3C', 'admin')
ON CONFLICT DO NOTHING;

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  code TEXT,
  location TEXT,
  status TEXT DEFAULT 'activo',
  budget REAL DEFAULT 0,
  start_date TEXT,
  end_date TEXT,
  client TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO projects (name, code, location, status, budget, client, notes) VALUES
  ('Proyecto PYG', 'PYG', 'Santo Domingo', 'activo', 500000, 'PYG Construcciones', 'Proyecto principal'),
  ('Proyecto Luxury', 'LUX', 'Santo Domingo', 'activo', 750000, 'Luxury Homes', 'Acabados de lujo')
ON CONFLICT DO NOTHING;

-- Warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'almacen',
  location TEXT,
  project_id INTEGER REFERENCES projects(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO warehouses (name, type, location) VALUES
  ('Almacén Central', 'central', 'Santo Domingo'),
  ('Almacén Secundario', 'secundario', 'Zona Industrial')
ON CONFLICT DO NOTHING;

-- Inventory transfers
CREATE TABLE IF NOT EXISTS transfers (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  product_name TEXT,
  qty REAL NOT NULL,
  from_location TEXT,
  to_location TEXT,
  from_type TEXT,
  to_type TEXT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  note TEXT
);

-- Budgets table (presupuestos mejorados)
CREATE TABLE IF NOT EXISTS budgets (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  project_name TEXT,
  client_name TEXT,
  total REAL DEFAULT 0,
  status TEXT DEFAULT 'borrador',
  items TEXT DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reset sequences
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT setval('employees_id_seq', (SELECT MAX(id) FROM employees));
SELECT setval('movements_id_seq', (SELECT MAX(id) FROM movements));
SELECT setval('attendance_id_seq', (SELECT MAX(id) FROM attendance));
SELECT setval('projects_id_seq', (SELECT MAX(id) FROM projects));
SELECT setval('warehouses_id_seq', (SELECT MAX(id) FROM warehouses));