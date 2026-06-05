import React, { useState } from 'react';
import { Search, Plus, Filter, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { products, movements, categories } from '../utils/data';

function getCategoryName(id) {
  const map = { pintura: 'Pintura', herramienta: 'Herramienta', producto: 'Producto' };
  return map[id] || id;
}

export default function Inventario() {
  const [tab, setTab] = useState('productos');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const sortedMovements = [...movements].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <div className="page-header">
        <h2>Inventario</h2>
        <p>Control de productos, entradas y salidas</p>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'productos' ? 'active' : ''}`} onClick={() => setTab('productos')}>
          Productos ({products.length})
        </button>
        <button className={`tab ${tab === 'movimientos' ? 'active' : ''}`} onClick={() => setTab('movimientos')}>
          Movimientos ({movements.length})
        </button>
        <button className={`tab ${tab === 'alertas' ? 'active' : ''}`} onClick={() => setTab('alertas')}>
          Alertas
        </button>
      </div>

      {tab === 'alertas' && (
        <div className="card">
          <div className="card-header">
            <h3><AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Alertas por Punto de Reorden</h3>
            <span>Stock mínimo configurable por producto</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Stock Actual</th>
                <th>Stock Mínimo</th>
                <th>Diferencia</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {products.filter(p => p.stock <= p.minStock).sort((a, b) => a.stock - b.stock).map(p => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
                  <td>{p.stock} {p.unit}</td>
                  <td>{p.minStock} {p.unit}</td>
                  <td style={{ color: p.stock <= 0 ? '#e74c3c' : '#e67e22' }}>
                    {p.stock <= 0 ? '-' : `-${(p.minStock - p.stock).toFixed(1)}`}
                  </td>
                  <td>
                    {p.stock <= 0
                      ? <span className="badge badge-danger">Agotado — Reponer urgente</span>
                      : <span className="badge badge-warning">Bajo — Quedan {p.stock} de {p.minStock} mín.</span>
                    }
                  </td>
                </tr>
              ))}
              {products.filter(p => p.stock <= p.minStock).length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#7f8c8d', padding: 20 }}>✅ Todos los productos tienen stock suficiente</td></tr>
              )}
            </tbody>
          </table>
          <div style={{ marginTop: 16, padding: 12, background: '#f8f9fa', borderRadius: 8, fontSize: 13 }}>
            <strong>📌 Notas del Excel:</strong> Descontar 3 quincenas a los chicos de las botas (2 pagos de 600 y 1 de 500). Descontar 1,000 x quincena a Allan hasta completar 8,000 por teléfono.
          </div>
        </div>
      )}

      {tab === 'productos' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#7f8c8d' }} />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14 }}
              />
            </div>
            <select
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
              style={{ padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14 }}
            >
              <option value="">Todas las categorías</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Mínimo</th>
                  <th>Unidad</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => {
                  const isLow = p.stock <= p.minStock;
                  return (
                    <tr key={p.id} style={isLow ? { background: '#fff9f0' } : {}}>
                      <td><strong>{p.name}</strong></td>
                      <td>
                        <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{p.category}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: p.stock <= 0 ? '#e74c3c' : isLow ? '#e67e22' : '#27ae60' }}>
                        {p.stock}
                      </td>
                      <td>{p.minStock}</td>
                      <td>{p.unit}</td>
                      <td>
                        {p.stock <= 0
                          ? <span className="badge badge-danger">Agotado</span>
                          : isLow
                          ? <span className="badge badge-warning">Por agotar</span>
                          : <span className="badge badge-success">OK</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'movimientos' && (
        <div className="card">
          <div className="card-header">
            <h3>Historial de Movimientos</h3>
            <span style={{ fontSize: 13, color: '#7f8c8d' }}>Más recientes primero</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Nota / Destino</th>
              </tr>
            </thead>
            <tbody>
              {sortedMovements.map(m => (
                <tr key={m.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{m.date}</td>
                  <td>
                    {m.type === 'entrada'
                      ? <span className="badge badge-success">Entrada</span>
                      : <span className="badge badge-danger">Salida</span>
                    }
                  </td>
                  <td>{m.product}</td>
                  <td style={{ fontWeight: 600 }}>{m.qty}</td>
                  <td style={{ color: '#7f8c8d', fontSize: 12 }}>
                    {m.type === 'salida' ? `→ ${m.destination}${m.note ? ' · ' + m.note : ''}` : m.note || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}