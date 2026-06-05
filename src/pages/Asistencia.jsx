import React, { useState, useEffect } from 'react';
import { getEmployees, getAttendance } from '../utils/api';
import { RefreshCw, Save } from 'lucide-react';

const API_BASE = import.meta.env.DEV ? '/api' : '/api';

const DAY_LABELS = ['Lun 1','Mar 2','Mié 3','Jue 4','Vie 5','Sáb 6','Dom 7','Lun 8','Mar 9','Mié 10','Jue 11','Vie 12','Sáb 13','Dom 14','Lun 15'];

export default function Asistencia() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterProj, setFilterProj] = useState('');
  const [editMode, setEditMode] = useState(false);

  // Local edits: { employee_id: { day: value } }
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

  const filtered = employees.filter(e => !filterProj || e.project === filterProj);
  const projects = [...new Set(employees.map(e => e.project))];

  // Build day matrix from server data + local edits
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

  return (
    <div>
      <div className="page-header">
        <h2>Control de Asistencia</h2>
        <p>15 días — período activo</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={filterProj} onChange={e => setFilterProj(e.target.value)}
          style={{ padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14 }}>
          <option value="">Todos los proyectos</option>
          {projects.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
          <span className="badge badge-info">A: Buen Pintor</span>
          <span className="badge badge-info">B: Pintor Intermedio</span>
          <span className="badge badge-info">C: Aprendiz</span>
          <span className="badge badge-info">M: Masillero</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {editMode ? (
            <>
              <button className="btn btn-primary" onClick={saveAll} disabled={saving}>
                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button className="btn" style={{ background: '#eee' }} onClick={() => { setEditMode(false); setEdits({}); }}>
                Cancelar
              </button>
            </>
          ) : (
            <button className="btn btn-accent" onClick={() => setEditMode(true)}>
              ✏️ Editar
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
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
            {filtered.map(emp => {
              const days = Array.from({ length: 15 }, (_, i) => getDayValue(emp.id, i + 1));
              const worked = days.reduce((a, b) => a + b, 0);
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
                        onClick={() => editMode && cycleDay(emp.id, dayNum)}
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
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-header"><h3>Notas del día</h3></div>
        <div style={{ fontSize: 13, lineHeight: 1.8 }}>
          <p><strong>1 Jun:</strong> Louis 8:20, Ronaldino medio día (le duele la cabeza), Joseph medio día (asuntos personales), Daniel lo sacaron</p>
          <p><strong>2 Jun:</strong> Stanley 9:22, Louis y Casimir 9:29, Wilken medio día por embarres</p>
          <p><strong>3 Jun:</strong> Stanley 8:48</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>Resumen por Tipo</h3></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {['A', 'B', 'C', 'M'].map(type => {
            const typeName = { A: 'Buen Pintor', B: 'Pintor Intermedio', C: 'Aprendiz', M: 'Masillero' }[type];
            const empList = employees.filter(e => e.type === type);
            return (
              <div key={type} style={{ padding: 12, background: '#f8f9fa', borderRadius: 8 }}>
                <strong>Tipo {type}</strong> — {typeName}<br />
                <span style={{ fontSize: 13, color: '#7f8c8d' }}>{empList.length} empleados</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}