import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import logo from '../assets/logo.jpg';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', padding: '1rem' }}>
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <h2 style={{ color: '#e74c3c' }}>Enlace Inválido</h2>
          <p>No se encontró el token de recuperación.</p>
          <button onClick={() => navigate('/login')} style={{ marginTop: '1rem', padding: '0.8rem 2rem', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer' }}>Volver al inicio</button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Las contraseñas no coinciden.');
      return;
    }
    
    // Validar Contraseña (Más flexible y explicativa)
    if (password.length < 8) {
      setStatus('error');
      setMessage('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setStatus('error');
      setMessage('La contraseña debe incluir al menos una letra mayúscula.');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setStatus('error');
      setMessage('La contraseña debe incluir al menos una letra minúscula.');
      return;
    }
    if (!/\d/.test(password)) {
      setStatus('error');
      setMessage('La contraseña debe incluir al menos un número.');
      return;
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      setStatus('error');
      setMessage('La contraseña debe incluir al menos un carácter especial (ej: !@#$...).');
      return;
    }

    setStatus('loading');

    try {
      const res = await fetchApi('/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password })
      });
      setStatus('success');
      setMessage(res.message || 'Contraseña actualizada con éxito.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'El enlace es inválido o ha expirado.');
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
    padding: '0.8rem 2.5rem 0.8rem 2.5rem',
    borderRadius: '10px',
    border: '1px solid var(--glass-border)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'inherit',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-page)',
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{
        padding: '3rem 2rem',
        width: '100%',
        maxWidth: '450px',
        textAlign: 'center'
      }}>
        <img 
          src={logo} 
          alt="Autopoiesis Logo" 
          style={{ width: '80px', height: '80px', borderRadius: '15px', marginBottom: '1.5rem' }} 
        />
        
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Restablecer Contraseña</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Ingresa tu nueva contraseña segura.</p>
        
        {status === 'error' && (
          <div style={{ backgroundColor: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid rgba(231, 76, 60, 0.2)' }}>
            {message}
          </div>
        )}
        
        {status === 'success' ? (
          <div style={{ padding: '2rem 0' }}>
            <CheckCircle size={64} color="#2ecc71" style={{ margin: '0 auto 1rem' }} />
            <p style={{ fontSize: '1.1rem', color: '#2ecc71' }}>{message}</p>
            <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Redirigiendo al inicio de sesión...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
            <div style={inputGroupStyle}>
              <Lock size={18} style={iconStyle} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Nueva Contraseña" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                autoComplete="new-password"
                style={modernInputStyle} 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            <div style={inputGroupStyle}>
              <Lock size={18} style={iconStyle} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Confirmar Contraseña" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                autoComplete="new-password"
                style={modernInputStyle} 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={status === 'loading'} 
              style={{
                width: '100%',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                padding: '1rem',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {status === 'loading' ? (
                <><Loader2 size={18} style={{ animation: 'spin 2s linear infinite' }} /> Guardando...</>
              ) : 'Guardar Contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
