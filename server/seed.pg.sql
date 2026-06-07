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

INSERT INTO products (id, name, category, stock, min_stock, unit, price) VALUES
  (1, 'Vara de 8 a 16', 'herramienta', 3, 5, 'unidad', 0),
  (2, 'Tubos Sellador Polyflex', 'producto', 91, 20, 'tubo', 0),
  (3, 'Silicone Natural Ultra Clear', 'producto', 0, 5, 'unidad', 0),
  (4, 'Sellador Polyflex', 'producto', 59, 20, 'unidad', 0),
  (5, 'Pegamento Tapiz', 'producto', 6, 10, 'unidad', 0),
  (6, 'Pegamento Pega fácil', 'producto', 11, 10, 'unidad', 0),
  (7, 'Masilla para Pared', 'producto', 30, 10, 'unidad', 0),
  (8, 'Masilla Lista', 'producto', 20, 10, 'unidad', 0),
  (9, 'Masilla Caja Joint Compound', 'producto', 0, 5, 'caja', 0),
  (10, 'Malla para Drywall', 'producto', 3, 10, 'unidad', 0),
  (11, 'Llana para Masilla', 'herramienta', 6, 3, 'unidad', 0),
  (12, 'Lija de Drywall #60', 'producto', 50, 30, 'unidad', 0),
  (13, 'Lija para Metal #80', 'producto', 0, 30, 'unidad', 0),
  (14, 'Lija de Drywall #100', 'producto', 20, 30, 'unidad', 0),
  (15, 'Lija para Metal #120', 'producto', 18, 30, 'unidad', 0),
  (16, 'Lija Fandeli #100', 'producto', 0, 30, 'unidad', 0),
  (17, 'Canal de Drywall Liso', 'producto', 2, 10, 'unidad', 0),
  (18, 'Canal de Drywall Cepillado', 'producto', 45, 10, 'unidad', 0),
  (19, 'Tornillos Drywall 1 1/2', 'producto', 0, 3, 'caja', 0),
  (20, 'Tornillos Drywall 1 3/4', 'producto', 11, 3, 'caja', 0),
  (21, 'Tornillos Drywall 2 1/2', 'producto', 10, 3, 'caja', 0),
  (22, 'Tornillos Metal 3/4', 'producto', 9, 5, 'caja', 0),
  (23, 'Tornillos Metal 1', 'producto', 9, 3, 'caja', 0),
  (24, 'Tornillos Metal 1 1/2', 'producto', 3, 3, 'caja', 0),
  (25, 'Tornillos Metal 2', 'producto', 1, 5, 'caja', 0),
  (26, 'Tornillos Metal 2 1/2', 'producto', 9, 3, 'caja', 0),
  (27, 'Tornillos Metal 3', 'producto', 6, 3, 'caja', 0),
  (28, 'Tornillos Metal 4', 'producto', 11, 3, 'caja', 0),
  (29, 'Tornillos Techo 2 1/2', 'producto', 0, 3, 'caja', 0),
  (30, 'Rondana de Plomo', 'producto', 35, 5, 'unidad', 0),
  (31, 'Disco Flap 4 1/2', 'producto', 5, 10, 'unidad', 0),
  (32, 'Disco Corte Metal 7', 'producto', 3, 10, 'unidad', 0),
  (33, 'Disco Corte Metal 4 1/2', 'producto', 28, 10, 'unidad', 0),
  (34, 'Disco Desbaste 4 1/2', 'producto', 6, 10, 'unidad', 0),
  (35, 'Disco Copa Alambre 4 1/2', 'producto', 0, 5, 'unidad', 0),
  (36, 'Disco Lija 4 1/2 #40', 'producto', 7, 10, 'unidad', 0),
  (37, 'Disco Lija 4 1/2 #60', 'producto', 5, 10, 'unidad', 0),
  (38, 'Disco Lija 4 1/2 #80', 'producto', 6, 10, 'unidad', 0),
  (39, 'Disco Lija 4 1/2 #100', 'producto', 20, 10, 'unidad', 0),
  (40, 'Disco Lija 4 1/2 #120', 'producto', 5, 10, 'unidad', 0),
  (41, 'Guantes de Punto', 'producto', 300, 50, 'unidad', 0),
  (42, 'Guantes Carnaza', 'producto', 48, 10, 'unidad', 0),
  (43, 'Mascarilla Desechable', 'producto', 69, 30, 'unidad', 0),
  (44, 'Tapón Auditivo', 'producto', 100, 30, 'unidad', 0),
  (45, 'Tape Azul', 'producto', 59, 10, 'unidad', 0),
  (46, 'Lonchera', 'producto', 0, 5, 'unidad', 0),
  (47, 'Tirro', 'producto', 59, 5, 'unidad', 0),
  (48, 'Tape de Empaque', 'producto', 14, 10, 'unidad', 0),
  (49, 'Pintura PVA Blanca 5G', 'pintura', 39, 5, 'galon', 0),
  (50, 'Pintura PVA Blanca 1G', 'pintura', 7, 5, 'galon', 0),
  (51, 'Pintura Vinílica Blanca Mate 5G', 'pintura', 9, 5, 'galon', 0),
  (52, 'Pintura Vinílica Blanca Mate 1G', 'pintura', 10, 5, 'galon', 0),
  (53, 'Pintura Vinílica Blanco Hueso Mate 5G', 'pintura', 0, 5, 'galon', 0),
  (54, 'Pintura Vinílica Blanco Hueso Mate 1G', 'pintura', 0, 5, 'galon', 0),
  (55, 'Pintura Impermeabilizante 5G', 'pintura', 37, 5, 'galon', 0),
  (56, 'Pintura Impermeabilizante 1G', 'pintura', 0, 5, 'galon', 0),
  (57, 'Pintura Esmalte Sintético 1G', 'pintura', 27, 5, 'galon', 0),
  (58, 'Pintura Esmalte Sintético 1/4G', 'pintura', 10, 5, 'galon', 0),
  (59, 'Pintura Epóxica 1G', 'pintura', 8, 5, 'galon', 0),
  (60, 'Thinner', 'pintura', 21, 10, 'galon', 0),
  (61, 'Pintura Spray', 'pintura', 35, 20, 'unidad', 0),
  (62, 'Rodillo 1/2 para Pared', 'herramienta', 5, 10, 'unidad', 0),
  (63, 'Rodillo 3/4 para Pared', 'herramienta', 27, 10, 'unidad', 0),
  (64, 'Rodillo 1/2 para Piso', 'herramienta', 1, 5, 'unidad', 0),
  (65, 'Cepillo 2 Pulg', 'herramienta', 28, 5, 'unidad', 0),
  (66, 'Cepillo 3 Pulg', 'herramienta', 16, 5, 'unidad', 0),
  (67, 'Cepillo 4 Pulg', 'herramienta', 14, 5, 'unidad', 0),
  (68, 'Extensión de Rodillo', 'herramienta', 7, 5, 'unidad', 0),
  (69, 'Cubeta Plástica', 'herramienta', 8, 10, 'unidad', 0),
  (70, 'Espátula', 'herramienta', 8, 5, 'unidad', 0),
  (71, 'Brocha 2 Pulg', 'herramienta', 5, 5, 'unidad', 0),
  (72, 'Brocha 3 Pulg', 'herramienta', 7, 5, 'unidad', 0),
  (73, 'Brocha 4 Pulg', 'herramienta', 5, 5, 'unidad', 0),
  (74, 'Cuchilla', 'herramienta', 27, 5, 'unidad', 0),
  (75, 'Flota', 'herramienta', 13, 5, 'unidad', 0),
  (76, 'Lámpara', 'herramienta', 7, 5, 'unidad', 0),
  (77, 'Caballete', 'herramienta', 4, 5, 'unidad', 0)
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