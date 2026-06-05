import React, { useState, useEffect } from 'react';
import { Search, Plus, AlertTriangle, X, Save, Edit2, Trash2 } from 'lucide-react';
import { getProducts, getMovements, getCategories, createProduct, updateProduct, deleteProduct } from '../utils/api';

export default function Inventario() {
  const [tab, setTab] = useState('productos');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'pintura', stock: 0, min_stock: 3, unit: 'unidad' });

  const fetchData = async () => {
    setLoading(true);
    const [p, m, c] = await Promise.all([
      getProducts().catch(() => []),
      getMovements().catch(() => []),
      getCategories().catch(() => []),
    ]);
    setProducts(p);
    setMovements(m);
    setCategories(c);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await updateProduct(editing, form);
      } else {
        await createProduct(form);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', category: 'pintura', stock: 0, min_stock: 3, unit: 'unidad' });
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleEdit = (p) => {
    setEditing(p.id);
    setForm({ name: p.name, category: p.category, stock: Number(p.stock), min_stock: Number(p.min_stock), unit: p.unit });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await deleteProduct(id);
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const sortedMovements = [...movements].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (loading) return <div className="page-header"><h2>Inventario</h2><p style={{ color: '#7f8c8d' }}>Cargando...</p></div>;

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

      {tab === 'productos' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#7f8c8d' }} />
              <input type="text" placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14 }} />
            </div>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
              style={{ padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14 }}>
              <option value="">Todas</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ name: '', category: 'pintura', stock: 0, min_stock: 3, unit: 'unidad' }); setShowForm(true); }}>
              <Plus size={16} /> Nuevo
            </button>
          </div>

          {/* Formulario */}
          {showForm && (
            <div className="card" style={{ border: '2px solid #3498db' }}>
              <div className="card-header">
                <h3>{editing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                <button className="btn btn-sm" style={{ background: '#eee' }} onClick={() => { setShowForm(false); setEditing(null); }}><X size={14} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Nombre</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ej: Cub Total Blanco" />
                </div>
                <div className="form-group">
                  <label>Categoría</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Stock</label>
                  <input type="number" step="0.01" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Stock Mínimo</label>
                  <input type="number" step="0.01" value={form.min_stock} onChange={e => setForm({...form, min_stock: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Unidad</label>
                  <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                    <option value="unidad">Unidad</option>
                    <option value="cubeta">Cubeta</option>
                    <option value="galón">Galón</option>
                    <option value="tubo">Tubo</option>
                    <option value="rollo">Rollo</option>
                    <option value="caja">Caja</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={handleSave}>
                <Save size={16} /> {editing ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          )}

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
                  <th style={{ width: 80 }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => {
                  const isLow = Number(p.stock) <= Number(p.min_stock);
                  return (
                    <tr key={p.id} style={isLow ? { background: '#fff9f0' } : {}}>
                      <td><strong>{p.name}</strong></td>
                      <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{p.category}</span></td>
                      <td style={{ fontWeight: 600, color: Number(p.stock) <= 0 ? '#e74c3c' : isLow ? '#e67e22' : '#27ae60' }}>
                        {Number(p.stock)}
                      </td>
                      <td>{Number(p.min_stock)}</td>
                      <td>{p.unit}</td>
                      <td>
                        {Number(p.stock) <= 0
                          ? <span className="badge badge-danger">Agotado</span>
                          : isLow ? <span className="badge badge-warning">Por agotar</span>
                          : <span className="badge badge-success">OK</span>
                        }
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-sm btn-primary" onClick={() => handleEdit(p)}><Edit2 size={12} /></button>
                          <button className="btn btn-sm" style={{ background: '#e74c3c', color: 'white' }} onClick={() => handleDelete(p.id)}><Trash2 size={12} /></button>
                        </div>
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
              <tr><th>Fecha</th><th>Tipo</th><th>Producto</th><th>Cantidad</th><th>Nota / Destino</th></tr>
            </thead>
            <tbody>
              {sortedMovements.map(m => (
                <tr key={m.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{m.date?.slice(0,10)}</td>
                  <td>{m.type === 'entrada' ? <span className="badge badge-success">Entrada</span> : <span className="badge badge-danger">Salida</span>}</td>
                  <td>{m.product}</td>
                  <td style={{ fontWeight: 600 }}>{Number(m.qty)}</td>
                  <td style={{ color: '#7f8c8d', fontSize: 12 }}>
                    {m.type === 'salida' ? `→ ${m.destination}${m.note ? ' · ' + m.note : ''}` : m.note || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'alertas' && (
        <div className="card">
          <div className="card-header"><h3><AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Alertas por Punto de Reorden</h3></div>
          <table>
            <thead>
              <tr><th>Producto</th><th>Categoría</th><th>Stock Actual</th><th>Stock Mínimo</th><th>Diferencia</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {products.filter(p => Number(p.stock) <= Number(p.min_stock)).sort((a, b) => Number(a.stock) - Number(b.stock)).map(p => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
                  <td>{Number(p.stock)} {p.unit}</td>
                  <td>{Number(p.min_stock)} {p.unit}</td>
                  <td style={{ color: Number(p.stock) <= 0 ? '#e74c3c' : '#e67e22' }}>
                    {Number(p.stock) <= 0 ? '-' : `-${(Number(p.min_stock) - Number(p.stock)).toFixed(1)}`}
                  </td>
                  <td>
                    {Number(p.stock) <= 0
                      ? <span className="badge badge-danger">Agotado — Reponer urgente</span>
                      : <span className="badge badge-warning">Bajo — Quedan {Number(p.stock)} de {Number(p.min_stock)} mín.</span>
                    }
                  </td>
                </tr>
              ))}
              {products.filter(p => Number(p.stock) <= Number(p.min_stock)).length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#7f8c8d', padding: 20 }}>✅ Todos en orden</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}