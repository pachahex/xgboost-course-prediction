import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, Brain, Mail, ShieldCheck, GraduationCap, Settings, Menu, X, LogOut, ArrowLeft, List } from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle';

const DashboardLayout = () => {
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isProgramasOpen, setIsProgramasOpen] = useState(true); // Abierto por defecto

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

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* Header Móvil - Ahora es el único header visible en el dashboard */}
      <header className="dashboard-header-mobile">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GraduationCap size={24} color="var(--color-accent-light)" />
          <span style={{ fontWeight: 'bold' }}>Panel {isAdmin ? 'Admin' : 'Estudiante'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeToggle />
          <button 
            onClick={toggleSidebar}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            {isSidebarOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'white' }}>
              Autopoiesis
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-accent-light)', marginBottom: '1rem' }}>
              {user.nombre}
            </p>
          </div>
          <div className="desktop-only" style={{ marginTop: '0.2rem' }}>
            <ThemeToggle />
          </div>
        </div>

        <div className="mobile-only" style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.1)', display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'white' }}>
            {user.rol}
          </div>
        </div>

        <div className="desktop-only" style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.1)', display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'white' }}>
            {user.rol}
          </div>
        </div>

        <nav onClick={() => setSidebarOpen(false)}>
          {isAdmin ? (
            <>
              <div style={{ marginBottom: '0.5rem' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProgramasOpen(!isProgramasOpen);
                  }}
                  style={{
                    ...getLinkStyle(location.pathname.startsWith('/dashboard') && !['/dashboard/inscripciones', '/dashboard/ia-predictiva', '/dashboard/mailing'].includes(location.pathname) ? location.pathname : '/dashboard'),
                    width: '100%',
                    border: 'none',
                    cursor: 'pointer',
                    justifyContent: 'space-between',
                    backgroundColor: location.pathname === '/dashboard' || location.pathname === '/dashboard/beneficios' ? 'rgba(255,255,255,0.05)' : 'transparent',
                    color: location.pathname === '/dashboard' || location.pathname === '/dashboard/beneficios' ? 'white' : '#aaa'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <Home size={18} /> Gestión Académica
                  </div>
                  <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>{isProgramasOpen ? '▲' : '▼'}</span>
                </button>
                
                {isProgramasOpen && (
                  <div style={{ paddingLeft: '1.5rem', marginTop: '0.2rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <Link 
                      to="/dashboard" 
                      style={{ 
                        ...getLinkStyle('/dashboard'), 
                        padding: '0.7rem 1rem', 
                        fontSize: '0.9rem',
                        backgroundColor: location.pathname === '/dashboard' ? 'var(--color-accent)' : 'transparent'
                      }}
                    >
                      <GraduationCap size={16} /> Programas
                    </Link>
                    <Link 
                      to="/dashboard/beneficios" 
                      style={{ 
                        ...getLinkStyle('/dashboard/beneficios'), 
                        padding: '0.7rem 1rem', 
                        fontSize: '0.9rem',
                        backgroundColor: location.pathname === '/dashboard/beneficios' ? 'var(--color-accent)' : 'transparent'
                      }}
                    >
                      <List size={16} /> Catálogo Beneficios
                    </Link>
                  </div>
                )}
              </div>
              <Link to="/dashboard/inscripciones" style={getLinkStyle('/dashboard/inscripciones')}>
                <ClipboardList size={18} /> Registro Histórico
              </Link>
              <Link to="/dashboard/ia-predictiva" style={getLinkStyle('/dashboard/ia-predictiva')}>
                <Brain size={18} /> IA y Demanda
              </Link>
              <Link to="/dashboard/mailing" style={getLinkStyle('/dashboard/mailing')}>
                <Mail size={18} /> Email Marketing
              </Link>
            </>
          ) : (
            <Link to="/dashboard" style={getLinkStyle('/dashboard')}>
              <GraduationCap size={18} /> Mis Cursos
            </Link>
          )}

          <div style={{ margin: '1.5rem 0', height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          
          <Link to="/dashboard/preferencias" style={getLinkStyle('/dashboard/preferencias')}>
            <Settings size={18} /> Perfil y Preferencias
          </Link>
          <Link to="/dashboard/seguridad" style={getLinkStyle('/dashboard/seguridad')}>
            <ShieldCheck size={18} /> Seguridad (2FA)
          </Link>

          <div style={{ margin: '1.5rem 0', height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          
          {/* Enlaces de salida */}
          <Link to="/" style={getLinkStyle('/ext-home')}>
            <ArrowLeft size={18} /> Volver a la Web
          </Link>
          <button 
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              padding: '1rem',
              backgroundColor: 'rgba(231, 76, 60, 0.2)',
              color: '#ff7675',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500,
              marginTop: '1rem'
            }}
          >
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        
        {/* Banner de Verificación de Correo */}
        {user.email_verificado === false && (
          <div style={{
            backgroundColor: 'rgba(243, 156, 18, 0.1)',
            borderLeft: '4px solid #f39c12',
            padding: '1rem',
            marginBottom: '1.5rem',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <Mail color="#f39c12" size={24} />
            <div>
              <h4 style={{ color: '#f39c12', margin: '0 0 0.25rem 0' }}>Verifica tu correo electrónico</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                Por favor revisa tu bandeja de entrada para garantizar la recepción de tus certificados.
              </p>
            </div>
          </div>
        )}

        <div className="dashboard-content-card">
          {isAdmin || location.pathname !== '/dashboard' ? (
            <Outlet />
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ backgroundColor: 'rgba(127, 43, 128, 0.05)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                <GraduationCap size={40} color="var(--color-primary)" />
              </div>
              <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>¡Bienvenido a tu Espacio de Aprendizaje!</h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto' }}>
                Aquí podrás gestionar tus cursos, certificaciones y preferencias de comunicación. Explora el menú lateral para comenzar.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
