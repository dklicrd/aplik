// API client — connects to the backend
// In dev, uses Vite proxy. In prod, same origin.

const API_BASE = import.meta.env.DEV ? '/api' : '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
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