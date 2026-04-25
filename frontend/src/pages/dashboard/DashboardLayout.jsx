import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const DashboardLayout = () => {
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const location = useLocation();

  const getLinkStyle = (path) => ({
    display: 'block',
    padding: '1rem',
    textDecoration: 'none',
    color: location.pathname === path ? 'var(--color-text-light)' : '#aaa',
    backgroundColor: location.pathname === path ? 'var(--color-accent)' : 'transparent',
    borderRadius: '4px',
    fontWeight: 500,
    marginBottom: '0.5rem',
    transition: 'all 0.2s'
  });

  return (
    <div style={{ display: 'flex', minHeight: '80vh', backgroundColor: '#f4f6f8' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', backgroundColor: 'var(--color-primary-dark)', padding: '2rem 1rem', color: 'white' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'white' }}>Admin Panel</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-accent)', marginBottom: '3rem' }}>{user.nombre}</p>

        <nav>
          <Link to="/dashboard" style={getLinkStyle('/dashboard')}>
            🏠 Gestión de Programas
          </Link>
          <Link to="/dashboard/inscripciones" style={getLinkStyle('/dashboard/inscripciones')}>
            📋 Registro Histórico
          </Link>
          <Link to="/dashboard/ia-predictiva" style={getLinkStyle('/dashboard/ia-predictiva')}>
            🧠 IA y Demanda
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <section style={{ flex: 1, padding: '2rem', overflowX: 'auto' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', minHeight: '60vh', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <Outlet />
        </div>
      </section>
    </div>
  );
};

export default DashboardLayout;
