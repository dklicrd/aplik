import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Package, Users, ClipboardList, LayoutDashboard, AlertTriangle, Calculator, FileText, LogOut, User } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Inventario from './pages/Inventario';
import Asistencia from './pages/Asistencia';
import Nomina from './pages/Nomina';
import Presupuestos from './pages/Presupuestos';
import Login from './pages/Login';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: '#7f8c8d' }}>Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>APLIK</h1>
          <p>Dashboard de Gestión</p>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end>
            <LayoutDashboard /> <span>Dashboard</span>
          </NavLink>
          <NavLink to="/inventario">
            <Package /> <span>Inventario</span>
          </NavLink>
          <NavLink to="/asistencia">
            <Users /> <span>Asistencia</span>
          </NavLink>
          <NavLink to="/nomina">
            <Calculator /> <span>Nómina</span>
          </NavLink>
          <NavLink to="/presupuestos">
            <FileText /> <span>Presupuestos</span>
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <User size={14} />
            <span>{user?.username}</span>
          </div>
          <button className="btn-logout" onClick={logout}>
            <LogOut size={14} /> Salir
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/asistencia" element={<Asistencia />} />
          <Route path="/nomina" element={<Nomina />} />
          <Route path="/presupuestos" element={<Presupuestos />} />
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