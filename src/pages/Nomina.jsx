import React, { useState, useEffect } from 'react';
import { getEmployees, getAttendance } from '../utils/api';
import { Download, RefreshCw } from 'lucide-react';

export default function Nomina() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProj, setFilterProj] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const [e, a] = await Promise.all([
      getEmployees().catch(() => []),
      getAttendance().catch(() => [])
    ]);
    setEmployees(e);
    setAttendance(a);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = employees.filter(e => !filterProj || e.project === filterProj);
  const projects = [...new Set(employees.map(e => e.project))];

  const getDaysWorked = (empId) => {
    const records = attendance.filter(a => a.employee_id === empId);
    return records.reduce((sum, r) => sum + Number(r.value), 0);
  };

  const getGross = (empId, salary) => getDaysWorked(empId) * Number(salary);

  const totalNomina = filtered.reduce((sum, emp) => {
    const gross = getGross(emp.id, emp.salary);
    return sum + (gross - Number(emp.discounts || 0));
  }, 0);

  const exportCSV = () => {
    let csv = 'Empleado,Proyecto,Tipo,Días,Bruto,Descuento,Neto\n';
    filtered.forEach(emp => {
      const days = getDaysWorked(emp.id);
      const gross = getGross(emp.id, emp.salary);
      const net = gross - Number(emp.discounts || 0);
      csv += `${emp.name},${emp.project},${emp.type},${days},${gross},${Number(emp.discounts)},${net}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nomina_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="page-header"><h2>Nómina</h2><p><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Cargando...</p></div>;

  return (
    <div>
      <div className="page-header">
        <h2>Nómina</h2>
        <p>Período activo</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Empleados</div>
          <div className="stat-value">{filtered.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Descuentos</div>
          <div className="stat-value" style={{ color: '#e74c3c' }}>
            ${filtered.reduce((s, e) => s + Number(e.discounts || 0), 0).toLocaleString('es-DO')}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total a Pagar (est.)</div>
          <div className="stat-value" style={{ color: '#27ae60' }}>
            ${totalNomina.toLocaleString('es-DO')}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <select value={filterProj} onChange={e => setFilterProj(e.target.value)}
          style={{ padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14 }}>
          <option value="">Todos los proyectos</option>
          {projects.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button className="btn btn-accent" onClick={exportCSV}><Download size={16} /> Exportar CSV</button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Proyecto</th>
              <th>Tipo</th>
              <th>Salario Diario</th>
              <th>Días Trab.</th>
              <th>Bruto</th>
              <th>Descuento</th>
              <th>Neto a Pagar</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(emp => {
              const days = getDaysWorked(emp.id);
              const gross = getGross(emp.id, emp.salary);
              const net = gross - Number(emp.discounts || 0);
              return (
                <tr key={emp.id}>
                  <td><strong>{emp.name}</strong></td>
                  <td>{emp.project}</td>
                  <td><span className="badge badge-info">{emp.type} — {emp.type_label}</span></td>
                  <td>${Number(emp.salary).toLocaleString('es-DO')}</td>
                  <td style={{ fontWeight: 600 }}>{days}</td>
                  <td>${gross.toLocaleString('es-DO')}</td>
                  <td style={{ color: Number(emp.discounts) > 0 ? '#e74c3c' : '#7f8c8d' }}>
                    ${Number(emp.discounts).toLocaleString('es-DO')}
                  </td>
                  <td style={{ fontWeight: 700, color: '#27ae60' }}>${net.toLocaleString('es-DO')}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f0f2f5', fontWeight: 700 }}>
              <td colSpan={5} style={{ textAlign: 'right' }}>TOTAL:</td>
              <td>${filtered.reduce((s, e) => s + getGross(e.id, e.salary), 0).toLocaleString('es-DO')}</td>
              <td style={{ color: '#e74c3c' }}>${filtered.reduce((s, e) => s + Number(e.discounts || 0), 0).toLocaleString('es-DO')}</td>
              <td style={{ color: '#27ae60' }}>${totalNomina.toLocaleString('es-DO')}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {projects.map(proj => (
        <div className="card" key={proj}>
          <div className="card-header"><h3>Proyecto {proj}</h3></div>
          <table>
            <thead>
              <tr><th>Empleado</th><th>Tipo</th><th>Días</th><th>Neto</th></tr>
            </thead>
            <tbody>
              {employees.filter(e => e.project === proj).map(emp => {
                const days = getDaysWorked(emp.id);
                const net = getGross(emp.id, emp.salary) - Number(emp.discounts || 0);
                return (
                  <tr key={emp.id}>
                    <td>{emp.name}</td>
                    <td><span className="badge badge-info">{emp.type}</span></td>
                    <td>{days}</td>
                    <td style={{ fontWeight: 600 }}>${net.toLocaleString('es-DO')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      <div className="card">
        <div className="card-header"><h3>📋 Notas de Descuentos</h3></div>
        <div style={{ fontSize: 13, lineHeight: 2 }}>
          <p>• <strong>Descontar 3 quincenas</strong> a los chicos de las botas: 2 pagos de $600 y 1 pago de $500</p>
          <p>• <strong>Descontar $1,000 x quincena</strong> a Allan hasta completar $8,000 por teléfono</p>
        </div>
      </div>
    </div>
  );
}