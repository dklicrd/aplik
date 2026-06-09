import React, { useState, useMemo } from 'react';
import { Search, Filter, TrendingUp, DollarSign, CheckCircle, Clock, BarChart3 } from 'lucide-react';
import { allPresupuestos, getStatusLabel, getStatusBadge, getStatusColor } from '../utils/presupuestos';

export default function Presupuestos() {
  const [tab, setTab] = useState('pipeline');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return allPresupuestos.filter(p => {
      const matchYear = !yearFilter || p.year === parseInt(yearFilter);
      const matchStatus = !statusFilter || p.estatus === statusFilter;
      const matchSearch = !search || p.cliente.toLowerCase().includes(search.toLowerCase()) || p.descripcion.toLowerCase().includes(search.toLowerCase());
      return matchYear && matchStatus && matchSearch;
    });
  }, [yearFilter, statusFilter, search]);

  const years = [...new Set(allPresupuestos.map(p => p.year))].sort((a, b) => b - a);
  const statuses = [...new Set(allPresupuestos.map(p => p.estatus))];

  // Stats
  const stats = useMemo(() => {
    const total = allPresupuestos.length;
    const terminados = allPresupuestos.filter(p => p.estatus === 'Terminado').length;
    const porAprobar = allPresupuestos.filter(p => p.estatus === 'X Aprobar').length;
    const ejecucion = allPresupuestos.filter(p => p.estatus === 'Ejecución').length;
    const porEnviar = allPresupuestos.filter(p => p.estatus === 'X Enviar').length;
    const conversionRate = total > 0 ? Math.round((terminados / total) * 100) : 0;
    return { total, terminados, porAprobar, ejecucion, porEnviar, conversionRate };
  }, []);

  // Pipeline stages - conteo
  const pipelineData = [
    { label: 'Por Enviar', count: stats.porEnviar, color: '#95a5a6' },
    { label: 'Por Aprobar', count: stats.porAprobar, color: '#e67e22' },
    { label: 'En Ejecución', count: stats.ejecucion, color: '#f39c12' },
    { label: 'Terminados', count: stats.terminados, color: '#27ae60' },
  ];
  const maxPipeline = Math.max(...pipelineData.map(d => d.count), 1);

  // Stats por año
  const statsByYear = useMemo(() => {
    const map = {};
    for (const p of allPresupuestos) {
      if (!map[p.year]) map[p.year] = { year: p.year, total: 0, terminados: 0 };
      map[p.year].total++;
      if (p.estatus === 'Terminado') map[p.year].terminados++;
    }
    return Object.values(map).sort((a, b) => a.year - b.year);
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>Presupuestos</h2>
        <p>Control histórico {years[0]} → {years[years.length - 1]} · {stats.total} presupuestos</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label"><BarChart3 size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Total Presupuestos</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-sub">Desde 2019</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><CheckCircle size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Terminados</div>
          <div className="stat-value" style={{ color: '#27ae60' }}>{stats.terminados}</div>
          <div className="stat-sub">{stats.conversionRate}% de conversión</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><Clock size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Pendientes</div>
          <div className="stat-value" style={{ color: '#e67e22' }}>{stats.porAprobar + stats.porEnviar}</div>
          <div className="stat-sub">{stats.porAprobar} por aprobar · {stats.porEnviar} por enviar</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><TrendingUp size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> En Ejecución</div>
          <div className="stat-value" style={{ color: '#f39c12' }}>{stats.ejecucion}</div>
          <div className="stat-sub">Activos ahora</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'pipeline' ? 'active' : ''}`} onClick={() => setTab('pipeline')}>
          Pipeline
        </button>
        <button className={`tab ${tab === 'tabla' ? 'active' : ''}`} onClick={() => setTab('tabla')}>
          Histórico
        </button>
        <button className={`tab ${tab === 'analisis' ? 'active' : ''}`} onClick={() => setTab('analisis')}>
          Análisis por Año
        </button>
      </div>

      {tab === 'pipeline' && (
        <>
          <div className="card">
            <div className="card-header">
              <h3>Pipeline de Presupuestos</h3>
              <span style={{ fontSize: 12, color: '#7f8c8d' }}>De enviado a terminado</span>
            </div>
            <div style={{ padding: '20px 0' }}>
              {pipelineData.map((stage, i) => (
                <div key={i} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>
                      <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: stage.color, marginRight: 8 }} />
                      {stage.label}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{stage.count}</span>
                  </div>
                  <div style={{ background: '#f0f2f5', borderRadius: 8, height: 24, overflow: 'hidden' }}>
                    <div style={{
                      width: `${(stage.count / maxPipeline) * 100}%`,
                      minWidth: stage.count > 0 ? '20px' : '0',
                      height: '100%',
                      background: stage.color,
                      borderRadius: 8,
                      transition: 'width 0.5s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      {stage.count > 0 ? stage.count : ''}
                    </div>
                  </div>
                  {i < pipelineData.length - 1 && (
                    <div style={{ textAlign: 'center', color: '#bdc3c7', fontSize: 18, marginTop: -4 }}>↓</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Resumen de Conversión</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#27ae60' }}>{stats.conversionRate}%</div>
                <div style={{ fontSize: 13, color: '#7f8c8d' }}>Tasa de Conversión</div>
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#e67e22' }}>{(stats.porAprobar / stats.total * 100).toFixed(0)}%</div>
                <div style={{ fontSize: 13, color: '#7f8c8d' }}>En Aprobación</div>
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#2980b9' }}>{(stats.ejecucion / stats.total * 100).toFixed(0)}%</div>
                <div style={{ fontSize: 13, color: '#7f8c8d' }}>En Ejecución</div>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'tabla' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#7f8c8d' }} />
              <input
                type="text"
                placeholder="Buscar cliente o descripción..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14 }}
              />
            </div>
            <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
              style={{ padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14 }}>
              <option value="">Todos los años</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14 }}>
              <option value="">Todos los estatus</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="card" style={{ overflowX: 'auto' }}>
            <div className="table-wrapper"><table className="card-table"> style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Descripción</th>
                  <th>Fecha</th>
                  <th>Presupuesto</th>
                  <th>Zona</th>
                  <th>Estatus</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 200).map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{p.cliente}</td>
                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descripcion}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{p.fecha}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{p.presupuesto}</td>
                    <td>{p.zona}</td>
                    <td><span className={getStatusBadge(p.estatus)} style={{ background: getStatusColor(p.estatus) + '20', color: getStatusColor(p.estatus), fontWeight: 600 }}>
                      {getStatusLabel(p.estatus)}
                    </span></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20, color: '#7f8c8d' }}>No se encontraron resultados</td></tr>
                )}
              </tbody>
            </table></div>
            {filtered.length > 200 && (
              <div style={{ textAlign: 'center', padding: 12, color: '#7f8c8d', fontSize: 13 }}>
                Mostrando 200 de {filtered.length} resultados. Usa los filtros para acotar.
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'analisis' && (
        <div className="card">
          <div className="card-header">
            <h3>Presupuestos por Año</h3>
          </div>
          <div className="table-wrapper"><table className="card-table">>
            <thead>
              <tr>
                <th>Año</th>
                <th>Total</th>
                <th>Terminados</th>
                <th>% Conversión</th>
                <th style={{ width: '40%' }}>Barra</th>
              </tr>
            </thead>
            <tbody>
              {statsByYear.reverse().map(s => {
                const pct = s.total > 0 ? (s.terminados / s.total * 100).toFixed(0) : 0;
                return (
                  <tr key={s.year}>
                    <td style={{ fontWeight: 700 }}>{s.year}</td>
                    <td>{s.total}</td>
                    <td style={{ color: '#27ae60' }}>{s.terminados}</td>
                    <td>{pct}%</td>
                    <td>
                      <div style={{ background: '#f0f2f5', borderRadius: 8, height: 20, overflow: 'hidden' }}>
                        <div style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: '#27ae60',
                          borderRadius: 8,
                          minWidth: pct > 0 ? '20px' : 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: 10,
                          fontWeight: 600,
                        }}>{pct}%</div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </div>
      )}
    </div>
  );
}