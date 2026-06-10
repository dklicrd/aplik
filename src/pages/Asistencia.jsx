import React, { useState, useEffect } from 'react';
import ModuleNav from '../components/ModuleNav';
import { getEmployees, getAttendance } from '../utils/api';
import { RefreshCw, Save, Users, MapPin, AlertTriangle, Calendar } from 'lucide-react';

const API_BASE = import.meta.env.DEV ? '/api' : '/api';
const PROJECT_ORDER = ['Luxury', 'PYG'];

/** Genera los datos de los 15 días de una quincena */
function getFortnightInfo(fortnight) {
  // fortnight: '1ra' o '2da'
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const monthName = monthNames[month];

  if (fortnight === '1ra') {
    const days = Array.from({ length: 15 }, (_, i) => i + 1);
    const dayNames = days.map(d => {
      const date = new Date(year, month, d);
      const dayWeek = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
      return dayWeek[date.getDay()];
    });
    return {
      label: `1ra quincena ${monthName} ${year}`,
      period: `${year}-${String(month+1).padStart(2,'0')}-1ra`,
      days,
      dayNames,
      month,
      year,
      monthName,
      cutoffDay: 14, // día para aviso preparar nómina
      lastDay: 15
    };
  } else {
    // 2da quincena: días 16 al último día del mes
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: lastDayOfMonth - 15 }, (_, i) => i + 16);
    const dayNames = days.map(d => {
      const date = new Date(year, month, d);
      const dayWeek = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
      return dayWeek[date.getDay()];
    });
    return {
      label: `2da quincena ${monthName} ${year}`,
      period: `${year}-${String(month+1).padStart(2,'0')}-2da`,
      days,
      dayNames,
      month,
      year,
      monthName,
      cutoffDays: [lastDayOfMonth - 1, lastDayOfMonth], // 29 o 30-31
      lastDay: lastDayOfMonth
    };
  }
}

/** Determina la quincena activa según el día de hoy */
function getActiveFortnight() {
  const today = new Date().getDate();
  return today <= 15 ? '1ra' : '2da';
}

/** Calcula si hoy es día de corte (aviso preparar nómina) */
function isCutoffDay(info) {
  const today = new Date().getDate();
  if (info.label.startsWith('1ra')) {
    return today === info.cutoffDay; // día 14
  } else {
    return info.cutoffDays.includes(today); // día 29, 30 o 31
  }
}

/** Nombres de meses */
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function Asistencia() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterProj, setFilterProj] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [edits, setEdits] = useState({});
  const [quincena, setQuincena] = useState(getActiveFortnight()); // '1ra' o '2da'
  const [noteDate, setNoteDate] = useState(todayStr());
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aplik_notas') || '{}'); }
    catch { return {}; }
  });

  const fortnightInfo = getFortnightInfo(quincena);
  const showCutoffAlert = isCutoffDay(fortnightInfo);

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

  const todayStr = () => new Date().toISOString().split('T')[0];

  const saveNote = (date, text) => {
    const updated = { ...notes, [date]: text };
    setNotes(updated);
    try { localStorage.setItem('aplik_notas', JSON.stringify(updated)); } catch {}
  };

  // Separar SD de Bávaro
  const sdEmployees = employees.filter(e => e.project === 'Santo Domingo');
  const bavaroEmployees = employees.filter(e => e.project !== 'Santo Domingo');

  // Filtro por proyecto para Bávaro
  const filteredBavaro = bavaroEmployees.filter(e => !filterProj || e.project === filterProj);

  // Agrupar por proyecto en orden definido
  const projGroups = PROJECT_ORDER.map(p => ({
    project: p,
    label: p,
    employees: filteredBavaro.filter(e => e.project === p)
  })).filter(g => g.employees.length > 0);

  const bavaroProjects = [...new Set(bavaroEmployees.map(e => e.project))];

  // Asistencia map
  const attMap = {};
  // Filtrar por período activo
  const periodAtt = attendance.filter(a => a.period === fortnightInfo.period);
  periodAtt.forEach(a => {
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
    const next = current >= 1 ? 0.5 : current > 0 ? 0 : 1;
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
              body: JSON.stringify({
                employee_id: parseInt(empId),
                day: parseInt(day),
                value,
                period: fortnightInfo.period
              })
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

  // Cambiar de quincena (carga asistencias de ese período)
  const changeFortnight = (f) => {
    setQuincena(f);
    setEdits({});
    setEditMode(false);
  };

  if (loading) return <div className="page-header"><h2>Asistencia</h2><p><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Cargando...</p></div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2>Control de Asistencia</h2>
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <button
              className={`btn ${quincena === '1ra' ? 'btn-primary' : ''}`}
              style={{ padding: '4px 12px', fontSize: 13, fontWeight: quincena === '1ra' ? 700 : 400 }}
              onClick={() => changeFortnight('1ra')}
            >
              1ra Quincena
            </button>
            <button
              className={`btn ${quincena === '2da' ? 'btn-primary' : ''}`}
              style={{ padding: '4px 12px', fontSize: 13, fontWeight: quincena === '2da' ? 700 : 400 }}
              onClick={() => changeFortnight('2da')}
            >
              2da Quincena
            </button>
          </div>
        </div>
        <ModuleNav />
      </div>

      {/* ALERTA DE CORTE — PREPARAR NÓMINA */}
      {showCutoffAlert && (
        <div style={{
          background: '#fff3cd', border: '1px solid #ffeeba', borderRadius: 8,
          padding: '16px 20px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <AlertTriangle size={24} color="#856404" />
          <div>
            <strong style={{ fontSize: 15, color: '#856404' }}>⚠️ Preparar Nómina</strong>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#856404' }}>
              Hoy es <strong>día de corte</strong>. Proyecta los días restantes ({fortnightInfo.label}) y prepara el pago de nómina.
              {quincena === '1ra'
                ? ' La 1ra quincena cierra el día 15.'
                : ` La 2da quincena cierra el día ${fortnightInfo.lastDay}.`}
            </p>
          </div>
        </div>
      )}

      {/* ========== BOTONES DE EDICIÓN GLOBAL ========== */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
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
            ✏️ Editar Asistencia
          </button>
        )}
      </div>

      {/* ========== SECCIÓN SANTO DOMINGO ========== */}
      <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid #3498db' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h3><MapPin size={16} style={{ marginRight: 6 }} />Santo Domingo</h3>
          <span style={{ fontSize: 13, color: '#7f8c8d' }}>
            {sdEmployees.length} empleados · Salario fijo mensual
          </span>
        </div>
        {sdEmployees.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: '#3498db', marginBottom: 6, fontStyle: 'italic' }}>
              ⓘ Registro de asistencia — salario fijo, no afecta el pago
            </div>
            <div style={{ overflowX: 'auto' }}>
              <div className="table-wrapper"><table className="card-table" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ position: 'sticky', left: 0, background: 'white', zIndex: 2 }}>Empleado</th>
                    <th>Cargo</th>
                    <th>Tipo</th>
                    {fortnightInfo.days.map((d, i) => (
                      <th key={i} style={{ textAlign: 'center', minWidth: editMode ? 36 : 32, fontSize: 10, lineHeight: 1.3 }}>
                        {fortnightInfo.dayNames[i]}<br/><span style={{ fontSize: 9, color: '#999' }}>{d}</span>
                      </th>
                    ))}
                    <th style={{ background: '#eaf2f8' }}>Días</th>
                  </tr>
                </thead>
                <tbody>
                  {sdEmployees.map(emp => {
                    const days = fortnightInfo.days.map(d => getDayValue(emp.id, d));
                    const worked = days.reduce((a, b) => a + b, 0);
                    return (
                      <tr key={emp.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ fontWeight: 600, position: 'sticky', left: 0, background: 'white' }}>{emp.name}</td>
                        <td>{emp.type_label || emp.type}</td>
                        <td><span className="badge badge-info">SD</span></td>
                        {days.map((d, i) => {
                          const dayNum = fortnightInfo.days[i];
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
                              title={editMode ? 'Click: ✓ → ½ → 0 → ✓' : ''}
                            >
                              {d >= 1 ? '✓' : d > 0 ? '½' : editMode ? '○' : ''}
                            </td>
                          );
                        })}
                        <td style={{ fontWeight: 700, textAlign: 'center', background: '#eaf2f8' }}>{worked}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table></div>
            </div>
          </>
        )}
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
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <div className="table-wrapper"><table className="card-table" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, background: 'white', zIndex: 2 }}>Empleado</th>
                <th>Proy.</th>
                <th>Tipo</th>
                {fortnightInfo.days.map((d, i) => (
                  <th key={i} style={{ textAlign: 'center', minWidth: editMode ? 36 : 32, fontSize: 10, lineHeight: 1.3 }}>
                    {fortnightInfo.dayNames[i]}<br/><span style={{ fontSize: 9, color: '#999' }}>{d}</span>
                  </th>
                ))}
                <th style={{ background: '#f0f2f5' }}>Días</th>
                <th style={{ background: '#e8f5e9', minWidth: 80 }}>Total a Pagar</th>
              </tr>
            </thead>
            <tbody>
              {projGroups.map(group => (
                <React.Fragment key={group.project}>
                  <tr style={{ background: group.project === 'Luxury' ? '#e8f5e9' : '#fff8e1' }}>
                    <td colSpan={4} style={{ fontWeight: 700, padding: '10px 8px', fontSize: 13 }}>
                      <Users size={14} style={{ marginRight: 4 }} /> {group.label}
                      <span style={{ fontWeight: 400, marginLeft: 8, color: '#666' }}>
                        {group.employees.length} empleados
                      </span>
                    </td>
                    <td colSpan={fortnightInfo.days.length}></td>
                    <td style={{ background: group.project === 'Luxury' ? '#c8e6c9' : '#ffecb3' }}></td>
                    <td style={{ background: group.project === 'Luxury' ? '#a5d6a7' : '#ffe082', fontWeight: 700 }}>
                      RD${group.employees.reduce((s, emp) => {
                        const days = fortnightInfo.days.map(d => getDayValue(emp.id, d));
                        const worked = days.reduce((a, b) => a + b, 0);
                        return s + (worked * (emp.salary || 0));
                      }, 0).toLocaleString()}
                    </td>
                  </tr>
                  {group.employees.map(emp => {
                    const days = fortnightInfo.days.map(d => getDayValue(emp.id, d));
                    const worked = days.reduce((a, b) => a + b, 0);
                    const totalPay = worked * (emp.salary || 0);
                    return (
                      <tr key={emp.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ fontWeight: 600, position: 'sticky', left: 0, background: 'white' }}>{emp.name}</td>
                        <td style={{ fontSize: 11 }}>{emp.project}</td>
                        <td><span className="badge badge-info">{emp.type}</span></td>
                        {days.map((d, i) => {
                          const dayNum = fortnightInfo.days[i];
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
                              title={editMode ? 'Click: ✓ → ½ → 0 → ✓' : ''}
                            >
                              {d >= 1 ? '✓' : d > 0 ? '½' : editMode ? '○' : ''}
                            </td>
                          );
                        })}
                        <td style={{ fontWeight: 700, textAlign: 'center', background: '#f0f2f5' }}>{worked}</td>
                        <td style={{ fontWeight: 700, textAlign: 'center', background: '#e8f5e9', color: totalPay > 0 ? '#155724' : '#999' }}>
                          RD${totalPay.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table></div>
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
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h3>📓 Cuaderno de Notas</h3>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button className="btn btn-sm" onClick={() => setNoteDate(new Date(new Date(noteDate).setDate(new Date(noteDate).getDate() - 1)))}
              title="Día anterior" style={{ padding: '4px 8px', fontSize: 12 }}>◀</button>
            <input type="date" value={noteDate} onChange={e => setNoteDate(e.target.value)}
              style={{ padding: '4px 8px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 12 }} />
            <button className="btn btn-sm" onClick={() => setNoteDate(new Date(new Date(noteDate).setDate(new Date(noteDate).getDate() + 1)))}
              title="Día siguiente" style={{ padding: '4px 8px', fontSize: 12 }}>▶</button>
            <button className="btn btn-sm" onClick={() => setNoteDate(todayStr())}
              style={{ padding: '4px 8px', fontSize: 11 }}>Hoy</button>
          </div>
        </div>
        <div>
          <textarea
            value={notes[noteDate] || ''}
            onChange={e => saveNote(noteDate, e.target.value)}
            placeholder="Escribe tus notas del día aquí..."
            style={{
              width: '100%',
              minHeight: 120,
              padding: 12,
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              fontSize: 13,
              lineHeight: 1.7,
              fontFamily: 'inherit',
              resize: 'vertical',
              background: notes[noteDate] ? '#fffdf5' : 'white'
            }}
          />
          <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
            {notes[noteDate] ? '✓ Guardado automáticamente' : '💡 Las notas se guardan automáticamente al escribir'}
            <span style={{ marginLeft: 16 }}>{noteDate}</span>
          </div>
        </div>
      </div>

      {/* Mini calendario — días con notas */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header"><h4>🗓️ Calendario de Notas</h4></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '4px 0' }}>
          {(() => {
            const today = new Date();
            const entries = Object.keys(notes);
            // Mostrar últimos 30 días
            const days = [];
            for (let i = 29; i >= 0; i--) {
              const d = new Date(today);
              d.setDate(d.getDate() - i);
              const key = d.toISOString().split('T')[0];
              const dayNum = d.getDate();
              const monthName = MONTHS[d.getMonth()];
              const hasNote = notes[key] && notes[key].trim();
              const isToday = key === todayStr();
              const isSelected = key === noteDate;
              days.push(
                <div
                  key={key}
                  onClick={() => setNoteDate(key)}
                  style={{
                    width: 36,
                    height: 36,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 6,
                    background: isSelected ? '#3498db' : isToday ? '#eaf2f8' : hasNote ? '#fff3cd' : '#f8f9fa',
                    color: isSelected ? 'white' : isToday ? '#2980b9' : '#555',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: isToday || isSelected ? 700 : hasNote ? 600 : 400,
                    border: hasNote && !isSelected ? '1px solid #ffc107' : 'none',
                    transition: 'all 0.15s'
                  }}
                  title={`${dayNum} ${monthName}${hasNote ? ' · Tiene notas' : ''}`}
                >
                  <span>{dayNum}</span>
                  {hasNote && <span style={{ fontSize: 7, marginTop: -2 }}>📝</span>}
                </div>
              );
            }
            return days;
          })()}
        </div>
      </div>
    </div>
  );
}