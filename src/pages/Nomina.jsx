import React, { useState } from 'react';
import { employees, attendance } from '../utils/data';

export default function Nomina() {
  const [filterProj, setFilterProj] = useState('');

  const filtered = employees.filter(e => !filterProj || e.project === filterProj);
  const projects = [...new Set(employees.map(e => e.project))];

  const totalNomina = filtered.reduce((sum, emp) => {
    const att = attendance.records.find(r => r.employeeId === emp.id);
    const daysWorked = att ? att.days.reduce((a, b) => a + b, 0) : 0;
    const gross = daysWorked * emp.salary;
    const net = gross - emp.discounts;
    return sum + net;
  }, 0);

  return (
    <div>
      <div className="page-header">
        <h2>Nómina</h2>
        <p>{attendance.period}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Empleados</div>
          <div className="stat-value">{filtered.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Descuentos</div>
          <div className="stat-value" style={{ color: '#e74c3c' }}>
            ${filtered.reduce((s, e) => s + e.discounts, 0).toLocaleString('es-DO')}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total a Pagar</div>
          <div className="stat-value" style={{ color: '#27ae60' }}>
            ${totalNomina.toLocaleString('es-DO')}
          </div>
          <div className="stat-sub">1ra quincena junio 2026</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select
          value={filterProj}
          onChange={e => setFilterProj(e.target.value)}
          style={{ padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14 }}
        >
          <option value="">Todos los proyectos</option>
          {projects.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
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
              const att = attendance.records.find(r => r.employeeId === emp.id);
              const daysWorked = att ? att.days.reduce((a, b) => a + b, 0) : 0;
              const gross = daysWorked * emp.salary;
              const net = gross - emp.discounts;
              return (
                <tr key={emp.id}>
                  <td><strong>{emp.name}</strong></td>
                  <td>{emp.project}</td>
                  <td><span className="badge badge-info">{emp.type} — {emp.typeLabel}</span></td>
                  <td>${emp.salary.toLocaleString('es-DO')}</td>
                  <td style={{ fontWeight: 600 }}>{daysWorked}</td>
                  <td>${gross.toLocaleString('es-DO')}</td>
                  <td style={{ color: emp.discounts > 0 ? '#e74c3c' : '#7f8c8d' }}>
                    ${emp.discounts.toLocaleString('es-DO')}
                  </td>
                  <td style={{ fontWeight: 700, color: '#27ae60' }}>${net.toLocaleString('es-DO')}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f0f2f5', fontWeight: 700 }}>
              <td colSpan={5} style={{ textAlign: 'right' }}>TOTAL:</td>
              <td>${filtered.reduce((s, e) => {
                const att = attendance.records.find(r => r.employeeId === e.id);
                const daysWorked = att ? att.days.reduce((a, b) => a + b, 0) : 0;
                return s + (daysWorked * e.salary);
              }, 0).toLocaleString('es-DO')}</td>
              <td style={{ color: '#e74c3c' }}>${filtered.reduce((s, e) => s + e.discounts, 0).toLocaleString('es-DO')}</td>
              <td style={{ color: '#27ae60' }}>${totalNomina.toLocaleString('es-DO')}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <h3>Proyecto PYG (Panorama Park & Garden)</h3>
          </div>
          <table>
            <thead>
              <tr><th>Empleado</th><th>Tipo</th><th>Días</th><th>Neto</th></tr>
            </thead>
            <tbody>
              {employees.filter(e => e.project === 'PYG').map(emp => {
                const att = attendance.records.find(r => r.employeeId === emp.id);
                const daysWorked = att ? att.days.reduce((a, b) => a + b, 0) : 0;
                const net = (daysWorked * emp.salary) - emp.discounts;
                return (
                  <tr key={emp.id}>
                    <td>{emp.name}</td>
                    <td><span className="badge badge-info">{emp.type}</span></td>
                    <td>{daysWorked}</td>
                    <td style={{ fontWeight: 600 }}>${net.toLocaleString('es-DO')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Proyecto Luxury</h3>
          </div>
          <table>
            <thead>
              <tr><th>Empleado</th><th>Tipo</th><th>Días</th><th>Neto</th></tr>
            </thead>
            <tbody>
              {employees.filter(e => e.project === 'Luxury').map(emp => {
                const att = attendance.records.find(r => r.employeeId === emp.id);
                const daysWorked = att ? att.days.reduce((a, b) => a + b, 0) : 0;
                const net = (daysWorked * emp.salary) - emp.discounts;
                return (
                  <tr key={emp.id}>
                    <td>{emp.name}</td>
                    <td><span className="badge badge-info">{emp.type}</span></td>
                    <td>{daysWorked}</td>
                    <td style={{ fontWeight: 600 }}>${net.toLocaleString('es-DO')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>📋 Notas de Descuentos</h3>
        </div>
        <div style={{ fontSize: 13, lineHeight: 2 }}>
          <p>• <strong>Descontar 3 quincenas</strong> a los chicos de las botas: 2 pagos de $600 y 1 pago de $500</p>
          <p>• <strong>Descontar $1,000 x quincena</strong> a Allan hasta completar $8,000 por teléfono</p>
          <p>• <strong>Alann:</strong> $1,500 descuento esta quincena (nota: descontar $1,000 x quincena hasta $8,000)</p>
        </div>
      </div>
    </div>
  );
}