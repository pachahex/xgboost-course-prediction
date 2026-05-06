import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import logo from '../assets/logo.jpg';

const VerificarEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Verificando tu correo electrónico...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Enlace de verificación inválido o ausente.');
      return;
    }

    const verificar = async () => {
      try {
        const res = await fetchApi('/verificar-email', {
          method: 'POST',
          body: JSON.stringify({ token })
        });
        setStatus('success');
        setMessage(res.message || 'Tu correo ha sido verificado correctamente.');
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'El enlace de verificación es inválido o ha expirado.');
      }
    };

    verificar();
  }, [token]);

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
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <img 
          src={logo} 
          alt="Autopoiesis Logo" 
          style={{ width: '80px', height: '80px', borderRadius: '15px', marginBottom: '2rem' }} 
        />
        
        {status === 'loading' && (
          <>
            <Loader2 size={48} color="var(--color-primary)" style={{ animation: 'spin 2s linear infinite', marginBottom: '1rem' }} />
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            <h2 style={{ marginBottom: '1rem' }}>Verificando...</h2>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle size={64} color="#2ecc71" style={{ marginBottom: '1rem' }} />
            <h2 style={{ marginBottom: '1rem' }}>¡Verificado!</h2>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle size={64} color="#e74c3c" style={{ marginBottom: '1rem' }} />
            <h2 style={{ marginBottom: '1rem' }}>Error</h2>
          </>
        )}
        
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.5' }}>
          {message}
        </p>

        {(status === 'success' || status === 'error') && (
          <button 
            onClick={() => navigate('/login')}
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              padding: '0.8rem 2rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Ir al Inicio de Sesión
          </button>
        )}
      </div>
    </div>
  );
};

export default VerificarEmail;
