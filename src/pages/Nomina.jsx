import React, { useState, useEffect } from 'react';
import ModuleNav from '../components/ModuleNav';
import { getEmployees, getAttendance, updateEmployee } from '../utils/api';
import { Download, RefreshCw, Plus, Edit2, Trash2, X, Save, FileText, MapPin, Info, Camera, LogOut } from 'lucide-react';
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
  const [showInactive, setShowInactive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [form, setForm] = useState({ name: '', last_name: '', type: 'C', type_label: 'Aprendiz', project: 'PYG', salary: 1100, discounts: 0, identity_doc_type: '', identity_doc_number: '', identity_doc: '', identity_image: '', other_doc_type: '', start_date: '', position: '', contract_type: 'obra', salary_type: 'diario', pay_type: 'asistencia', bonus: 0, eca_type: 'fijo', zona: 'Santo Domingo' });
  const uniqueProjects = [...new Set(employees.map(e => e.project))].filter(Boolean);
  const [saving, setSaving] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitEmp, setExitEmp] = useState(null);
  const [exitForm, setExitForm] = useState({ exit_type: 'renuncia', exit_reason: '', exit_date: new Date().toISOString().slice(0,10) });
  const [showPersonal, setShowPersonal] = useState(true);
  const [showContract, setShowContract] = useState(true);

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

  const filtered = employees.filter(e => (!filterProj || e.project === filterProj) && (showInactive || e.status !== 'baja'));
  const projects = [...new Set(employees.map(e => e.project))];

  const getDaysWorked = (empId) => {
    const records = attendance.filter(a => a.employee_id === empId);
    return records.reduce((sum, r) => sum + Number(r.value), 0);
  };

  const getGross = (empId, salary, emp) => {
    if (emp && emp.pay_type === 'resultado') {
      // ECR: monto acordado (bono, iguala o contratista)
      return Number(emp.salary || 0);
    }
    // ECA: ECA-D paga por día, ECA-F salario fijo
    if (emp && emp.eca_type === 'fijo') return Number(emp.salary || 0);
    // ECA-D: pago por día trabajado
    return getDaysWorked(empId) * Number(salary);
  };

  const totalNomina = filtered.reduce((sum, emp) => {
    const gross = getGross(emp.id, emp.salary, emp);
    return sum + (gross - Number(emp.discounts || 0));
  }, 0);

  const openNew = () => {
    setEditEmp(null);
    setForm({ name: '', last_name: '', type: 'C', type_label: 'Aprendiz', project: 'PYG', salary: 1100, discounts: 0, identity_doc_type: '', identity_doc_number: '', identity_doc: '', identity_image: '', other_doc_type: '', start_date: '', position: '', contract_type: 'obra', salary_type: 'diario', pay_type: 'asistencia', bonus: 0, eca_type: 'fijo', zona: 'Santo Domingo' });
    setShowModal(true);
  };

  const openEdit = (emp) => {
    setEditEmp(emp);
    setForm({ name: emp.name, last_name: emp.last_name || '', type: emp.type, type_label: emp.type_label, project: emp.project, salary: emp.salary, discounts: emp.discounts, identity_doc_type: emp.identity_doc_type || '', identity_doc_number: emp.identity_doc_number || emp.identity_doc || '', identity_doc: emp.identity_doc || '', identity_image: emp.identity_image || '', other_doc_type: emp.other_doc_type || '', start_date: emp.start_date || '', position: emp.position || '', contract_type: emp.contract_type || 'obra', salary_type: emp.salary_type || 'diario', pay_type: emp.pay_type || 'asistencia', bonus: emp.bonus || 0, eca_type: emp.eca_type || 'fijo', zona: emp.zona || 'Santo Domingo' });
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

  const handleExit = (emp) => {
    setExitEmp(emp);
    setExitForm({ exit_type: 'renuncia', exit_reason: '', exit_date: new Date().toISOString().slice(0,10) });
    setShowExitModal(true);
  };

  const confirmExit = async () => {
    if (!exitEmp) return;
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/employees/${exitEmp.id}/exit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(exitForm),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setShowExitModal(false);
      setExitEmp(null);
      await fetchData();
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setSaving(false);
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
      const gross = getGross(emp.id, emp.salary, emp);
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
      const gross = getGross(emp.id, emp.salary, emp);
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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2>Nómina</h2>
          <p>Período activo</p>
        </div>
        <ModuleNav />
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
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', marginLeft: 8 }}>
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
          Mostrar dados de baja
        </label>
      </div>

      {/* Nómina Santo Domingo (salario fijo mensual) */}
      {(() => {
        const sdEmps = employees.filter(e => e.project === 'Santo Domingo');
        const totalSD = sdEmps.reduce((s, e) => s + (e.salary || 0), 0);
        if (sdEmps.length === 0) return null;
        return (
          <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid #3498db' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <h3><MapPin size={16} style={{ marginRight: 6 }} />Nómina Santo Domingo</h3>
              <span style={{ fontSize: 13, color: '#7f8c8d' }}>
                {sdEmps.length} empleados · Salario fijo mensual
              </span>
            </div>
            <div className="table-wrapper"><table className="card-table" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Cargo</th>
                  <th>Salario Mensual</th>
                  <th>Esta Quincena</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {sdEmps.map(emp => {
                  const qSalary = Math.round((emp.salary || 0) / 2);
                  return (
                    <tr key={emp.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ fontWeight: 600 }}>{emp.name}</td>
                      <td>{emp.type_label || emp.type}</td>
                      <td style={{ fontWeight: 700, color: '#2980b9' }}>RD${(emp.salary || 0).toLocaleString()}</td>
                      <td style={{ color: '#2980b9', fontSize: 12 }}>
                        RD${qSalary.toLocaleString()}
                        <span style={{ color: '#999', fontSize: 10, marginLeft: 4 }}>(fijo)</span>
                      </td>
                      <td><span className="badge badge-success">Activo</span></td>
                    </tr>
                  );
                })}
                <tr style={{ background: '#eaf2f8', fontWeight: 700 }}>
                  <td colSpan={2}>TOTAL NÓMINA MENSUAL</td>
                  <td style={{ color: '#2980b9', fontSize: 14 }}>RD${totalSD.toLocaleString()}</td>
                  <td style={{ color: '#2980b9' }}>RD${(totalSD / 2).toLocaleString()} / quincena</td>
                  <td></td>
                </tr>
              </tbody>
            </table></div>
          </div>
        );
      })()}

      <div className="card">
        <div className="table-wrapper"><table className="card-table">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Cargo</th>
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
              const isEcr = emp.pay_type === 'resultado';
              const isEcaF = emp.eca_type === 'fijo';
              const days = isEcr || isEcaF ? '-' : getDaysWorked(emp.id);
              const gross = getGross(emp.id, emp.salary, emp);
              const net = gross - Number(emp.discounts || 0);
              return (
                <tr key={emp.id} style={{ opacity: emp.status === 'baja' ? 0.6 : 1 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {emp.pay_type === 'resultado' ? (
                        <span className="badge" style={{ background: '#d5f5e3', color: '#1e8449', fontSize: 9 }}>
                          {emp.eca_type === 'iguala' ? 'ECR-I' : emp.eca_type === 'contratista' ? 'ECR-C' : 'ECR-F'}
                        </span>
                      ) : emp.eca_type === 'fijo' ? (
                        <span className="badge" style={{ background: '#e8f0fe', color: '#1a73e8', fontSize: 9 }}>ECA-F</span>
                      ) : (
                        <span className="badge" style={{ background: '#fef3e2', color: '#e67e22', fontSize: 9 }}>ECA-D</span>
                      )}
                      <strong>{emp.name}</strong>
                      {emp.status === 'baja' && <span className="badge" style={{ background: '#ffeaa7', color: '#d68910', fontSize: 9 }}>Baja</span>}
                      {(emp.identity_doc || emp.position) && (
                        <span title={`
${emp.position ? 'Cargo: ' + emp.position : ''}
${emp.identity_doc ? 'Doc: ' + emp.identity_doc : ''}
${emp.contract_type === 'indefinido' ? 'Contrato indefinido' : 'Por obra'}
${emp.start_date ? 'Ingreso: ' + emp.start_date : ''}
`.trim()} style={{ cursor: 'pointer', opacity: 0.5 }}>
                          <Info size={12} />
                        </span>
                      )}
                      {emp.identity_image && (
                        <a href={emp.identity_image} target="_blank" rel="noreferrer" title="Ver documento" style={{ opacity: 0.5 }}>
                          <Camera size={12} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td>{emp.position || '—'}</td>
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
                    <button className="btn btn-sm" onClick={() => handleExit(emp)} style={{ color: '#e67e22' }}>
                      <LogOut size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f0f2f5', fontWeight: 700 }}>
              <td colSpan={5} style={{ textAlign: 'right' }}>TOTAL:</td>
              <td>${filtered.reduce((s, e) => s + getGross(e.id, e.salary, e), 0).toLocaleString('es-DO')}</td>
              <td style={{ color: '#e74c3c' }}>${filtered.reduce((s, e) => s + Number(e.discounts || 0), 0).toLocaleString('es-DO')}</td>
              <td style={{ color: '#27ae60' }}>${totalNomina.toLocaleString('es-DO')}</td>
              <td></td>
            </tr>
          </tfoot>
        </table></div>
      </div>

      {projects.map(proj => (
        <div className="card" key={proj}>
          <div className="card-header"><h3>Proyecto {proj}</h3></div>
          <div className="table-wrapper"><table className="card-table">
            <thead>
              <tr><th>Empleado</th><th>Cargo</th><th>Tipo</th><th>Días</th><th>Neto</th></tr>
            </thead>
            <tbody>
              {employees.filter(e => e.project === proj).map(emp => {
                const days = getDaysWorked(emp.id);
                const net = getGross(emp.id, emp.salary) - Number(emp.discounts || 0);
                return (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {emp.pay_type === 'resultado' ? (
                          <span className="badge" style={{ background: '#d5f5e3', color: '#1e8449', fontSize: 9 }}>
                            {emp.eca_type === 'iguala' ? 'ECR-I' : emp.eca_type === 'contratista' ? 'ECR-C' : 'ECR-F'}
                          </span>
                        ) : emp.eca_type === 'fijo' ? (
                          <span className="badge" style={{ background: '#e8f0fe', color: '#1a73e8', fontSize: 9 }}>ECA-F</span>
                        ) : (
                          <span className="badge" style={{ background: '#fef3e2', color: '#e67e22', fontSize: 9 }}>ECA-D</span>
                        )}
                        {emp.name}
                      </div>
                    </td>
                    <td>{emp.position || '—'}</td>
                    <td><span className="badge badge-info">{emp.type}</span></td>
                    <td>{days}</td>
                    <td style={{ fontWeight: 600 }}>${net.toLocaleString('es-DO')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
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
              <h3>{editEmp ? `Editar a: ${editEmp.name}${editEmp.last_name ? ' ' + editEmp.last_name : ''}` : 'Agregar Trabajador'}</h3>
              <button className="btn btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {/* ── Datos Personales ── */}
              <div style={{ marginBottom: 12, border: '1px solid #b8d4e8', borderRadius: 8, overflow: 'hidden' }}>
                <div onClick={() => setShowPersonal(!showPersonal)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#e8f4fd', cursor: 'pointer', borderBottom: showPersonal ? '1px solid #b8d4e8' : 'none', userSelect: 'none' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1a5276' }}>📋 Datos Personales</span>
                  <span style={{ fontSize: 12, color: '#5a8db0', transform: showPersonal ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                </div>
                {showPersonal && (
                  <div style={{ padding: '12px 14px' }}>
                    <div className="form-group">
                      <label>Nombres *</label>
                      <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nombres" required />
                    </div>
                    <div className="form-group">
                      <label>Apellidos</label>
                      <input type="text" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} placeholder="Apellidos" />
                    </div>
                    <div className="form-group">
                      <label>Documento de Identidad</label>
                      <select value={form.identity_doc_type} onChange={e => {
                        const t = e.target.value;
                        setForm({...form, identity_doc_type: t, identity_doc_number: '', other_doc_type: ''});
                      }} style={{ marginBottom: 8 }}>
                        <option value="">— Seleccionar tipo —</option>
                        <option value="cedula">Cédula</option>
                        <option value="pasaporte">Pasaporte</option>
                        <option value="otro">Otro</option>
                      </select>
                      {form.identity_doc_type === 'cedula' && (
                        <input type="text" value={form.identity_doc_number} onChange={e => {
                          let v = e.target.value.replace(/[^0-9-]/g, '');
                          if (v.length > 13) v = v.slice(0, 13);
                          if (v.length === 3 && !v.includes('-')) v = v + '-';
                          if (v.length === 11) { const p = v.replace(/-/g,''); if(p.length === 11) v = p.slice(0,3)+'-'+p.slice(3,10)+'-'+p.slice(10); }
                          setForm({...form, identity_doc_number: v, identity_doc: v});
                        }} placeholder="000-0000000-0" maxLength={13} />
                      )}
                      {form.identity_doc_type === 'pasaporte' && (
                        <input type="text" value={form.identity_doc_number} onChange={e => {
                          setForm({...form, identity_doc_number: e.target.value.toUpperCase(), identity_doc: e.target.value.toUpperCase()});
                        }} placeholder="Número de pasaporte" />
                      )}
                      {form.identity_doc_type === 'otro' && (
                        <>
                          <input type="text" value={form.other_doc_type} onChange={e => setForm({...form, other_doc_type: e.target.value})} placeholder="Especificar tipo de documento" style={{ marginBottom: 8 }} />
                          <input type="text" value={form.identity_doc_number} onChange={e => {
                            setForm({...form, identity_doc_number: e.target.value, identity_doc: e.target.value});
                          }} placeholder="Número de documento" />
                        </>
                      )}
                      {form.identity_doc_number && (
                        <div style={{ fontSize: 12, color: '#7f8c8d', marginTop: 4 }}>
                          {form.identity_doc_type === 'cedula' && '✓ Cédula: '}
                          {form.identity_doc_type === 'pasaporte' && '✓ Pasaporte: '}
                          {form.identity_doc_type === 'otro' && '✓ ' + form.other_doc_type + ': '}
                          {form.identity_doc_number}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>📸 Imagen del Documento</label>
                      <input type="file" accept="image/*" onChange={async e => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append('image', file);
                        try {
                          const token = getToken();
                          const res = await fetch('/api/upload/identity', {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                            body: fd
                          });
                          const data = await res.json();
                          if (data.url) setForm({...form, identity_image: data.url});
                        } catch (err) {
                          alert('Error al subir imagen: ' + err.message);
                        }
                      }} />
                      {form.identity_image && (
                        <div style={{ marginTop: 8 }}>
                          <img src={form.identity_image} alt="Documento" style={{ maxWidth: 200, maxHeight: 120, borderRadius: 6, border: '1px solid #ddd' }} />
                          <button className="btn btn-sm" style={{ marginLeft: 8, color: '#e74c3c' }} onClick={() => setForm({...form, identity_image: ''})}>✕</button>
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Fecha de Ingreso</label>
                      <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Datos del Contrato ── */}
              <div style={{ border: '1px solid #a9d6b5', borderRadius: 8, overflow: 'hidden' }}>
                <div onClick={() => setShowContract(!showContract)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#eafaf1', cursor: 'pointer', borderBottom: showContract ? '1px solid #a9d6b5' : 'none', userSelect: 'none' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1e6b3b' }}>📄 Datos del Contrato</span>
                  <span style={{ fontSize: 12, color: '#5a9e6f', transform: showContract ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                </div>
                {showContract && (
                  <div style={{ padding: '12px 14px' }}>
                    <div className="form-group">
                      <label>Zona</label>
                      <select value={form.zona} onChange={e => setForm({...form, zona: e.target.value})}>
                        <option value="Santo Domingo">Santo Domingo</option>
                        <option value="Este">Este (Bávaro / Punta Cana)</option>
                        <option value="Interno">Interno</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Proyecto</label>
                      <select value={form.project} onChange={e => setForm({...form, project: e.target.value})}>
                        {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Tipo de Contrato</label>
                      <select value={form.contract_type} onChange={e => {
                        const ct = e.target.value;
                        const st = ct === 'indefinido' ? 'mensual' : ct === 'iguala' ? 'mensual' : ct === 'contratista' ? 'diario' : 'diario';
                        setForm({...form, contract_type: ct, salary_type: st});
                      }}>
                        <option value="obra">Por obra o servicio determinado</option>
                        <option value="indefinido">Indefinido</option>
                        <option value="iguala">Iguala</option>
                        <option value="contratista">Contratista</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Posición / Cargo</label>
                      <input type="text" value={form.position} onChange={e => {
                        setForm({...form, position: e.target.value});
                      }} placeholder="Ej: Obrero, Pintor, Supervisor, Encargado, Chofer" />
                    </div>
                    {form.pay_type === 'asistencia' && form.eca_type === 'diario' && (
                      <div className="form-group">
                        <label>Tipo</label>
                        <select value={form.type} onChange={e => handleTypeChange(e.target.value)}>
                          {TYPES.map(t => <option key={t.value} value={t.value}>{t.value} — {t.label}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="form-group">
                      <label>{form.contract_type === 'indefinido' || form.contract_type === 'iguala' ? 'Salario Mensual (RD$)' : 'Salario Diario (RD$)'}</label>
                      <input type="number" value={form.salary} onChange={e => setForm({...form, salary: Number(e.target.value)})} min={0} />
                    </div>
                    <div className="form-group">
                      <label>Tipo de Pago</label>
                      <select value={form.pay_type} onChange={e => {
                        const pt = e.target.value;
                        const et = pt === 'asistencia' ? 'diario' : 'bono';
                        setForm({...form, pay_type: pt, eca_type: et});
                      }}>
                        <option value="asistencia">ECA — Controlado por Asistencia</option>
                        <option value="resultado">ECR — Controlado por Resultado</option>
                      </select>
                    </div>
                    {form.pay_type === 'asistencia' && (
                      <div className="form-group">
                        <label>Modalidad ECA</label>
                        <select value={form.eca_type} onChange={e => setForm({...form, eca_type: e.target.value})}>
                          <option value="diario">ECA-D — Pago por Día</option>
                          <option value="fijo">ECA-F — Salario Fijo</option>
                        </select>
                      </div>
                    )}
                    {form.pay_type === 'resultado' && (
                      <>
                        <div className="form-group">
                          <label>Modalidad ECR</label>
                          <select value={form.eca_type} onChange={e => setForm({...form, eca_type: e.target.value})}>
                            <option value="bono">ECR-F — Fijo</option>
                            <option value="iguala">ECR-I — Iguala</option>
                            <option value="contratista">ECR-C — Contratista</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Monto Acordado (RD$)</label>
                          <input type="number" value={form.salary} onChange={e => setForm({...form, salary: Number(e.target.value)})} min={0} />
                        </div>
                      </>
                    )}
                  </div>
                )}
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

      {showExitModal && (
        <div className="modal-overlay" onClick={() => setShowExitModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: '#e67e22' }}>🟠 Dar de Baja — {exitEmp?.name}</h3>
              <button className="btn btn-sm" onClick={() => setShowExitModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: '#7f8c8d', marginBottom: 16 }}>
                El trabajador mantendrá su asistencia registrada en la quincena actual, pero no podrá agregarse más días.
                Al cerrar la quincena, desaparecerá del período siguiente.
              </p>
              <div className="form-group">
                <label>Fecha de Salida</label>
                <input type="date" value={exitForm.exit_date} onChange={e => setExitForm({...exitForm, exit_date: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Tipo de Salida</label>
                <select value={exitForm.exit_type} onChange={e => setExitForm({...exitForm, exit_type: e.target.value})}>
                  <option value="desahucio">Desahucio</option>
                  <option value="cancelacion">Cancelación</option>
                  <option value="renuncia">Renuncia</option>
                  <option value="abandono">Abandono</option>
                </select>
              </div>
              <div className="form-group">
                <label>Justificación / Comentario</label>
                <textarea value={exitForm.exit_reason} onChange={e => setExitForm({...exitForm, exit_reason: e.target.value})}
                  rows={3} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', resize: 'vertical' }}
                  placeholder="Motivo de la salida..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowExitModal(false)}>Cancelar</button>
              <button className="btn" onClick={confirmExit} disabled={saving || !exitForm.exit_type}
                style={{ background: '#e67e22', color: 'white', fontWeight: 600 }}>
                <LogOut size={14} /> {saving ? 'Procesando...' : 'Confirmar Baja'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
