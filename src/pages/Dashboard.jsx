import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, Package, Users, DollarSign, TrendingUp, RefreshCw, FolderKanban, ClipboardList } from 'lucide-react';
import { getProducts, getEmployees, getMovements, getCategories } from '../utils/api';

const API = 'https://aplik-dashboard.onrender.com';
const COLORS = ['#3498db', '#e67e22', '#2ecc71', '#e74c3c', '#9b59b6', '#1abc9c', '#f39c12', '#2980b9'];

function LowStockTable({ products }) {
  const low = products.filter(p => Number(p.stock) <= Number(p.min_stock)).sort((a, b) => Number(a.stock) - Number(b.stock)).slice(0, 10);
  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-header">
        <h3><AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Productos con Stock Bajo</h3>
      </div>
      <div className="table-wrapper">
        <table className="card-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoria</th>
              <th>Stock Actual</th>
              <th>Stock Minimo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {low.map(p => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong></td>
                <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
                <td>{Number(p.stock)} {p.unit}</td>
                <td>{Number(p.min_stock)} {p.unit}</td>
                <td>{Number(p.stock) <= 0 ? <span className="badge badge-danger">Agotado</span> : <span className="badge badge-warning">Bajo stock</span>}</td>
              </tr>
            ))}
            {low.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#7f8c8d', padding: 20 }}>No hay alertas de stock bajo</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [movements, setMovements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [p, e, m, c] = await Promise.all([
        getProducts(), getEmployees(), getMovements(), getCategories()
      ]);
      let pr = [], bu = [];
      try {
        const prRes = await fetch(API + '/api/projects');
        pr = await prRes.json();
      } catch(_) {}
      try {
        const buRes = await fetch(API + '/api/budgets');
        bu = await buRes.json();
      } catch(_) {}
      setProducts(Array.isArray(p) ? p : []);
      setEmployees(Array.isArray(e) ? e : []);
      setMovements(Array.isArray(m) ? m : []);
      setCategories(Array.isArray(c) ? c : []);
      setProjects(Array.isArray(pr) ? pr : []);
      setBudgets(Array.isArray(bu) ? bu : []);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="page-header">
        <h2>Dashboard</h2>
        <p style={{ color: '#7f8c8d' }}>
          <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite', verticalAlign: 'middle', marginRight: 6 }} />
          Cargando datos...
        </p>
      </div>
    );
  }

  const totalProducts = products.length;
  const totalEmployees = employees.length;
  const totalProjects = projects.length;
  const lowStock = products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= Number(p.min_stock)).length;
  const outOfStock = products.filter(p => Number(p.stock) <= 0).length;
  const totalWarning = lowStock + outOfStock;
  const totalPayroll = employees.reduce((sum, e) => {
    // SD = salario mensual / 2 (quincena)
    // Bávaro = 15 días * salario diario
    if (e.project === 'Santo Domingo') {
      return sum + (Number(e.salary) / 2);
    }
    return sum + (15 * Number(e.salary));
  }, 0);
  const totalBudget = budgets.reduce((s, b) => s + Number(b.amount || 0), 0);
  const completedProjects = projects.filter(p => p.status === 'completado').length;
  const activeBudget = projects.filter(p => p.status === 'activo').reduce((s, p) => s + Number(p.budget || 0), 0);

  // Movements by month
  const movesByMonth = {};
  movements.forEach(m => {
    const month = m.date ? m.date.slice(0, 7) : '2026-06';
    if (!movesByMonth[month]) movesByMonth[month] = { month, entradas: 0, salidas: 0 };
    if (m.type === 'entrada') movesByMonth[month].entradas += Number(m.qty);
    else movesByMonth[month].salidas += Number(m.qty);
  });
  const chartData = Object.values(movesByMonth).sort((a, b) => a.month.localeCompare(b.month));

  // Stock by category
  const stockByCat = {};
  categories.forEach(c => { stockByCat[c.name] = { name: c.name, value: 0, color: c.color }; });
  products.forEach(p => {
    if (stockByCat[p.category]) stockByCat[p.category].value += Math.max(0, Number(p.stock));
  });
  const pieData = Object.values(stockByCat).filter(d => d.value > 0);

  const activeProjects = projects.filter(p => p.status === 'activo');

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Resumen general de operaciones — Aplik Ingeniería</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label"><Package size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Productos</div>
          <div className="stat-value">{totalProducts}</div>
          <div className="stat-sub">{categories.length} categorias</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><Users size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Empleados</div>
          <div className="stat-value">{totalEmployees}</div>
          <div className="stat-sub">{activeProjects.length} proyectos activos</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><FolderKanban size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Proyectos</div>
          <div className="stat-value">{totalProjects}</div>
          <div className="stat-sub">{completedProjects} completados - {activeBudget.toLocaleString('es-DO')} activos</div>
        </div>
        <div className="stat-card" style={totalWarning > 0 ? { borderLeft: '4px solid #e74c3c' } : {}}>
          <div className="stat-label"><AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Alertas de Stock</div>
          <div className="stat-value" style={{ color: totalWarning > 0 ? '#e74c3c' : '#27ae60' }}>{totalWarning}</div>
          <div className="stat-sub">{outOfStock} agotados - {lowStock} por agotar</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><DollarSign size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Nomina Quincenal (est.)</div>
          <div className="stat-value">${totalPayroll.toLocaleString('es-DO')}</div>
          <div className="stat-sub">15 dias laborables</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><ClipboardList size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Presupuesto Total</div>
          <div className="stat-value">${totalBudget.toLocaleString('es-DO')}</div>
          <div className="stat-sub">{budgets.length} presupuestos registrados</div>
        </div>
      </div>

      <div className="chart-container">
        <div className="card">
          <div className="card-header">
            <h3>Movimientos de Inventario</h3>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={v => {
                  const d = new Date(v + '-01');
                  return d.toLocaleDateString('es', { month: 'short', year: '2-digit' });
                }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="entradas" name="Entradas" fill="#27ae60" radius={[4,4,0,0]} />
                <Bar dataKey="salidas" name="Salidas" fill="#e74c3c" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: '#7f8c8d', padding: 40, textAlign: 'center' }}>No hay movimientos registrados aun</p>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Stock por Categoria</h3>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                {pieData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color || COLORS[i] }} />
                    <span style={{ textTransform: 'capitalize' }}>{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={{ color: '#7f8c8d', padding: 40, textAlign: 'center' }}>Sin datos de stock</p>
          )}
        </div>
      </div>

      {activeProjects.length > 0 ? (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <h3><ClipboardList size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Proyectos Activos</h3>
          </div>
          <div className="table-wrapper">
            <table className="card-table">
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Codigo</th>
                  <th>Ubicacion</th>
                  <th>Presupuesto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {activeProjects.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td><span className="badge badge-info">{p.code || '---'}</span></td>
                    <td>{p.location || '---'}</td>
                    <td>${Number(p.budget).toLocaleString('es-DO')}</td>
                    <td><span className="badge badge-success">Activo</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <LowStockTable products={products} />
    </div>
  );
}