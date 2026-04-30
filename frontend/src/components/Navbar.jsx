import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
const Navbar = () => {
  const navigate = useNavigate();
  const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

  const handleLogout = async () => {
    try {
      // In a real app we'd call /api/logout to clear the HTTP-Only cookie too
      sessionStorage.removeItem('isLoggedIn');
      sessionStorage.removeItem('user');
      navigate('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const navStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: 'var(--bg-page)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    borderBottom: '1px solid var(--glass-border)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    transition: 'background-color 0.3s, border-color 0.3s'
  };

  const logoStyle = {
    color: 'var(--color-primary)',
    fontWeight: 800,
    fontSize: '1.5rem',
    margin: 0
  };

  const linksStyle = {
    display: 'flex',
    gap: '2rem',
    alignItems: 'center'
  };

  return (
    <nav style={navStyle}>
      <Link to="/" style={{textDecoration: 'none'}}>
        <h1 style={logoStyle}>Autopoiesis</h1>
      </Link>
      
      <div style={linksStyle}>
        <Link to="/">Inicio</Link>
        <Link to="/cursos">Cursos</Link>
        <Link to="/diplomados">Diplomados</Link>
        
        {isLoggedIn ? (
          <>
            <Link to="/dashboard">Panel Admin</Link>
            <button onClick={handleLogout} style={{backgroundColor: '#e74c3c'}}>Salir</button>
          </>
        ) : (
          <>
            <Link to="/login" style={{textDecoration: 'none', color: 'var(--text-main)', fontWeight: 'bold'}}>
              Iniciar Sesión
            </Link>
            <Link to="/registro">
              <button style={{backgroundColor: 'var(--color-primary)', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '4px', color: 'white', cursor: 'pointer', fontWeight: 'bold'}}>Regístrate</button>
            </Link>
          </>
        )}
        <ThemeToggle />
      </div>
    </nav>
  );
};

export default Navbar;
