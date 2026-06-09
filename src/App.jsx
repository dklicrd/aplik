import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Package, Users, ClipboardList, LayoutDashboard, Calculator, FileText, LogOut, User, Shield, Menu, X } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { hasPermission } from './utils/api';
import Dashboard from './pages/Dashboard';
import Inventario from './pages/Inventario';
import Asistencia from './pages/Asistencia';
import Nomina from './pages/Nomina';
import Presupuestos from './pages/Presupuestos';
import Usuarios from './pages/Usuarios';
import Proyectos from './pages/Proyectos';
import Almacenes from './pages/Almacenes';
import Login from './pages/Login';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: <LayoutDashboard />, perm: 'dashboard' },
  { path: '/inventario', label: 'Inventario', icon: <Package />, perm: 'inventario' },
  { path: '/asistencia', label: 'Asistencia', icon: <Users />, perm: 'asistencia' },
  { path: '/nomina', label: 'Nómina', icon: <Calculator />, perm: 'nomina' },
  { path: '/presupuestos', label: 'Presupuestos', icon: <FileText />, perm: 'presupuestos' },
  { path: '/usuarios', label: 'Usuarios', icon: <Shield />, perm: 'usuarios' },
  { path: '/proyectos', label: 'Proyectos', icon: <ClipboardList />, perm: 'proyectos' },
  { path: '/almacenes', label: 'Almacenes', icon: <Package />, perm: 'almacenes' },
];

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner"><div className="spinner-inline" /> Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequirePermission({ perm, children }) {
  if (!hasPermission(perm)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const username = user?.username || 'admin';

  const closeSidebar = () => setSidebarOpen(false);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const currentPageLabel = NAV_ITEMS.find(
    item => item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  )?.label || 'Dashboard';

  return (
    <div className="app-layout">
      {/* Sidebar overlay (mobile only) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img src="/logo.webp" alt="APLIK" />
            <div>
              <h1>APLIK</h1>
              <p>Dashboard de Gestión</p>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => {
            const allowed = hasPermission(item.perm);
            if (!allowed && item.perm !== 'dashboard') return null;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={closeSidebar}
                style={!allowed ? { opacity: 0.4, pointerEvents: 'none' } : {}}
              >
                {item.icon} <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <User size={14} />
            <span>{username}</span>
          </div>
          <button className="btn-logout" onClick={logout}>
            <LogOut size={14} /> Salir
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="topbar">
        <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Menú">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <span className="page-title">{currentPageLabel}</span>
      </div>

      {/* Main content */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventario" element={<RequirePermission perm="inventario"><Inventario /></RequirePermission>} />
          <Route path="/asistencia" element={<RequirePermission perm="asistencia"><Asistencia /></RequirePermission>} />
          <Route path="/nomina" element={<RequirePermission perm="nomina"><Nomina /></RequirePermission>} />
          <Route path="/presupuestos" element={<RequirePermission perm="presupuestos"><Presupuestos /></RequirePermission>} />
          <Route path="/usuarios" element={<RequirePermission perm="usuarios"><Usuarios /></RequirePermission>} />
          <Route path="/proyectos" element={<RequirePermission perm="proyectos"><Proyectos /></RequirePermission>} />
          <Route path="/almacenes" element={<RequirePermission perm="almacenes"><Almacenes /></RequirePermission>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App;