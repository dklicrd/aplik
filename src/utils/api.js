// API client — connects to the backend
// In dev, uses Vite proxy. In prod, same origin.

const API_BASE = import.meta.env.DEV ? '/api' : '/api';

export function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function getPermissions() {
  try {
    const token = getToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.permissions || null;
  } catch { return null; }
}

export function hasPermission(module) {
  const perms = getPermissions();
  if (!perms) return false;
  return perms[module] === true;
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...authHeaders(), ...options.headers };
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API error');
  }
  return res.json();
}

// Products
export const getProducts = () => request('/products');
export const getProduct = (id) => request(`/products/${id}`);
export const createProduct = (data) => request('/products', { method: 'POST', body: JSON.stringify(data) });
export const updateProduct = (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProduct = (id) => request(`/products/${id}`, { method: 'DELETE' });

// Image upload
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const token = getToken();
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Error al subir imagen');
  }
  return res.json();
}

// Categories
export const getCategories = () => request('/categories');

// Employees
export const getEmployees = () => request('/employees');

// Movements
export const getMovements = () => request('/movements');
export const createMovement = (data) => request('/movements', { method: 'POST', body: JSON.stringify(data) });

// Attendance
export const getAttendance = () => request('/attendance');
export const updateAttendance = (data) => request('/attendance', { method: 'PUT', body: JSON.stringify(data) });

// Employees
export const updateEmployee = (id, data) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) });