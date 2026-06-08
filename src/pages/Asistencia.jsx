import React, { useState, useEffect } from 'react';
import { getEmployees, getAttendance } from '../utils/api';
import { RefreshCw, Save, Users, MapPin } from 'lucide-react';

const API_BASE = import.meta.env.DEV ? '/api' : '/api';

const DAY_LABELS = ['Lun 1','Mar 2','Mié 3','Jue 4','Vie 5','Sáb 6','Dom 7','Lun 8','Mar 9','Mié 10','Jue 11','Vie 12','Sáb 13','Dom 14','Lun 15'];
const PROJECT_ORDER = ['Luxury', 'PYG'];

export default function Asistencia() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterProj, setFilterProj] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [edits, setEdits] = useState({});

  const fetchData = async () => {
    setLoading(true);
    const [e, a] = await Promise.all([
      getEmployees().catch(() => []),
      getAttendance().catch(() => [])
    ]);
    setEmployees(e);
    setAttendance(a);
    setEdits({});
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Separar SD de Bávaro
  const sdEmployees = employees.filter(e => e.project === 'Santo Domingo');
  const bavaroEmployees = employees.filter(e => e.project !== 'Santo Domingo');

  // Filtro por proyecto para Bávaro
  const filteredBavaro = bavaroEmployees.filter(e => !filterProj || e.project === filterProj);

  // Agrupar por proyecto en el orden definido
  const projGroups = PROJECT_ORDER.map(p => ({
    project: p,
    label: p,
    employees: filteredBavaro.filter(e => e.project === p)
  })).filter(g => g.employees.length > 0);

  const bavaroProjects = [...new Set(bavaroEmployees.map(e => e.project))];

  // Asistencia map
  const attMap = {};
  attendance.forEach(a => {
    if (!attMap[a.employee_id]) attMap[a.employee_id] = {};
    attMap[a.employee_id][a.day] = Number(a.value);
  });

  const getDayValue = (empId, day) => {
    if (edits[empId]?.[day] !== undefined) return edits[empId][day];
    return attMap[empId]?.[day] || 0;
  };

  const cycleDay = (empId, day) => {
    if (!editMode) return;
    const current = getDayValue(empId, day);
    const next = current >= 1 ? 0 : current >= 0.5 ? 1 : 0.5;
    setEdits(prev => ({
      ...prev,
      [empId]: { ...prev[empId], [day]: next }
    }));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const updates = [];
      Object.entries(edits).forEach(([empId, days]) => {
        Object.entries(days).forEach(([day, value]) => {
          updates.push(
            fetch(`${API_BASE}/attendance`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ employee_id: parseInt(empId), day: parseInt(day), value, period: '2026-06-1ra' })
            }).then(r => r.json())
          );
        });
      });
      await Promise.all(updates);
      setEdits({});
      setEditMode(false);
      fetchData();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="page-header"><h2>Asistencia</h2><p><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Cargando...</p></div>;

  const totalSD = sdEmployees.reduce((s, e) => s + (e.salary || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h2>Control de Asistencia</h2>
        <p>Período activo: 1ra quincena Junio 2026</p>
      </div>

      {/* ========== SECCIÓN SANTO DOMINGO ========== */}
      <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid #3498db' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h3><MapPin size={16} style={{ marginRight: 6 }} />Santo Domingo — Nómina Fija</h3>
          <span style={{ fontSize: 13, color: '#7f8c8d' }}>
            {sdEmployees.length} empleados · Contrato indefinido · RD${totalSD.toLocaleString()}/mes
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Cargo</th>
                <th>Salario Mensual</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {sdEmployees.map(emp => (
                <tr key={emp.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ fontWeight: 600 }}>{emp.name}</td>
                  <td>{emp.type_label || emp.type}</td>
                  <td style={{ fontWeight: 700, color: '#2980b9' }}>RD${(emp.salary || 0).toLocaleString()}</td>
                  <td><span className="badge badge-success">Activo</span></td>
                </tr>
              ))}
              <tr style={{ background: '#eaf2f8', fontWeight: 700 }}>
                <td colSpan={2}>TOTAL NÓMINA MENSUAL</td>
                <td style={{ color: '#2980b9', fontSize: 14 }}>RD${totalSD.toLocaleString()}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== SECCIÓN BÁVARO ========== */}
      <div className="card" style={{ borderLeft: '4px solid #27ae60' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h3><MapPin size={16} style={{ marginRight: 6 }} />Bávaro — Asistencia por Días</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={filterProj} onChange={e => setFilterProj(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 13 }}>
              <option value="">Todos</option>
              {bavaroProjects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11 }}>
              <span className="badge badge-info">A: Buen Pintor</span>
              <span className="badge badge-info">B: Pintor Intermedio</span>
              <span className="badge badge-info">C: Aprendiz</span>
              <span className="badge badge-info">M: Masillero</span>
            </div>
            <div>
              {editMode ? (
                <span style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-primary" onClick={saveAll} disabled={saving} style={{ padding: '6px 14px', fontSize: 13 }}>
                    <Save size={14} /> {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button className="btn" style={{ background: '#eee', padding: '6px 14px', fontSize: 13 }} onClick={() => { setEditMode(false); setEdits({}); }}>
                    Cancelar
                  </button>
                </span>
              ) : (
                <button className="btn btn-accent" onClick={() => setEditMode(true)} style={{ padding: '6px 14px', fontSize: 13 }}>
                  ✏️ Editar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabla de asistencia */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, background: 'white', zIndex: 2 }}>Empleado</th>
                <th>Proy.</th>
                <th>Tipo</th>
                {DAY_LABELS.map((d, i) => (
                  <th key={i} style={{ textAlign: 'center', minWidth: editMode ? 36 : 32, fontSize: 10 }}>{d.split(' ')[0]}</th>
                ))}
                <th style={{ background: '#f0f2f5' }}>Días</th>
              </tr>
            </thead>
            <tbody>
              {projGroups.map(group => (
                <React.Fragment key={group.project}>
                  {/* Fila separadora del proyecto */}
                  <tr style={{ background: group.project === 'Luxury' ? '#e8f5e9' : '#fff8e1' }}>
                    <td colSpan={3} style={{ fontWeight: 700, padding: '10px 8px', fontSize: 13 }}>
                      <Users size={14} style={{ marginRight: 4 }} /> {group.label}
                      <span style={{ fontWeight: 400, marginLeft: 8, color: '#666' }}>
                        {group.employees.length} empleados · 
                        Salario prom. RD${Math.round(group.employees.reduce((s,e) => s + (e.salary||0),0)/group.employees.length)}
                        /día
                      </span>
                    </td>
                    <td colSpan={DAY_LABELS.length}></td>
                    <td style={{ background: group.project === 'Luxury' ? '#c8e6c9' : '#ffecb3' }}></td>
                  </tr>
                  {group.employees.map(emp => {
                    const days = Array.from({ length: 15 }, (_, i) => getDayValue(emp.id, i + 1));
                    const worked = days.reduce((a, b) => a + b, 0);
                    const totalPay = worked * (emp.salary || 0);
                    return (
                      <tr key={emp.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ fontWeight: 600, position: 'sticky', left: 0, background: 'white' }}>{emp.name}</td>
                        <td style={{ fontSize: 11 }}>{emp.project}</td>
                        <td><span className="badge badge-info">{emp.type}</span></td>
                        {days.map((d, i) => {
                          const dayNum = i + 1;
                          const isEdited = edits[emp.id]?.[dayNum] !== undefined;
                          return (
                            <td
                              key={i}
                              onClick={() => cycleDay(emp.id, dayNum)}
                              style={{
                                textAlign: 'center',
                                cursor: editMode ? 'pointer' : 'default',
                                background: d >= 1 ? '#d4edda' : d > 0 ? '#fff3cd' : '#f8f9fa',
                                color: d >= 1 ? '#155724' : d > 0 ? '#856404' : '#adb5bd',
                                fontWeight: isEdited ? 700 : 400,
                                border: isEdited ? '2px solid #3498db' : 'none',
                                transition: 'all 0.15s'
                              }}
                              title={editMode ? 'Click: ½ → 0 → 1 → ½' : ''}
                            >
                              {d >= 1 ? '✓' : d > 0 ? '½' : editMode ? '○' : ''}
                            </td>
                          );
                        })}
                        <td style={{ fontWeight: 700, textAlign: 'center', background: '#f0f2f5' }}>{worked}</td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {projGroups.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', color: '#95a5a6' }}>
            {filterProj ? 'No hay empleados para este proyecto.' : 'No hay empleados de Bávaro.'}
          </div>
        )}

        <div style={{ marginTop: 12, fontSize: 12, color: '#7f8c8d', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span>Total Bávaro: {bavaroEmployees.length} empleados</span>
          {projGroups.map(g => (
            <span key={g.project}>
              · {g.project}: {g.employees.length} emp.
            </span>
          ))}
          <span style={{ marginLeft: 'auto', color: '#95a5a6', fontSize: 11 }}>
            {editMode ? 'Editando — click en cada día para cambiar valor' : 'Click "Editar" para modificar asistencia'}
          </span>
        </div>
      </div>

      {/* Notas del día */}
      <div className="card">
        <div className="card-header"><h3>Notas del día</h3></div>
        <div style={{ fontSize: 13, lineHeight: 1.8 }}>
          <p><strong>1 Jun:</strong> Louis 8:20, Ronaldino medio día (le duele la cabeza), Joseph medio día (asuntos personales), Daniel lo sacaron</p>
          <p><strong>2 Jun:</strong> Stanley 9:22, Louis y Casimir 9:29, Wilken medio día por embarres</p>
          <p><strong>3 Jun:</strong> Stanley 8:48</p>
        </div>
      </div>
    </div>
  );
}