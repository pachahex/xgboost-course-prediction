import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { fetchApi } from '../../api';
import { Home, ClipboardList, Brain, Mail, ShieldCheck, GraduationCap, Settings, Menu, X, LogOut, ArrowLeft, List, Users, UserCheck, UserPlus } from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle';

const DashboardLayout = () => {
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const [devMode, setDevMode] = useState(sessionStorage.getItem('devMode') === 'true');
  const [simulatedRole, setSimulatedRole] = useState(sessionStorage.getItem('simulatedRole') || user.rol);
  
  // Estados para Muro de Verificación
  const [isResending, setIsResending] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isProgramasOpen, setIsProgramasOpen] = useState(true);
  const [isInscripcionesOpen, setIsInscripcionesOpen] = useState(false);
  const [isFacilitadoresOpen, setIsFacilitadoresOpen] = useState(false);

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

  const effectiveRole = user.rol;
  
  // Flags de vista basados estrictamente en el rol efectivo
  const isActualAdmin = effectiveRole === 'Administrador';
  const isActualStudent = effectiveRole === 'Estudiante';
  const isActualFacilitator = effectiveRole === 'Facilitador';

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const res = await fetchApi('/usuario/reenviar-verificacion', { method: 'POST' });
      setVerificationStatus(res.message);
    } catch (err) {
      setVerificationStatus("Hubo un problema al enviar el correo. Por favor, intenta más tarde.");
    } finally {
      setIsResending(false);
    }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setIsResending(true);
    try {
      const res = await fetchApi('/usuario/actualizar-correo-verificacion', {
        method: 'POST',
        body: JSON.stringify({ nuevo_correo: newEmail })
      });
      // Actualizar usuario en sesión
      const updatedUser = { ...user, correo: newEmail };
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      setVerificationStatus(res.message);
      setIsChangingEmail(false);
    } catch (err) {
      setVerificationStatus("No se pudo actualizar el correo. Verifica que el formato sea correcto.");
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckStatus = async () => {
    setIsResending(true);
    setVerificationStatus("Consultando estado...");
    try {
      const res = await fetchApi('/usuario/check-verificacion');
      if (res.verificado) {
        // Actualizar sessionStorage
        const updatedUser = { ...user, email_verificado: true };
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
        setVerificationStatus("¡Perfecto! Tu cuenta ha sido verificada. El panel se habilitará ahora.");
        // Pequeña pausa para que el usuario lea el éxito
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setVerificationStatus("Aún no detectamos la verificación en la base de datos. Por favor haz clic en el enlace que enviamos a tu correo.");
      }
    } catch (err) {
      setVerificationStatus("No pudimos conectar con el servidor. Revisa tu conexión a internet.");
    } finally {
      setIsResending(false);
    }
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
            {effectiveRole}
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
                    <Link to="/dashboard/estudiantes" style={{ ...getLinkStyle('/dashboard/estudiantes'), padding: '0.7rem 1rem', fontSize: '0.9rem' }}>
                      <Users size={16} /> Base de Estudiantes
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
          {user.email_verificado === false && !isActualAdmin ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div style={{ 
                backgroundColor: 'rgba(243, 156, 18, 0.1)', 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 2rem auto',
                border: '2px solid #f39c12'
              }}>
                <Mail size={50} color="#f39c12" />
              </div>
              
              <h2 style={{ color: 'var(--text-main)', marginBottom: '1.5rem' }}>Verifica tu identidad</h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 2rem auto', fontSize: '1.1rem', lineHeight: '1.6' }}>
                Hemos enviado un enlace de confirmación a:<br />
                <strong style={{ color: 'var(--color-accent)', fontSize: '1.3rem', display: 'block', margin: '0.5rem 0' }}>{user.correo}</strong>
                Es obligatorio verificar tu cuenta para acceder a los módulos académicos y asegurar la validez de tus futuros certificados.
              </p>

              {verificationStatus && (
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: 'rgba(52, 152, 219, 0.1)', 
                  color: '#3498db', 
                  borderRadius: '8px', 
                  marginBottom: '2rem',
                  maxWidth: '500px',
                  margin: '0 auto 2rem auto',
                  border: '1px solid #3498db'
                }}>
                  {verificationStatus}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                <button 
                  onClick={handleResendVerification}
                  disabled={isResending}
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--text-main)',
                    padding: '0.8rem 2rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-primary)',
                    fontWeight: 'bold',
                    cursor: isResending ? 'not-allowed' : 'pointer',
                    opacity: isResending ? 0.7 : 1
                  }}
                >
                  {isResending ? 'Procesando...' : 'Reenviar enlace'}
                </button>

                <button 
                  onClick={handleCheckStatus}
                  disabled={isResending}
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    padding: '0.8rem 2rem',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: isResending ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 15px rgba(127, 43, 128, 0.3)'
                  }}
                >
                  {isResending ? 'Verificando...' : 'Ya verifiqué mi cuenta'}
                </button>

                {!isChangingEmail ? (
                  <button 
                    onClick={() => setIsChangingEmail(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    ¿Ingresaste un correo erróneo? Cámbialo aquí
                  </button>
                ) : (
                  <form onSubmit={handleUpdateEmail} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '400px' }}>
                    <input 
                      type="email" 
                      placeholder="Nuevo correo electrónico"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.6rem',
                        borderRadius: '6px',
                        border: '1px solid var(--glass-border)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text-main)'
                      }}
                    />
                    <button 
                      type="submit"
                      style={{ backgroundColor: 'var(--color-accent)', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Actualizar
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (isActualAdmin || isActualStudent || isActualFacilitator || location.pathname !== '/dashboard') ? (
            <Outlet />
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ backgroundColor: 'rgba(127, 43, 128, 0.05)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                <GraduationCap size={40} color="var(--color-primary)" />
              </div>
              <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>
                {isActualFacilitator ? '¡Bienvenido, Facilitador!' : '¡Bienvenido a tu Espacio de Aprendizaje!'}
              </h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto' }}>
                {isActualFacilitator 
                  ? 'Como facilitador, pronto tendrás acceso a tus grupos asignados y herramientas pedagógicas. Por ahora, puedes gestionar tu perfil y seguridad.'
                  : 'Aquí podrás gestionar tus cursos, certificaciones y preferencias de comunicación. Explora el menú lateral para comenzar.'}
              </p>
            </div>
          )}
        </div>


      </main>
    </div>
  );
};

export default DashboardLayout;
