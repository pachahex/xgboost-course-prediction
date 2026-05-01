import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { Home, BookOpen, GraduationCap, LayoutDashboard, LogOut, LogIn, UserPlus } from 'lucide-react';
import logo from '../assets/logo.svg';

const Navbar = () => {
  const navigate = useNavigate();
  const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

  const handleLogout = async () => {
    try {
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
    padding: '0.8rem 2rem',
    backgroundColor: 'var(--bg-page)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    borderBottom: '1px solid var(--glass-border)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    transition: 'background-color 0.3s, border-color 0.3s'
  };

  const logoContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
    textDecoration: 'none'
  };

  const logoImgStyle = {
    height: '35px',
    width: 'auto'
  };

  const logoTextStyle = {
    color: 'var(--color-primary)',
    fontWeight: 800,
    fontSize: '1.4rem',
    margin: 0
  };

  const linksStyle = {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center'
  };

  const linkItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    textDecoration: 'none',
    color: 'var(--text-main)',
    fontSize: '0.95rem',
    fontWeight: '500',
    transition: 'color 0.2s'
  };

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    border: 'none',
    transition: 'transform 0.2s, opacity 0.2s'
  };

  return (
    <nav style={navStyle}>
      <Link to="/" style={logoContainerStyle}>
        <img src={logo} alt="Autopoiesis Logo" style={logoImgStyle} />
        <h1 style={logoTextStyle}>Autopoiesis</h1>
      </Link>
      
      <div style={linksStyle}>
        <Link to="/" style={linkItemStyle}><Home size={18} /> Inicio</Link>
        <Link to="/cursos" style={linkItemStyle}><BookOpen size={18} /> Cursos</Link>
        <Link to="/diplomados" style={linkItemStyle}><GraduationCap size={18} /> Diplomados</Link>
        
        {isLoggedIn ? (
          <>
            <Link to="/dashboard" style={linkItemStyle}><LayoutDashboard size={18} /> Panel</Link>
            <button 
              onClick={handleLogout} 
              style={{...buttonStyle, backgroundColor: '#e74c3c', color: 'white'}}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <LogOut size={18} /> Salir
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={linkItemStyle}>
              <LogIn size={18} /> Ingresar
            </Link>
            <Link to="/registro" style={{textDecoration: 'none'}}>
              <button 
                style={{...buttonStyle, backgroundColor: 'var(--color-primary)', color: 'white'}}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <UserPlus size={18} /> Regístrate
              </button>
            </Link>
          </>
        )}
        <div style={{ marginLeft: '0.5rem', borderLeft: '1px solid var(--glass-border)', paddingLeft: '1rem' }}>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
