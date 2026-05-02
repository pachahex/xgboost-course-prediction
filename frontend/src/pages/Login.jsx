import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';

const Login = () => {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [step, setStep] = useState(1);
  const [tempToken, setTempToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetchApi('/login', {
        method: 'POST',
        body: JSON.stringify({ correo, password })
      });

      if (res.requires_2fa) {
        setTempToken(res.temp_token);
        setStep(2);
      } else {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('user', JSON.stringify(res.user));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handle2FA = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetchApi('/login/verify-2fa', {
        method: 'POST',
        body: JSON.stringify({ temp_token: tempToken, totp_code: totpCode })
      });

      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('user', JSON.stringify(res.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Código incorrecto');
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: '80vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
    position: 'relative',
    overflow: 'hidden',
    padding: '2rem'
  };

  // Círculos abstractos de fondo para darle el toque Figma
  const circle1 = {
    position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'var(--color-accent)', opacity: 0.6, top: '-50px', left: '-50px', filter: 'blur(60px)'
  };
  const circle2 = {
    position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: '#ff00ff', opacity: 0.3, bottom: '-100px', right: '-100px', filter: 'blur(80px)'
  };

  const formStyle = { display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' };
  const inputStyle = { padding: '1rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.9)', fontSize: '1rem', outline: 'none', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={containerStyle}>
      <div style={circle1}></div>
      <div style={circle2}></div>

      <div className="glass-panel-dark" style={{ padding: '3rem', width: '100%', maxWidth: '400px', zIndex: 10 }}>
        <h2 style={{ textAlign: 'center', color: 'white', marginBottom: '2rem', fontSize: '2rem' }}>Centro de Acceso</h2>

        {error && <div style={{ backgroundColor: 'rgba(231, 76, 60, 0.2)', color: '#ffb8b8', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleLogin} style={formStyle}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd' }}>Correo Electrónico</label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                style={inputStyle}
                placeholder="user@example.com"
                autoComplete="username"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd' }}>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
                placeholder="••••••••••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: 'var(--color-accent)',
                padding: '1rem',
                fontSize: '1.1rem',
                marginTop: '1rem',
                opacity: loading ? 0.7 : 1,
                border: 'none',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: '8px'
              }}
            >
              {loading ? 'Autenticando...' : 'Iniciar Sesión'}
            </button>
          </form>
        ) : (
          <form onSubmit={handle2FA} style={formStyle}>
            <p style={{ color: '#ccc', textAlign: 'center' }}>Ingresa el código de 6 dígitos de tu aplicación Google Authenticator.</p>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd' }}>Código 2FA</label>
              <input
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                required
                style={{ ...inputStyle, textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.5rem' }}
                placeholder="123456"
                maxLength="6"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: 'var(--color-primary)',
                padding: '1rem',
                fontSize: '1.1rem',
                marginTop: '1rem',
                opacity: loading ? 0.7 : 1,
                border: 'none',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: '8px'
              }}
            >
              {loading ? 'Verificando...' : 'Verificar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
