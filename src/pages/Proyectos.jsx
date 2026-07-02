import { useState, useEffect } from 'react';
import ModuleNav from '../components/ModuleNav';
import { Plus, Edit2, Trash2, X, Save, RefreshCw } from 'lucide-react';
import { getToken } from '../utils/api';

const API = '';

export default function Proyectos() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', location: '', status: 'activo', budget: '', client: '', notes: '' });

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/projects`);
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (e) {
      setProjects([]);
    }
    setLoading(false);
  };

  useEffect(() => { loadProjects(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', code: '', location: '', status: 'activo', budget: '', client: '', notes: '' });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p.id);
    setForm({
      name: p.name || '',
      code: p.code || '',
      location: p.location || '',
      status: p.status || 'activo',
      budget: p.budget || '',
      client: p.client || '',
      notes: p.notes || ''
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `${API}/api/projects/${editing}` : `${API}/api/projects`;
    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ ...form, budget: Number(form.budget) || 0 })
      });
      setShowModal(false);
      loadProjects();
    } catch (e) {
      alert('Error al guardar');
    }
  };

  const remove = async (id) => {
    if (!confirm('¿Eliminar este proyecto?')) return;
    try {
      await fetch(`${API}/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      loadProjects();
    } catch (e) {
      alert('Error al eliminar');
    }
  };

  if (loading) return <div className="loading">Cargando proyectos...</div>;

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2>Gestión de Proyectos</h2>
          <div style={{ marginTop: 8 }}>
            <button className="btn btn-primary" onClick={openNew}>
              <Plus size={16} /> Nuevo Proyecto
            </button>
          </div>
        </div>
        <ModuleNav />
      </div>

      <div className="table-container">
        <div className="table-wrapper"><table className="card-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Código</th>
              <th>Ubicación</th>
              <th>Estado</th>
              <th>Presupuesto</th>
              <th>Cliente</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td><strong>{p.name}</strong></td>
                <td><span className="badge badge-info">{p.code || '—'}</span></td>
                <td>{p.location || '—'}</td>
                <td><span className={`badge ${p.status === 'activo' ? 'badge-success' : p.status === 'completado' ? 'badge-primary' : 'badge-warning'}`}>{p.status}</span></td>
                <td>${Number(p.budget).toLocaleString('es-DO')}</td>
                <td>{p.client || '—'}</td>
                <td className="actions">
                  <button className="btn-icon" onClick={() => openEdit(p)} title="Editar"><Edit2 size={16} /></button>
                  <button className="btn-icon btn-icon-danger" onClick={() => remove(p.id)} title="Eliminar"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr><td colSpan={8} className="empty">No hay proyectos registrados</td></tr>
            )}
          </tbody>
        </table></div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ej: Proyecto Yaque" />
                </div>
                <div className="form-group">
                  <label>Código</label>
                  <input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="PYG" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ubicación</label>
                  <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Santo Domingo" />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="activo">Activo</option>
                    <option value="completado">Completado</option>
                    <option value="pausado">Pausado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Presupuesto (RD$)</label>
                  <input type="number" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} placeholder="500000" />
                </div>
                <div className="form-group">
                  <label>Cliente</label>
                  <input type="text" value={form.client} onChange={e => setForm({...form, client: e.target.value})} placeholder="PYG Construcciones" />
                </div>
              </div>
              <div className="form-group">
                <label>Notas</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} placeholder="Notas adicionales..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}><Save size={16} /> {editing ? 'Actualizar' : 'Crear'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}