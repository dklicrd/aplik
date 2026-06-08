import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, AlertTriangle, X, Save, Edit2, Trash2, Image, DollarSign, Package, Eye, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import { getProducts, getMovements, getCategories, createProduct, updateProduct, deleteProduct, uploadImage } from '../utils/api';

const currency = (n) => `RD$${Number(n).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const calcBruto = (neto) => Math.round(Number(neto || 0) * 1.18 * 100) / 100;
const calcSubtotal = (stock, price) => Number(stock) * Number(price || 0);

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
  const [form, setForm] = useState({ name: '', category: 'pintura', stock: 0, min_stock: 3, unit: 'unidad', price_neto: 0, image_url: '' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const fileInputRef = useRef(null);

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

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadImage(file);
      setForm(prev => ({ ...prev, image_url: result.url }));
    } catch (err) {
      alert('Error al subir imagen: ' + err.message);
    }
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleUpload(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleSave = async () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'El nombre es obligatorio';
    if (!form.category.trim()) errors.category = 'La categoría es obligatoria';
    if (Number(form.price_neto) < 0) errors.price_neto = 'El precio no puede ser negativo';
    if (Number(form.stock) < 0) errors.stock = 'El stock no puede ser negativo';
    if (Number(form.min_stock) < 0) errors.min_stock = 'El stock mínimo no puede ser negativo';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const payload = {
        ...form,
        price_neto: Number(form.price_neto) || 0,
        stock: Number(form.stock) || 0,
        min_stock: Number(form.min_stock) || 0,
      };
      if (editing) {
        await updateProduct(editing, payload);
      } else {
        await createProduct(payload);
      }
      setShowForm(false);
      setEditing(null);
      setFormErrors({});
      setForm({ name: '', category: 'pintura', stock: 0, min_stock: 3, unit: 'unidad', price_neto: 0, image_url: '' });
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleEdit = (p) => {
    setEditing(p.id);
    setForm({
      name: p.name,
      category: p.category,
      stock: Number(p.stock),
      min_stock: Number(p.min_stock),
      unit: p.unit,
      price_neto: Number(p.price_neto || 0),
      image_url: p.image_url || '',
    });
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

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={12} style={{ verticalAlign: 'middle' }} /> : <ChevronDown size={12} style={{ verticalAlign: 'middle' }} />;
  };

  const filteredProducts = products
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = !catFilter || p.category === catFilter;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      let valA, valB;
      switch (sortField) {
        case 'name': valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); break;
        case 'category': valA = a.category; valB = b.category; break;
        case 'stock': valA = Number(a.stock); valB = Number(b.stock); break;
        case 'price_neto': valA = Number(a.price_neto || 0); valB = Number(b.price_neto || 0); break;
        case 'price_bruto': valA = Number(a.price_bruto || 0); valB = Number(b.price_bruto || 0); break;
        case 'subtotal_neto': valA = calcSubtotal(a.stock, a.price_neto); valB = calcSubtotal(b.stock, b.price_neto); break;
        case 'subtotal_bruto': valA = calcSubtotal(a.stock, a.price_bruto); valB = calcSubtotal(b.stock, b.price_bruto); break;
        default: valA = a.name.toLowerCase(); valB = b.name.toLowerCase();
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const totalNeto = products.reduce((sum, p) => sum + calcSubtotal(p.stock, p.price_neto), 0);
  const totalBruto = products.reduce((sum, p) => sum + calcSubtotal(p.stock, p.price_bruto), 0);
  const lowStockCount = products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= Number(p.min_stock)).length;
  const outOfStockCount = products.filter(p => Number(p.stock) <= 0).length;

  const sortedMovements = [...movements].sort((a, b) => new Date(b.date) - new Date(a.date));

  const ProductModal = ({ product, onClose }) => {
    if (!product) return null;
    const neto = Number(product.price_neto || 0);
    const bruto = Number(product.price_bruto || 0);
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 560 }}>
          <div className="modal-header">
            <h3>{product.name}</h3>
            <button className="btn btn-sm" style={{ background: '#eee' }} onClick={onClose}><X size={14} /></button>
          </div>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{
                width: 180, height: 180, borderRadius: 12,
                background: product.image_url ? `url(${product.image_url}) center/cover no-repeat` : '#f0f2f5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, border: '1px solid #e0e0e0', overflow: 'hidden'
              }}>
                {!product.image_url && <Image size={40} color="#ccc" />}
              </div>
              <div style={{ flex: 1 }}>
                <table style={{ width: '100%', fontSize: 13 }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '4px 8px', color: '#7f8c8d', fontWeight: 600, whiteSpace: 'nowrap' }}>Categoría</td>
                      <td style={{ padding: '4px 8px' }}><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{product.category}</span></td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', color: '#7f8c8d', fontWeight: 600 }}>Unidad</td>
                      <td style={{ padding: '4px 8px', textTransform: 'capitalize' }}>{product.unit}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', color: '#7f8c8d', fontWeight: 600 }}>Stock</td>
                      <td style={{ padding: '4px 8px' }}>
                        <span style={{
                          fontWeight: 700, fontSize: 18,
                          color: Number(product.stock) <= 0 ? '#e74c3c' : Number(product.stock) <= Number(product.min_stock) ? '#e67e22' : '#27ae60'
                        }}>
                          {Number(product.stock)}
                        </span>
                        <span style={{ color: '#7f8c8d', fontSize: 12, marginLeft: 4 }}>{product.unit}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', color: '#7f8c8d', fontWeight: 600 }}>Stock Mín.</td>
                      <td style={{ padding: '4px 8px' }}>{Number(product.min_stock)} {product.unit}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', color: '#7f8c8d', fontWeight: 600 }}>Precio Neto</td>
                      <td style={{ padding: '4px 8px' }}><span style={{ fontWeight: 600, fontSize: 16 }}>{neto > 0 ? currency(neto) : '—'}</span></td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', color: '#7f8c8d', fontWeight: 600 }}>Precio Bruto (+18%)</td>
                      <td style={{ padding: '4px 8px' }}><span style={{ fontWeight: 600, fontSize: 16, color: '#e67e22' }}>{bruto > 0 ? currency(bruto) : '—'}</span></td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', color: '#7f8c8d', fontWeight: 600, borderTop: '2px solid #27ae60' }}>Subtotal Neto</td>
                      <td style={{ padding: '4px 8px', borderTop: '2px solid #27ae60' }}>
                        <span style={{ fontWeight: 700, fontSize: 20, color: '#1e3a5f' }}>{neto > 0 ? currency(calcSubtotal(product.stock, product.price_neto)) : '—'}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px', color: '#7f8c8d', fontWeight: 600, borderTop: '2px solid #e67e22' }}>Subtotal Bruto</td>
                      <td style={{ padding: '4px 8px', borderTop: '2px solid #e67e22' }}>
                        <span style={{ fontWeight: 700, fontSize: 20, color: '#e67e22' }}>{bruto > 0 ? currency(calcSubtotal(product.stock, product.price_bruto)) : '—'}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {Number(product.stock) <= 0
                    ? <span className="badge badge-danger">Agotado</span>
                    : Number(product.stock) <= Number(product.min_stock)
                      ? <span className="badge badge-warning">Stock bajo</span>
                      : <span className="badge badge-success">Stock OK</span>
                  }
                  {product.category && <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{product.category}</span>}
                  {product.unit && <span className="badge" style={{ background: '#e8e8e8', color: '#555' }}>{product.unit}</span>}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-sm btn-primary" onClick={() => { handleEdit(product); onClose(); }}>
              <Edit2 size={12} /> Editar
            </button>
            <button className="btn btn-sm" style={{ background: '#eee' }} onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="page-header"><h2>Inventario</h2><p style={{ color: '#7f8c8d' }}>Cargando...</p></div>;

  return (
    <div>
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />

      <div className="page-header">
        <h2>Inventario</h2>
        <p>Control de productos con precios neto y bruto (+18%)</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label"><Package size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Productos</div>
          <div className="stat-value">{products.length}</div>
          <div className="stat-sub">{categories.length} categorías</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Alertas</div>
          <div className="stat-value" style={{ color: (outOfStockCount + lowStockCount) > 0 ? '#e74c3c' : '#27ae60' }}>
            {outOfStockCount + lowStockCount}
          </div>
          <div className="stat-sub">{outOfStockCount} agotados · {lowStockCount} por agotar</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #27ae60' }}>
          <div className="stat-label"><DollarSign size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Valor Total Neto</div>
          <div className="stat-value" style={{ fontSize: 22 }}>{currency(totalNeto)}</div>
          <div className="stat-sub">Sin ITBIS</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #e67e22' }}>
          <div className="stat-label"><DollarSign size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Valor Total Bruto</div>
          <div className="stat-value" style={{ fontSize: 22, color: '#e67e22' }}>{currency(totalBruto)}</div>
          <div className="stat-sub">Incluye ITBIS 18%</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'productos' ? 'active' : ''}`} onClick={() => setTab('productos')}>
          Productos ({products.length})
        </button>
        <button className={`tab ${tab === 'movimientos' ? 'active' : ''}`} onClick={() => setTab('movimientos')}>
          Movimientos ({movements.length})
        </button>
        <button className={`tab ${tab === 'alertas' ? 'active' : ''}`} onClick={() => setTab('alertas')}>
          Alertas {outOfStockCount + lowStockCount > 0 && `(${outOfStockCount + lowStockCount})`}
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
              <option value="">Todas las categorías</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ name: '', category: 'pintura', stock: 0, min_stock: 3, unit: 'unidad', price_neto: 0, image_url: '' }); setShowForm(true); }}>
              <Plus size={16} /> Nuevo
            </button>
          </div>

          {showForm && (
            <div className="card" style={{ border: '2px solid #3498db' }}>
              <div className="card-header">
                <h3>{editing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                <button className="btn btn-sm" style={{ background: '#eee' }} onClick={() => { setShowForm(false); setEditing(null); }}><X size={14} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Nombre <span style={{color:'#e74c3c'}}>*</span></label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ej: Cub Total Blanco"
                    style={formErrors.name ? {borderColor: '#e74c3c'} : {}} />
                  {formErrors.name && <span style={{color:'#e74c3c', fontSize: 11}}>{formErrors.name}</span>}
                </div>
                <div className="form-group">
                  <label>Categoría <span style={{color:'#e74c3c'}}>*</span></label>
                  <select value={form.category} onChange={e => { setForm({...form, category: e.target.value}); setFormErrors(prev => ({...prev, category: undefined})); }}>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  {formErrors.category && <span style={{color:'#e74c3c', fontSize: 11}}>{formErrors.category}</span>}
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
                <div className="form-group">
                  <label>Precio Neto (RD$) <span style={{color:'#e74c3c'}}>*</span></label>
                  <input type="number" step="0.01" min="0" value={form.price_neto} onChange={e => setForm({...form, price_neto: e.target.value})} placeholder="0.00"
                    style={formErrors.price_neto ? {borderColor: '#e74c3c'} : {}} />
                  {formErrors.price_neto && <span style={{color:'#e74c3c', fontSize: 11}}>{formErrors.price_neto}</span>}
                  {Number(form.price_neto) > 0 && (
                    <span style={{color: '#e67e22', fontSize: 11, display: 'block', marginTop: 2}}>
                      Bruto (+18%): <strong>{currency(calcBruto(form.price_neto))}</strong>
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label>Stock</label>
                  <input type="number" step="0.01" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})}
                    style={formErrors.stock ? {borderColor: '#e74c3c'} : {}} />
                  {formErrors.stock && <span style={{color:'#e74c3c', fontSize: 11}}>{formErrors.stock}</span>}
                </div>
                <div className="form-group">
                  <label>Stock Mínimo</label>
                  <input type="number" step="0.01" value={form.min_stock} onChange={e => setForm({...form, min_stock: e.target.value})}
                    style={formErrors.min_stock ? {borderColor: '#e74c3c'} : {}} />
                  {formErrors.min_stock && <span style={{color:'#e74c3c', fontSize: 11}}>{formErrors.min_stock}</span>}
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Imagen del Producto</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${dragOver ? '#3498db' : form.image_url ? '#27ae60' : '#ccc'}`,
                      borderRadius: 8, padding: 16, cursor: 'pointer',
                      background: dragOver ? '#ebf5fb' : '#fafafa',
                      transition: 'all 0.2s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      minHeight: 100, justifyContent: 'center'
                    }}
                  >
                    {form.image_url ? (
                      <>
                        <img src={form.image_url} alt="" style={{ maxHeight: 80, maxWidth: '100%', borderRadius: 6, objectFit: 'contain' }} />
                        <div style={{ fontSize: 12, color: '#7f8c8d', display: 'flex', gap: 8 }}>
                          <span>✓ Imagen subida</span>
                          <button className="btn btn-sm" style={{ background: '#eee' }} onClick={(e) => { e.stopPropagation(); setForm(prev => ({ ...prev, image_url: '' })); }}>
                            <X size={12} /> Quitar
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {uploading ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                            <div className="spinner" style={{ width: 24, height: 24, border: '3px solid #eee', borderTop: '3px solid #3498db', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            <span style={{ fontSize: 13, color: '#7f8c8d' }}>Subiendo imagen...</span>
                          </div>
                        ) : (
                          <>
                            <Upload size={28} color={dragOver ? '#3498db' : '#bbb'} />
                            <span style={{ fontSize: 14, color: '#555' }}>
                              {dragOver ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz clic para seleccionar'}
                            </span>
                            <span style={{ fontSize: 11, color: '#aaa' }}>JPG, PNG, GIF o WebP · Máx 5MB</span>
                          </>
                        )}
                      </>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                  </div>
                </div>
              </div>
              {Number(form.price_neto) > 0 && (
                <div style={{ marginTop: 8, fontSize: 13, color: '#7f8c8d', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span>Neto: <strong>{currency(form.price_neto)}</strong></span>
                  <span>Bruto (+18%): <strong style={{ color: '#e67e22' }}>{currency(calcBruto(form.price_neto))}</strong></span>
                  {Number(form.stock) > 0 && (
                    <>
                      <span>Subtotal Neto: <strong>{currency(calcSubtotal(form.stock, form.price_neto))}</strong></span>
                      <span>Subtotal Bruto: <strong style={{ color: '#e67e22' }}>{currency(calcSubtotal(form.stock, calcBruto(form.price_neto)))}</strong></span>
                    </>
                  )}
                </div>
              )}
              <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={handleSave}>
                <Save size={16} /> {editing ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          )}

          <div className="card" style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ minWidth: 1100 }}>
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => toggleSort('name')}>Producto <SortIcon field="name" /></th>
                    <th className="sortable" onClick={() => toggleSort('category')}>Categoría <SortIcon field="category" /></th>
                    <th className="sortable" onClick={() => toggleSort('stock')}>Stock <SortIcon field="stock" /></th>
                    <th>Unidad</th>
                    <th className="sortable" onClick={() => toggleSort('price_neto')}>Precio Neto <SortIcon field="price_neto" /></th>
                    <th className="sortable" onClick={() => toggleSort('price_bruto')}>Precio Bruto <SortIcon field="price_bruto" /></th>
                    <th className="sortable" onClick={() => toggleSort('subtotal_neto')}>Subtotal Neto <SortIcon field="subtotal_neto" /></th>
                    <th className="sortable" onClick={() => toggleSort('subtotal_bruto')}>Subtotal Bruto <SortIcon field="subtotal_bruto" /></th>
                    <th>Estado</th>
                    <th style={{ width: 100 }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => {
                    const isLow = Number(p.stock) <= Number(p.min_stock);
                    const neto = Number(p.price_neto || 0);
                    const bruto = Number(p.price_bruto || 0);
                    return (
                      <tr key={p.id} style={isLow ? { background: '#fff9f0' } : {}}>
                        <td>
                          <strong style={{ cursor: 'pointer', color: '#1e3a5f' }} onClick={() => setSelectedProduct(p)} title="Ver detalle">
                            {p.image_url ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <img src={p.image_url} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }} />
                                {p.name}
                              </span>
                            ) : p.name}
                          </strong>
                        </td>
                        <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{p.category}</span></td>
                        <td style={{ fontWeight: 600, color: Number(p.stock) <= 0 ? '#e74c3c' : isLow ? '#e67e22' : '#27ae60' }}>{Number(p.stock)}</td>
                        <td style={{ textTransform: 'capitalize' }}>{p.unit}</td>
                        <td style={{ fontWeight: 500 }}>{neto > 0 ? currency(neto) : <span style={{ color: '#ccc' }}>—</span>}</td>
                        <td style={{ fontWeight: 600, color: '#e67e22' }}>{bruto > 0 ? currency(bruto) : <span style={{ color: '#ccc' }}>—</span>}</td>
                        <td style={{ fontWeight: 700, color: neto > 0 ? '#1e3a5f' : '#ccc' }}>{neto > 0 ? currency(calcSubtotal(p.stock, p.price_neto)) : '—'}</td>
                        <td style={{ fontWeight: 700, color: bruto > 0 ? '#e67e22' : '#ccc' }}>{bruto > 0 ? currency(calcSubtotal(p.stock, p.price_bruto)) : '—'}</td>
                        <td>
                          {Number(p.stock) <= 0
                            ? <span className="badge badge-danger">Agotado</span>
                            : isLow ? <span className="badge badge-warning">Por agotar</span>
                            : <span className="badge badge-success">OK</span>
                          }
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-sm" style={{ background: '#e8f4f8', color: '#2980b9' }} onClick={() => setSelectedProduct(p)} title="Ver detalle"><Eye size={12} /></button>
                            <button className="btn btn-sm btn-primary" onClick={() => handleEdit(p)}><Edit2 size={12} /></button>
                            <button className="btn btn-sm" style={{ background: '#e74c3c', color: 'white' }} onClick={() => handleDelete(p.id)}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td colSpan={6} style={{ textAlign: 'right', fontWeight: 700, padding: '12px 12px', fontSize: 14 }}>
                      TOTAL GENERAL:
                    </td>
                    <td style={{ fontWeight: 700, padding: '12px 12px', fontSize: 16, color: '#1e3a5f' }}>{currency(totalNeto)}</td>
                    <td style={{ fontWeight: 700, padding: '12px 12px', fontSize: 16, color: '#e67e22' }}>{currency(totalBruto)}</td>
                    <td colSpan={2} style={{ fontWeight: 600, padding: '12px 12px', fontSize: 13, color: '#7f8c8d' }}>
                      {products.filter(p => Number(p.price_neto || 0) > 0).length} productos con precio
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {filteredProducts.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#7f8c8d' }}>
                <Package size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                <p>No hay productos que coincidan con tu búsqueda</p>
              </div>
            )}
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
                  <td><strong style={{ cursor: 'pointer', color: '#1e3a5f' }} onClick={() => setSelectedProduct(p)}>{p.name}</strong></td>
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