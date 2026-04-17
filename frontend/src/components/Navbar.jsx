import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
    backgroundColor: '#fff',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    position: 'sticky',
    top: 0,
    zIndex: 1000
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
          <Link to="/login">
            <button style={{backgroundColor: 'var(--color-primary)'}}>Acceso Sistema</button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
