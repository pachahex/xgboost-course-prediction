import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';
import { ShieldAlert, KeyRound, Eye, EyeOff, ArrowRight } from 'lucide-react';
import logo from '../assets/logo.jpg';

const ForcePasswordChange = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await fetchApi('/login/cambiar-password-forzado', {
        method: 'POST',
        body: JSON.stringify({ new_password: newPassword })
      });
      
      // Update local storage to remove the flag
      const user = JSON.parse(localStorage.getItem('user'));
      user.requiere_cambio_password = false;
      localStorage.setItem('user', JSON.stringify(user));

      // Redirigir al dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error al actualizar contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const inputGroupStyle = {
    position: 'relative',
    marginBottom: '1.25rem',
  };

  const iconStyle = {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--color-primary)',
    opacity: 0.7,
    pointerEvents: 'none'
  };

  const modernInputStyle = {
    width: '100%',
    padding: '0.8rem 1rem 0.8rem 2.5rem',
    borderRadius: '10px',
    border: '1px solid var(--glass-border)',
    background: 'var(--bg-card)',
    color: 'inherit',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-page)',
      padding: '1.5rem',
    }}>
      <div className="glass-panel" style={{
        maxWidth: '450px',
        width: '100%',
        padding: '3rem 2rem',
        textAlign: 'center'
      }}>
        <img
          src={logo}
          alt="Logo"
          style={{ width: '80px', borderRadius: '15px', marginBottom: '1.5rem' }}
        />
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--color-accent)' }}>
          <ShieldAlert size={48} />
        </div>
        
        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.6rem' }}>Seguridad de Cuenta</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>
          Por razones de seguridad, es obligatorio que cambies tu contraseña temporal (Carnet de Identidad) antes de continuar.
        </p>

        {error && (
          <div style={{
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            color: '#e74c3c',
            padding: '0.8rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            border: '1px solid rgba(231, 76, 60, 0.2)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div style={inputGroupStyle}>
            <KeyRound size={18} style={iconStyle} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Nueva contraseña" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              required 
              style={modernInputStyle} 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div style={inputGroupStyle}>
            <KeyRound size={18} style={iconStyle} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Confirmar contraseña" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
              style={modernInputStyle} 
            />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            padding: '1rem',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.8rem',
            marginTop: '1.5rem',
            transition: 'all 0.3s ease'
          }}>
            {loading ? 'Actualizando...' : <>Actualizar Contraseña <ArrowRight size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForcePasswordChange;
