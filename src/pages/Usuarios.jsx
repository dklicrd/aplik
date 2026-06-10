import React, { useState, useEffect } from 'react';
import ModuleNav from '../components/ModuleNav';
import { getToken } from '../utils/api';
import { Shield, UserPlus, Edit2, Trash2, X, Save, Eye, EyeOff, KeyRound } from 'lucide-react';

const PAGE_LABELS = {
  dashboard: 'Dashboard',
  inventario: 'Inventario',
  asistencia: 'Asistencia',
  nomina: 'Nómina',
  presupuestos: 'Presupuestos',
  proyectos: 'Proyectos',
  usuarios: 'Usuarios',
};

const PAGE_ICONS = {
  dashboard: '📊',
  inventario: '📦',
  asistencia: '👥',
  nomina: '💰',
  presupuestos: '📋',
  proyectos: '📋',
  usuarios: '🔐',
};

export default function Usuarios() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({
    username: '', password: '', role: 'user',
    permissions: { dashboard: true, inventario: true, asistencia: true, nomina: true, presupuestos: true, proyectos: true, usuarios: false }
  });
  const [showPw, setShowPw] = useState(false);

  const apiCall = async (url, options = {}) => {
    const token = getToken();
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error');
    }
    return res.json();
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/api/users');
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const getPerms = (u) => {
    if (typeof u.permissions === 'string') return JSON.parse(u.permissions);
    return u.permissions || {};
  };

  const openNew = () => {
    setEditUser(null);
    setForm({ username: '', password: '', role: 'user', permissions: { dashboard: true, inventario: true, asistencia: true, nomina: true, presupuestos: true, proyectos: true, usuarios: false } });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ username: u.username, password: '', role: u.role, permissions: { ...getPerms(u) } });
    setShowModal(true);
  };

  const togglePerm = (key) => {
    setForm({ ...form, permissions: { ...form.permissions, [key]: !form.permissions[key] } });
  };

  const handleSave = async () => {
    if (!form.username.trim()) return;
    try {
      if (editUser) {
        const body = { username: form.username, role: form.role, permissions: form.permissions };
        if (form.password) body.password = form.password;
        await apiCall(`/api/users/${editUser.id}`, {
          method: 'PUT', body: JSON.stringify(body)
        });
      } else {
        if (!form.password) { alert('Contraseña requerida'); return; }
        await apiCall('/api/users', {
          method: 'POST', body: JSON.stringify({ ...form, permissions: form.permissions })
        });
      }
      setShowModal(false);
      await fetchUsers();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  const handleDelete = async (u) => {
    if (u.id === 1) { alert('No puedes eliminar el usuario admin principal'); return; }
    if (!confirm(`¿Eliminar usuario "${u.username}"?`)) return;
    try {
      await apiCall(`/api/users/${u.id}`, { method: 'DELETE' });
      await fetchUsers();
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  if (loading) return <div><h2>Usuarios</h2><p>Cargando...</p></div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2>Gestión de Usuarios</h2>
          <p>Administra accesos y permisos al dashboard</p>
        </div>
        <ModuleNav />
      </div>

      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={openNew}>
          <UserPlus size={16} /> Nuevo Usuario
        </button>
      </div>

      <div className="card">
        <div className="table-wrapper"><table className="card-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Permisos</th>
              <th>Creado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const perms = getPerms(u);
              return (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td><strong>{u.username}</strong></td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-danger' : 'badge-info'}`}>
                      {u.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {Object.entries(PAGE_LABELS).map(([key, label]) => (
                        <span key={key}
                          className={`badge ${perms[key] ? 'badge-success' : 'badge-warning'}`}
                          style={{ fontSize: 10 }}
                        >
                          {PAGE_ICONS[key]} {perms[key] ? '✓' : '✗'} {label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: '#7f8c8d' }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('es-DO') : '-'}
                  </td>
                  <td>
                    <button className="btn btn-sm" onClick={() => openEdit(u)} style={{ marginRight: 4 }}>
                      <Edit2 size={13} />
                    </button>
                    <button className="btn btn-sm" onClick={() => handleDelete(u)} style={{ color: '#e74c3c' }}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#7f8c8d', padding: 20 }}>No hay usuarios</td></tr>
            )}
          </tbody>
        </table></div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 520 }}>
            <div className="modal-header">
              <h3><Shield size={16} style={{ marginRight: 8 }} />{editUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button className="btn btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nombre de Usuario</label>
                <input type="text" value={form.username}
                  onChange={e => setForm({...form, username: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Contraseña {editUser && '(dejar vacío para no cambiar)'}</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    style={{ paddingRight: 44, width: '100%', padding: '10px 44px 10px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14 }}
                    required={!editUser}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7f8c8d', padding: 4 }}>
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="form-group">
                <label>Permisos por Módulo</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                  {Object.entries(PAGE_LABELS).map(([key, label]) => (
                    <div key={key}
                      onClick={() => togglePerm(key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                        background: form.permissions[key] ? '#d4edda' : '#f0f2f5',
                        border: `2px solid ${form.permissions[key] ? '#27ae60' : '#e0e0e0'}`,
                        transition: 'all 0.2s',
                        userSelect: 'none',
                      }}
                    >
                      <div style={{
                        width: 22, height: 22, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: form.permissions[key] ? '#27ae60' : '#bdc3c7', color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0,
                      }}>
                        {form.permissions[key] ? '✓' : '✗'}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: form.permissions[key] ? 600 : 400 }}>
                        {PAGE_ICONS[key]} {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!form.username.trim()}>
                <Save size={14} /> {editUser ? 'Actualizar' : 'Crear Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === TRAZABILIDAD === */}
      <div style={{ marginTop: 32 }}>
        <AuditTrail />
      </div>
    </div>
  );
}

// Audit trail component
const ACTION_STYLES = {
  crear: 'badge-success',
  editar: 'badge-info',
  eliminar: 'badge-danger',
};

function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [filterEntity, setFilterEntity] = useState('');
  const [limit, setLimit] = useState(100);

  const fetchLogs = async () => {
    try {
      const token = getToken();
      let url = '/api/audit-logs?limit=' + limit;
      if (filterEntity) url += '&entity=' + encodeURIComponent(filterEntity);
      const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchLogs(); }, [filterEntity, limit]);

  return (
    <div className="card" style={{ overflow: 'visible' }}>
      <h3 style={{ padding: '16px 16px 0' }}>
        <Shield size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
        Trazabilidad 📋
      </h3>
      <div style={{ padding: '8px 16px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>Filtrar por modulo:</label>
        <select value={filterEntity} onChange={e => setFilterEntity(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc', fontSize: 13 }}>
          <option value="">Todos</option>
          <option value="producto">Productos</option>
          <option value="proyecto">Proyectos</option>
          <option value="almacen">Almacenes</option>
          <option value="transferencia">Transferencias</option>
          <option value="empleado">Empleados</option>
          <option value="asistencia">Asistencia</option>
          <option value="usuario">Usuarios</option>
        </select>
        <label style={{ fontSize: 13, fontWeight: 600, marginLeft: 8 }}>Mostrar:</label>
        <select value={limit} onChange={e => setLimit(Number(e.target.value))}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc', fontSize: 13 }}>
          <option value={100}>100</option>
          <option value={200}>200</option>
          <option value={500}>500</option>
        </select>
        <button className="btn btn-sm" onClick={fetchLogs} style={{ marginLeft: 'auto' }}>
          Refrescar
        </button>
      </div>
      <div className="table-wrapper"><table className="card-table">
        <thead>
          <tr>
            <th>Fecha/Hora</th>
            <th>Usuario</th>
            <th>Accion</th>
            <th>Modulo</th>
            <th>ID</th>
            <th>Detalle</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => {
            const dt = log.created_at ? new Date((log.created_at.endsWith('Z') ? log.created_at : log.created_at + 'Z')).toLocaleString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
            return (
              <tr key={log.id}>
                <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{dt}</td>
                <td><strong>{log.username}</strong></td>
                <td><span className={'badge ' + (ACTION_STYLES[log.action] || 'badge-info')}>{log.action}</span></td>
                <td><span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>{log.entity}</span></td>
                <td>{log.entity_id || '-'}</td>
                <td style={{ fontSize: 13, color: '#555', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.details}</td>
              </tr>
            );
          })}
          {logs.length === 0 && (
            <tr><td colSpan={6} style={{ textAlign: 'center', color: '#7f8c8d', padding: 20 }}>No hay registros de trazabilidad</td></tr>
          )}
        </tbody>
      </table></div>
    </div>
  );
}