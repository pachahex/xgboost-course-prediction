import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, ClipboardList, Brain, Mail, ShieldCheck, GraduationCap } from 'lucide-react';

const DashboardLayout = () => {
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const location = useLocation();

  const getLinkStyle = (path) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
    padding: '1rem',
    textDecoration: 'none',
    color: location.pathname === path ? 'var(--color-text-light)' : '#aaa',
    backgroundColor: location.pathname === path ? 'var(--color-accent)' : 'transparent',
    borderRadius: '4px',
    fontWeight: 500,
    marginBottom: '0.5rem',
    transition: 'all 0.2s'
  });

  const isAdmin = user.rol === 'Administrador';

  return (
    <div style={{ display: 'flex', minHeight: '80vh', backgroundColor: 'var(--bg-page)', transition: 'background-color 0.3s' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', backgroundColor: 'var(--color-primary-dark)', padding: '2rem 1rem', color: 'white' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'white' }}>
          {isAdmin ? 'Admin Panel' : 'Panel de Estudiante'}
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-accent)', marginBottom: '3rem' }}>
          {user.nombre} ({user.rol})
        </p>
 
        <nav>
          {isAdmin ? (
            <>
              <Link to="/dashboard" style={getLinkStyle('/dashboard')}>
                <Home size={18} /> Gestión de Programas
              </Link>
              <Link to="/dashboard/inscripciones" style={getLinkStyle('/dashboard/inscripciones')}>
                <ClipboardList size={18} /> Registro Histórico
              </Link>
              <Link to="/dashboard/ia-predictiva" style={getLinkStyle('/dashboard/ia-predictiva')}>
                <Brain size={18} /> IA y Demanda
              </Link>
              <Link to="/dashboard/mailing" style={getLinkStyle('/dashboard/mailing')}>
                <Mail size={18} /> Email Marketing
              </Link>
              <Link to="/dashboard/seguridad" style={getLinkStyle('/dashboard/seguridad')}>
                <ShieldCheck size={18} /> Seguridad (2FA)
              </Link>
            </>
          ) : (
            <Link to="/dashboard" style={getLinkStyle('/dashboard')}>
              <GraduationCap size={18} /> Mis Cursos
            </Link>
          )}
        </nav>
      </aside>
 
      {/* Main Content */}
      <section style={{ flex: 1, padding: '2rem', overflowX: 'auto' }}>
        <div style={{ 
          backgroundColor: 'var(--panel-bg)', 
          borderRadius: '12px', 
          padding: '2rem', 
          minHeight: '60vh', 
          boxShadow: '0 4px 6px var(--glass-shadow)',
          transition: 'background-color 0.3s, box-shadow 0.3s'
        }}>
          {isAdmin ? (
            <Outlet />
          ) : (
            <div style={{ textAlign: 'center', marginTop: '4rem' }}>
              <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>¡Bienvenido a tu Espacio de Aprendizaje!</h2>
              <p style={{ color: 'var(--text-muted)' }}>Próximamente podrás ver tus cursos inscritos y materiales de estudio aquí.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardLayout;
