import React, { useState } from 'react';
import { employees, attendance } from '../utils/data';

export default function Asistencia() {
  const [filterProj, setFilterProj] = useState('');

  const filtered = employees.filter(e => !filterProj || e.project === filterProj);

  const projects = [...new Set(employees.map(e => e.project))];

  return (
    <div>
      <div className="page-header">
        <h2>Control de Asistencia</h2>
        <p>{attendance.period}</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select
          value={filterProj}
          onChange={e => setFilterProj(e.target.value)}
          style={{ padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14 }}
        >
          <option value="">Todos los proyectos</option>
          {projects.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
          <span className="badge badge-info">A: Buen Pintor</span>
          <span className="badge badge-info">B: Pintor Intermedio</span>
          <span className="badge badge-info">C: Aprendiz</span>
          <span className="badge badge-info">M: Masillero</span>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ position: 'sticky', left: 0, background: 'white', zIndex: 2 }}>Empleado</th>
              <th>Proy.</th>
              <th>Tipo</th>
              {attendance.days.map((d, i) => (
                <th key={i} style={{ textAlign: 'center', minWidth: 32, fontSize: 10 }}>{d.split(' ')[0]}</th>
              ))}
              <th style={{ background: '#f0f2f5' }}>Días</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(emp => {
              const att = attendance.records.find(r => r.employeeId === emp.id);
              const days = att ? att.days : [];
              const worked = days.reduce((a, b) => a + b, 0);
              return (
                <tr key={emp.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ fontWeight: 600, position: 'sticky', left: 0, background: 'white' }}>{emp.name}</td>
                  <td style={{ fontSize: 11 }}>{emp.project}</td>
                  <td><span className="badge badge-info">{emp.type}</span></td>
                  {days.map((d, i) => (
                    <td key={i} style={{
                      textAlign: 'center',
                      background: d >= 1 ? '#d4edda' : d > 0 ? '#fff3cd' : '#f8f9fa',
                      color: d >= 1 ? '#155724' : d > 0 ? '#856404' : '#adb5bd'
                    }}>
                      {d >= 1 ? '✓' : d > 0 ? '½' : ''}
                    </td>
                  ))}
                  <td style={{ fontWeight: 700, textAlign: 'center', background: '#f0f2f5' }}>{worked}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Notas del día</h3>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.8 }}>
          <p><strong>1 Jun:</strong> Louis 8:20, Ronaldino medio día (le duele la cabeza), Joseph medio día (asuntos personales), Daniel lo sacaron</p>
          <p><strong>2 Jun:</strong> Stanley 9:22, Louis y Casimir 9:29, Wilken medio día por embarres</p>
          <p><strong>3 Jun:</strong> Stanley 8:48</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Resumen por Tipo</h3>
        </div>
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