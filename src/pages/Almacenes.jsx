import { useState, useEffect } from 'react';
import ModuleNav from '../components/ModuleNav';
import { Plus, Edit2, Trash2, X, Save, RefreshCw, Warehouse, ArrowRightLeft, ArrowRight } from 'lucide-react';
import { getToken } from '../utils/api';

const API = 'https://aplik-dashboard.onrender.com';

export default function Almacenes() {
  const [tab, setTab] = useState('almacenes'); // almacenes | transferencias
  const [almacenes, setAlmacenes] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [transferModal, setTransferModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ name: '', type: 'secundario', location: '', project_id: '' });
  const [transferForm, setTransferForm] = useState({ product_id: '', product_name: '', qty: 1, from_location: '', to_location: '', note: '' });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [almRes, traRes, prodRes, projRes] = await Promise.all([
        fetch(`${API}/api/warehouses`),
        fetch(`${API}/api/transfers`),
        fetch(`${API}/api/products`),
        fetch(`${API}/api/projects`)
      ]);
      setAlmacenes(await almRes.json());
      setTransfers(await traRes.json());
      setProducts(await prodRes.json());
      setProjects(await projRes.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const openNew = () => {
    setEditId(null);
    setForm({ name: '', type: 'secundario', location: '', project_id: '' });
    setShowModal(true);
  };

  const openEdit = (a) => {
    setEditId(a.id);
    setForm({ name: a.name, type: a.type, location: a.location || '', project_id: a.project_id || '' });
    setShowModal(true);
  };

  const saveAlmacen = async () => {
    if (!form.name.trim()) return;
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `${API}/api/warehouses/${editId}` : `${API}/api/warehouses`;
    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ ...form, project_id: form.project_id ? Number(form.project_id) : null })
      });
      setShowModal(false);
      loadAll();
    } catch (e) { alert('Error al guardar'); }
  };

  const removeAlmacen = async (id) => {
    if (!confirm('¿Eliminar este almacén?')) return;
    try {
      await fetch(`${API}/api/warehouses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      loadAll();
    } catch (e) { alert('Error al eliminar'); }
  };

  const openTransfer = () => {
    setTransferForm({ product_id: '', product_name: '', qty: 1, from_location: '', to_location: '', note: '' });
    setTransferModal(true);
  };

  const saveTransfer = async () => {
    if (!transferForm.product_id || !transferForm.from_location || !transferForm.to_location) return;
    try {
      const prod = products.find(p => p.id === Number(transferForm.product_id));
      await fetch(`${API}/api/transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({
          product_id: Number(transferForm.product_id),
          product_name: prod?.name || transferForm.product_name,
          qty: Number(transferForm.qty),
          from_location: transferForm.from_location,
          to_location: transferForm.to_location,
          note: transferForm.note
        })
      });
      setTransferModal(false);
      loadAll();
    } catch (e) { alert('Error al transferir'); }
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2>Almacenes</h2>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <ModuleNav />
          <button className={`btn ${tab === 'almacenes' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('almacenes')}>
            <Warehouse size={16} /> Almacenes
          </button>
          <button className={`btn ${tab === 'transferencias' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('transferencias')}>
            <ArrowRightLeft size={16} /> Transferencias
          </button>
        </div>
      </div>

      {tab === 'almacenes' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={openNew}>
              <Plus size={16} /> Nuevo Almacén
            </button>
          </div>
          <div className="table-container">
            <div className="table-wrapper"><table className="card-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Ubicación</th>
                  <th>Proyecto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {almacenes.map(a => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td><strong>{a.name}</strong></td>
                    <td><span className={`badge ${a.type === 'central' ? 'badge-danger' : 'badge-info'}`}>{a.type}</span></td>
                    <td>{a.location || '—'}</td>
                    <td>{a.project_name || '—'}</td>
                    <td className="actions">
                      <button className="btn-icon" onClick={() => openEdit(a)} title="Editar"><Edit2 size={16} /></button>
                      <button className="btn-icon btn-icon-danger" onClick={() => removeAlmacen(a.id)} title="Eliminar"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
                {almacenes.length === 0 && <tr><td colSpan={6} className="empty">No hay almacenes</td></tr>}
              </tbody>
            </table></div>
          </div>
        </>
      )}

      {tab === 'transferencias' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={openTransfer}>
              <ArrowRight size={16} /> Nueva Transferencia
            </button>
          </div>
          <div className="table-container">
            <div className="table-wrapper"><table className="card-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontSize: 12, color: '#7f8c8d' }}>
                      {t.date ? new Date(t.date).toLocaleString('es-DO') : '—'}
                    </td>
                    <td><strong>{t.product_name}</strong></td>
                    <td>{Number(t.qty)}</td>
                    <td><span className="badge badge-warning">{t.from_location}</span></td>
                    <td><span className="badge badge-success">{t.to_location}</span></td>
                    <td style={{ fontSize: 12, color: '#7f8c8d' }}>{t.note || '—'}</td>
                  </tr>
                ))}
                {transfers.length === 0 && <tr><td colSpan={6} className="empty">No hay transferencias</td></tr>}
              </tbody>
            </table></div>
          </div>
        </>
      )}

      {/* Modal Almacén */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Editar Almacén' : 'Nuevo Almacén'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nombre *</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Almacén Norte" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Tipo</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="central">Central</option>
                    <option value="secundario">Secundario</option>
                    <option value="proyecto">Proyecto</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Ubicación</label>
                  <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Santo Domingo" />
                </div>
              </div>
              <div className="form-group">
                <label>Proyecto (opcional)</label>
                <select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})}>
                  <option value="">Sin proyecto asignado</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} {p.code ? `(${p.code})` : ''}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveAlmacen}><Save size={16} /> {editId ? 'Actualizar' : 'Crear'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Transferencia */}
      {transferModal && (
        <div className="modal-overlay" onClick={() => setTransferModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nueva Transferencia</h3>
              <button className="btn-icon" onClick={() => setTransferModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Producto</label>
                <select value={transferForm.product_id} onChange={e => {
                  const pid = e.target.value;
                  const prod = products.find(p => p.id === Number(pid));
                  setTransferForm({
                    ...transferForm,
                    product_id: pid,
                    product_name: prod ? `${prod.name} (stock: ${prod.stock})` : ''
                  });
                }}>
                  <option value="">Seleccionar producto...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Origen</label>
                  <select value={transferForm.from_location}
                    onChange={e => setTransferForm({...transferForm, from_location: e.target.value})}>
                    <option value="">Seleccionar origen...</option>
                    {almacenes.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Destino</label>
                  <select value={transferForm.to_location}
                    onChange={e => setTransferForm({...transferForm, to_location: e.target.value})}>
                    <option value="">Seleccionar destino...</option>
                    {almacenes.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Cantidad</label>
                <input type="number" min={1} value={transferForm.qty}
                  onChange={e => setTransferForm({...transferForm, qty: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Nota (opcional)</label>
                <input type="text" value={transferForm.note}
                  onChange={e => setTransferForm({...transferForm, note: e.target.value})}
                  placeholder="Motivo de la transferencia" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setTransferModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveTransfer}>
                <ArrowRight size={16} /> Transferir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}