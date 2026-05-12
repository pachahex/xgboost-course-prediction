import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, Brain, Mail, ShieldCheck, GraduationCap, Settings, Menu, X, LogOut, ArrowLeft, List, Users, UserCheck, UserPlus, Terminal, Activity, Eye, EyeOff } from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle';

const DashboardLayout = () => {
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isProgramasOpen, setIsProgramasOpen] = useState(true);
  const [isInscripcionesOpen, setIsInscripcionesOpen] = useState(false);
  const [isFacilitadoresOpen, setIsFacilitadoresOpen] = useState(false);
  const [devMode, setDevMode] = useState(sessionStorage.getItem('devMode') === 'true');
  const [simulatedRole, setSimulatedRole] = useState(sessionStorage.getItem('simulatedRole') || user.rol);

  const toggleDevMode = () => {
    const newVal = !devMode;
    setDevMode(newVal);
    sessionStorage.setItem('devMode', newVal);
    if (!newVal) setSimulatedRole(user.rol);
  };

  const changeSimulatedRole = (role) => {
    setSimulatedRole(role);
    sessionStorage.setItem('simulatedRole', role);
  };

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

  const isDev = user.rol === 'Desarrollador';
  const effectiveRole = (isDev && devMode) ? simulatedRole : user.rol;
  
  // Flags de vista basados estrictamente en el rol efectivo
  const isActualAdmin = effectiveRole === 'Administrador';
  const isActualStudent = effectiveRole === 'Estudiante';
  const isActualDev = effectiveRole === 'Desarrollador';
  const isActualFacilitator = effectiveRole === 'Facilitador';

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
          <span style={{ fontWeight: 'bold' }}>Panel {effectiveRole}</span>
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
            {effectiveRole} {devMode && isDev && '(Simulado)'}
          </div>
        </div>

        <nav onClick={() => setSidebarOpen(false)}>
          {/* VISTA DE ADMINISTRADOR */}
          {isActualAdmin && (
            <>
              <div style={{ marginBottom: '0.5rem' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProgramasOpen(!isProgramasOpen);
                  }}
                  style={{
                    ...getLinkStyle(location.pathname.startsWith('/dashboard') && !['/dashboard/inscripciones', '/dashboard/ia-predictiva', '/dashboard/mailing', '/dashboard/telemetria'].includes(location.pathname) ? location.pathname : '/dashboard'),
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
                    <Link 
                      to="/dashboard/facilitadores" 
                      style={{ 
                        ...getLinkStyle('/dashboard/facilitadores'), 
                        padding: '0.7rem 1rem', 
                        fontSize: '0.9rem',
                        backgroundColor: location.pathname === '/dashboard/facilitadores' ? 'var(--color-accent)' : 'transparent'
                      }}
                    >
                      <UserCheck size={16} /> Gestión Docente
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}

          {/* VISTA SOLO ADMINISTRADOR (Inscripciones, IA, Mailing) */}
          {isActualAdmin && (
            <>
              {/* Submenú Inscripciones */}
              <div style={{ marginBottom: '0.5rem' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsInscripcionesOpen(!isInscripcionesOpen);
                  }}
                  style={{
                    ...getLinkStyle(location.pathname.startsWith('/dashboard/inscripciones') ? location.pathname : ''),
                    width: '100%',
                    border: 'none',
                    cursor: 'pointer',
                    justifyContent: 'space-between',
                    backgroundColor: location.pathname.startsWith('/dashboard/inscripciones') ? 'rgba(255,255,255,0.05)' : 'transparent',
                    color: location.pathname.startsWith('/dashboard/inscripciones') ? 'white' : '#aaa'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <ClipboardList size={18} /> Inscripciones
                  </div>
                  <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>{isInscripcionesOpen ? '▲' : '▼'}</span>
                </button>
                {isInscripcionesOpen && (
                  <div style={{ paddingLeft: '1.5rem', marginTop: '0.2rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <Link to="/dashboard/inscripciones/nueva" style={{ ...getLinkStyle('/dashboard/inscripciones/nueva'), padding: '0.7rem 1rem', fontSize: '0.9rem' }}>
                      <UserPlus size={16} /> Nuevo Ingreso
                    </Link>
                    <Link to="/dashboard/inscripciones" style={{ ...getLinkStyle('/dashboard/inscripciones'), padding: '0.7rem 1rem', fontSize: '0.9rem' }}>
                      <List size={16} /> Registro Histórico
                    </Link>
                  </div>
                )}
              </div>
              <Link to="/dashboard/ia-predictiva" style={getLinkStyle('/dashboard/ia-predictiva')}>
                <Brain size={18} /> IA y Demanda
              </Link>
              <Link to="/dashboard/mailing" style={getLinkStyle('/dashboard/mailing')}>
                <Mail size={18} /> Email Marketing
              </Link>
            </>
          )}

          {/* VISTA DE ESTUDIANTE */}
          {isActualStudent && (
            <Link to="/dashboard" style={getLinkStyle('/dashboard')}>
              <GraduationCap size={18} /> Mis Cursos
            </Link>
          )}

          {/* VISTA DE DESARROLLADOR (TELEMETRÍA) */}
          {isActualDev && (
            <Link to="/dashboard/telemetria" style={getLinkStyle('/dashboard/telemetria')}>
              <Terminal size={18} /> Telemetría técnica
            </Link>
          )}

          {/* CONTROLES GLOBALES DE DESARROLLADOR */}
          {isDev && (
            <div style={{ margin: '1rem 0', padding: '0 1rem' }}>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleDevMode(); }}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  borderRadius: '4px',
                  border: '1px solid var(--color-accent)',
                  backgroundColor: devMode ? 'var(--color-accent)' : 'transparent',
                  color: devMode ? 'white' : 'var(--color-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                {devMode ? <EyeOff size={16} /> : <Eye size={16} />}
                {devMode ? 'Salir Modo Dev' : 'Modo Desarrollador'}
              </button>
            </div>
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
          {(isActualAdmin || location.pathname !== '/dashboard') ? (
            <Outlet />
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ backgroundColor: 'rgba(127, 43, 128, 0.05)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                <GraduationCap size={40} color="var(--color-primary)" />
              </div>
              <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>
                {isActualFacilitator ? '¡Bienvenido, Facilitador!' : (isActualDev ? '¡Bienvenido al Panel de Control!' : '¡Bienvenido a tu Espacio de Aprendizaje!')}
              </h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto' }}>
                {isActualFacilitator 
                  ? 'Como facilitador, pronto tendrás acceso a tus grupos asignados y herramientas pedagógicas. Por ahora, puedes gestionar tu perfil y seguridad.'
                  : isActualDev 
                    ? 'Como desarrollador, tienes acceso a la telemetría y diagnóstico del sistema. Activa el Modo Desarrollador para simular otros roles.'
                    : 'Aquí podrás gestionar tus cursos, certificaciones y preferencias de comunicación. Explora el menú lateral para comenzar.'}
              </p>
              
              {isActualDev && (
                <div style={{ marginTop: '2rem' }}>
                  <Link 
                    to="/dashboard/telemetria" 
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      backgroundColor: 'var(--color-primary)', 
                      color: 'white', 
                      padding: '0.8rem 1.5rem', 
                      borderRadius: '8px', 
                      textDecoration: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    <Terminal size={18} /> Ir a Telemetría Técnica
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Overlay de Diagnóstico (Modo Desarrollador) */}
        {devMode && isDev && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#1e272e',
            color: '#2ecc71',
            padding: '15px',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontFamily: 'monospace',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            zIndex: 9999,
            border: '1px solid rgba(46, 204, 113, 0.3)',
            minWidth: '200px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px' }}>
              <span style={{ fontWeight: 'bold' }}>🛠 DIAGNÓSTICO</span>
              <button 
                onClick={toggleDevMode}
                style={{ background: 'none', border: 'none', color: '#ff7675', cursor: 'pointer', fontSize: '0.7rem' }}
              >
                [Cerrar]
              </button>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', color: '#bdc3c7', marginBottom: '5px', fontSize: '0.7rem' }}>SIMULAR ROL:</label>
              <select 
                value={simulatedRole} 
                onChange={(e) => changeSimulatedRole(e.target.value)}
                style={{ 
                  width: '100%', 
                  backgroundColor: '#2f3640', 
                  color: 'white', 
                  border: '1px solid #7f8c8d', 
                  borderRadius: '4px',
                  padding: '2px',
                  fontSize: '0.75rem'
                }}
              >
                <option value="Desarrollador">Desarrollador</option>
                <option value="Administrador">Administrador</option>
                <option value="Estudiante">Estudiante</option>
                <option value="Facilitador">Facilitador</option>
              </select>
            </div>

            <div style={{ color: '#ecf0f1', marginBottom: '3px' }}>PATH: {location.pathname}</div>
            <div style={{ color: '#ecf0f1' }}>VIEW: {location.pathname === '/dashboard' ? 'Index (Gestor)' : location.pathname.split('/').pop()}</div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardLayout;
