import React, { useState, useEffect } from 'react';
import { getEmployees, getAttendance, updateEmployee } from '../utils/api';
import { Download, RefreshCw, Plus, Edit2, Trash2, X, Save, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const TYPES = [
  { value: 'A', label: 'Buen Pintor' },
  { value: 'B', label: 'Pintor Intermedio' },
  { value: 'C', label: 'Aprendiz' },
  { value: 'M', label: 'Masillero' },
];

export default function Nomina() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProj, setFilterProj] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'C', type_label: 'Aprendiz', project: 'PYG', salary: 1100, discounts: 0 });
  const [saving, setSaving] = useState(false);

  const getToken = () => localStorage.getItem('token');

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

  const openNew = () => {
    setEditEmp(null);
    setForm({ name: '', type: 'C', type_label: 'Aprendiz', project: 'PYG', salary: 1100, discounts: 0 });
    setShowModal(true);
  };

  const openEdit = (emp) => {
    setEditEmp(emp);
    setForm({ name: emp.name, type: emp.type, type_label: emp.type_label, project: emp.project, salary: emp.salary, discounts: emp.discounts });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editEmp) {
        await updateEmployee(editEmp.id, form);
      } else {
        const token = getToken();
        await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(form),
        });
      }
      setShowModal(false);
      await fetchData();
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (emp) => {
    if (!confirm(`¿Eliminar a ${emp.name} de la nómina? También se eliminará su asistencia.`)) return;
    try {
      const token = getToken();
      await fetch(`/api/employees/${emp.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      await fetchData();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  const handleTypeChange = (type) => {
    const t = TYPES.find(t => t.value === type);
    setForm({ ...form, type, type_label: t ? t.label : '' });
  };

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

  const exportPDF = async () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = 297;
    let y = 20;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('APLIK Ingeniería - Reporte de Nómina', 14, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Fecha: ' + new Date().toLocaleDateString('es-DO'), 14, y);
    y += 10;

    const cols = [60, 30, 25, 25, 25, 30, 25, 30];
    const headers = ['Empleado', 'Proyecto', 'Tipo', 'Salario', 'Días', 'Bruto', 'Desc.', 'Neto'];
    
    doc.setFillColor(26, 45, 69);
    doc.setTextColor(255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    let x = 14;
    headers.forEach((h, i) => {
      doc.rect(x, y - 3, cols[i], 8, 'F');
      doc.text(h, x + 2, y + 2);
      x += cols[i];
    });
    y += 8;

    doc.setTextColor(44, 62, 80);
    doc.setFont('helvetica', 'normal');
    let totalNeto = 0, totalBruto = 0, totalDesc = 0;

    filtered.forEach((emp, idx) => {
      if (y > 180) { doc.addPage(); y = 20; }
      const days = getDaysWorked(emp.id);
      const gross = getGross(emp.id, emp.salary);
      const net = gross - Number(emp.discounts || 0);
      totalBruto += gross;
      totalDesc += Number(emp.discounts || 0);
      totalNeto += net;

      if (idx % 2 === 0) {
        doc.setFillColor(240, 242, 245);
        doc.rect(14, y - 3, pageW - 28, 6, 'F');
      }
      
      const rowData = [
        emp.name.substring(0, 20), emp.project || '', emp.type || '',
        '$' + Number(emp.salary).toLocaleString('es-DO'), String(days),
        '$' + gross.toLocaleString('es-DO'),
        '$' + Number(emp.discounts || 0).toLocaleString('es-DO'),
        '$' + net.toLocaleString('es-DO')
      ];
      x = 14;
      rowData.forEach((val, i) => { doc.text(val, x + 1, y + 1); x += cols[i]; });
      y += 6;
    });

    y += 4;
    doc.setFillColor(26, 45, 69);
    doc.setTextColor(255);
    doc.setFont('helvetica', 'bold');
    doc.rect(14, y - 3, pageW - 28, 7, 'F');
    doc.text('TOTAL', 44, y + 1);
    doc.text('$' + totalBruto.toLocaleString('es-DO'), 199, y + 1);
    doc.text('$' + totalDesc.toLocaleString('es-DO'), 224, y + 1);
    doc.text('$' + totalNeto.toLocaleString('es-DO'), 254, y + 1);

    doc.save('nomina_' + new Date().toISOString().slice(0, 10) + '.pdf');
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

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={filterProj} onChange={e => setFilterProj(e.target.value)}
          style={{ padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14 }}>
          <option value="">Todos los proyectos</option>
          {projects.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Agregar Trabajador</button>
        <button className="btn btn-accent" onClick={exportCSV}><Download size={16} /> Exportar CSV</button>
        <button className="btn btn-accent" onClick={exportPDF} style={{ marginLeft: 8 }}><FileText size={16} /> Exportar PDF</button>
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
              <th></th>
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
                  <td>
                    <button className="btn btn-sm" onClick={() => openEdit(emp)} style={{ marginRight: 4 }}>
                      <Edit2 size={13} />
                    </button>
                    <button className="btn btn-sm" onClick={() => handleDelete(emp)} style={{ color: '#e74c3c' }}>
                      <Trash2 size={13} />
                    </button>
                  </td>
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
              <td></td>
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editEmp ? 'Editar Trabajador' : 'Agregar Trabajador'}</h3>
              <button className="btn btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nombre</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select value={form.type} onChange={e => handleTypeChange(e.target.value)}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.value} — {t.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Proyecto</label>
                <select value={form.project} onChange={e => setForm({...form, project: e.target.value})}>
                  {projects.map(p => <option key={p} value={p}>{p}</option>)}
                  <option value="PYG">PYG</option>
                  <option value="Luxury">Luxury</option>
                </select>
              </div>
              <div className="form-group">
                <label>Salario Diario (RD$)</label>
                <input type="number" value={form.salary} onChange={e => setForm({...form, salary: Number(e.target.value)})} min={0} />
              </div>
              <div className="form-group">
                <label>Descuento (RD$)</label>
                <input type="number" value={form.discounts} onChange={e => setForm({...form, discounts: Number(e.target.value)})} min={0} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name.trim()}>
                <Save size={14} /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}