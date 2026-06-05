import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Package, Users, ClipboardList, LayoutDashboard, AlertTriangle, Calculator } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Inventario from './pages/Inventario';
import Asistencia from './pages/Asistencia';
import Nomina from './pages/Nomina';

function App() {
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
        </nav>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/asistencia" element={<Asistencia />} />
          <Route path="/nomina" element={<Nomina />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;