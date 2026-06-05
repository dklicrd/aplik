import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, Package, Users, DollarSign, TrendingUp } from 'lucide-react';
import { products, employees, movements, categories } from '../utils/data';

export default function Dashboard() {
  const totalProducts = products.length;
  const totalEmployees = employees.length;
  const lowStock = products.filter(p => p.stock <= p.minStock && p.stock > 0).length;
  const outOfStock = products.filter(p => p.stock <= 0).length;
  const totalWarning = lowStock + outOfStock;

  // Movimientos por mes
  const movesByMonth = {};
  movements.forEach(m => {
    const month = m.date.slice(0, 7);
    if (!movesByMonth[month]) movesByMonth[month] = { month, entradas: 0, salidas: 0 };
    if (m.type === 'entrada') movesByMonth[month].entradas += m.qty;
    else movesByMonth[month].salidas += m.qty;
  });
  const chartData = Object.values(movesByMonth).sort((a, b) => a.month.localeCompare(b.month));

  // Stock por categoría
  const stockByCat = {};
  products.forEach(p => {
    if (!stockByCat[p.category]) stockByCat[p.category] = { name: p.category, value: 0 };
    stockByCat[p.category].value += Math.max(0, p.stock);
  });
  const pieData = Object.values(stockByCat);
  const COLORS = ['#3498db', '#e67e22', '#2ecc71'];

  // Nómina total quincena
  const totalPayroll = employees.reduce((sum, e) => {
    const att = employees.find(a => a.id === e.id);
    const daysWorked = att ? att.days.reduce((a, b) => a + b, 0) : 0;
    return sum + (daysWorked * e.salary - e.discounts);
  }, 0);

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Resumen general de operaciones</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label"><Package size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Productos</div>
          <div className="stat-value">{totalProducts}</div>
          <div className="stat-sub">{categories.length} categorías</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><Users size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Empleados</div>
          <div className="stat-value">{totalEmployees}</div>
          <div className="stat-sub">2 proyectos activos</div>
        </div>
        <div className="stat-card" style={totalWarning > 0 ? { borderLeft: '4px solid #e74c3c' } : {}}>
          <div className="stat-label"><AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Alertas de Stock</div>
          <div className="stat-value" style={{ color: totalWarning > 0 ? '#e74c3c' : '#27ae60' }}>{totalWarning}</div>
          <div className="stat-sub">{outOfStock} agotados · {lowStock} por agotar</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><DollarSign size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Nómina Quincenal</div>
          <div className="stat-value">${totalPayroll.toLocaleString('es-DO')}</div>
          <div className="stat-sub">1ra quincena junio 2026</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <h3>Movimientos de Inventario</h3>
          </div>
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
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Stock por Categoría</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
            {pieData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i] }} />
                <span style={{ textTransform: 'capitalize' }}>{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <h3><AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Productos con Stock Bajo</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock Actual</th>
              <th>Stock Mínimo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {products.filter(p => p.stock <= p.minStock).sort((a, b) => a.stock - b.stock).slice(0, 10).map(p => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong></td>
                <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
                <td>{p.stock} {p.unit}</td>
                <td>{p.minStock} {p.unit}</td>
                <td>
                  {p.stock <= 0
                    ? <span className="badge badge-danger">Agotado</span>
                    : <span className="badge badge-warning">Bajo stock</span>
                  }
                </td>
              </tr>
            ))}
            {products.filter(p => p.stock <= p.minStock).length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#7f8c8d', padding: 20 }}>No hay alertas de stock bajo ✅</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}