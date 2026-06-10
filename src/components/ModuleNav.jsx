import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';

const MODULES = [
  { path: '/',           label: 'Dashboard' },
  { path: '/inventario',  label: 'Inventario' },
  { path: '/asistencia',  label: 'Asistencia' },
  { path: '/nomina',      label: 'Nómina' },
  { path: '/presupuestos',label: 'Presupuestos' },
  { path: '/usuarios',    label: 'Usuarios' },
  { path: '/proyectos',   label: 'Proyectos' },
  { path: '/almacenes',   label: 'Almacenes' },
];

export default function ModuleNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentIdx = MODULES.findIndex(m => 
    m.path === '/' ? location.pathname === '/' : location.pathname.startsWith(m.path)
  );

  const prev = currentIdx > 0 ? MODULES[currentIdx - 1] : null;
  const next = currentIdx < MODULES.length - 1 ? MODULES[currentIdx + 1] : null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginLeft: 'auto',
    }}>
      {prev && (
        <button
          onClick={() => navigate(prev.path)}
          title={`Anterior: ${prev.label}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px',
            border: '1px solid #e0e0e0',
            borderRadius: 6,
            background: 'white',
            cursor: 'pointer',
            fontSize: 13,
            color: '#555',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.color = '#333'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#555'; }}
        >
          <ArrowLeft size={14} /> {prev.label}
        </button>
      )}
      <button
        onClick={() => navigate('/')}
        title="Ir al inicio"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          border: '1px solid #e0e0e0',
          borderRadius: 6,
          background: 'white',
          cursor: 'pointer',
          color: '#555',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.color = '#333'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#555'; }}
      >
        <Home size={16} />
      </button>
      {next && (
        <button
          onClick={() => navigate(next.path)}
          title={`Siguiente: ${next.label}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px',
            border: '1px solid #e0e0e0',
            borderRadius: 6,
            background: 'white',
            cursor: 'pointer',
            fontSize: 13,
            color: '#555',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.color = '#333'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#555'; }}
        >
          {next.label} <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}