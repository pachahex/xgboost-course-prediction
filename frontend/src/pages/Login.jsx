import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';
import { ShieldCheck, Mail, Lock, KeyRound, ArrowRight, Quote, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/logo.jpg';

const quotes = [
  "La investigación es la llave del futuro.",
  "El conocimiento es poder, pero la acción es progreso.",
  "Potencia tu mente, transforma tu entorno.",
  "Cada dato es una oportunidad de aprendizaje.",
  "La excelencia académica es el camino a la innovación."
];

const Login = () => {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [step, setStep] = useState(1);
  const [tempToken, setTempToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Ciclo de frases motivadoras
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % quotes.length);
        setFade(true);
      }, 500);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
        setStep(3);
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetchApi('/olvide-password', {
        method: 'POST',
        body: JSON.stringify({ correo })
      });
      // Mostramos el éxito temporalmente y volvemos al step 1
      setError('');
      alert(res.message);
      setStep(1);
    } catch (err) {
      setError(err.message || 'Error al procesar la solicitud');
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
    background: 'rgba(255, 255, 255, 0.05)',
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
      position: 'relative'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '1000px',
        display: 'flex',
        flexDirection: window.innerWidth < 850 ? 'column' : 'row',
        overflow: 'hidden',
        minHeight: '600px',
        zIndex: 10
      }}>

        {/* Lado Izquierdo: Visual & Frases */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(225deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
          padding: '4rem 2rem',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative'
        }}>
          <img
            src={logo}
            alt="Autopoiesis Logo"
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '20px',
              marginBottom: '2.5rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              objectFit: 'cover'
            }}
          />

          <div style={{ minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              transition: 'opacity 0.5s ease, transform 0.5s ease',
              opacity: fade ? 1 : 0,
              transform: fade ? 'translateY(0)' : 'translateY(10px)',
              maxWidth: '350px'
            }}>
              <Quote size={24} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1.4rem', fontWeight: '500', fontStyle: 'italic', lineHeight: '1.4' }}>
                "{quotes[quoteIndex]}"
              </p>
            </div>
          </div>

          <div style={{ marginTop: 'auto', opacity: 0.7, fontSize: '0.9rem' }}>
            © 2026 Academia Autopoiesis
          </div>
        </div>

        {/* Lado Derecho: Formulario */}
        <div style={{
          flex: 1.2,
          padding: window.innerWidth < 480 ? '2.5rem 1.5rem' : '4rem',
          backgroundColor: 'var(--panel-bg)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Iniciar Sesión</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Bienvenido de nuevo a tu panel académico.</p>

          {error && <div style={{ backgroundColor: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(231, 76, 60, 0.2)', textAlign: 'center' }}>{error}</div>}

          {step === 1 ? (
            <form onSubmit={handleLogin}>
              <div style={inputGroupStyle}>
                <Mail size={18} style={iconStyle} />
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                  style={modernInputStyle}
                />
              </div>
              <div style={inputGroupStyle}>
                <Lock size={18} style={iconStyle} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={modernInputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    zIndex: 5
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div style={{ textAlign: 'right', marginTop: '-0.5rem', marginBottom: '1.5rem' }}>
                <button type="button" onClick={() => setStep(4)} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.9rem', padding: 0 }}>
                  ¿Olvidaste tu contraseña?
                </button>
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
                {loading ? 'Verificando...' : (
                  <>
                    Ingresar <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          ) : step === 2 ? (
            <form onSubmit={handle2FA}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <KeyRound size={48} color="var(--color-accent)" style={{ marginBottom: '1rem' }} />
                <p style={{ color: 'var(--text-muted)' }}>Ingresa el código de 6 dígitos de tu aplicación de autenticación.</p>
              </div>

              <input
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)',
                  textAlign: 'center',
                  letterSpacing: '0.8rem',
                  fontSize: '1.8rem',
                  fontWeight: 'bold',
                  background: 'rgba(255, 255, 255, 0.05)',
                  outline: 'none'
                }}
                placeholder="000000"
                maxLength="6"
              />

              <button type="submit" disabled={loading} style={{
                width: '100%',
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                padding: '1rem',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                marginTop: '2rem'
              }}>
                {loading ? 'Verificando...' : 'Confirmar Código'}
              </button>
            </form>
          ) : step === 3 ? (
            <div style={{ textAlign: 'center' }}>
              <ShieldCheck size={64} color="var(--color-accent)" style={{ marginBottom: '1.5rem' }} />
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Seguridad Adicional</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
                ¿Deseas activar la Autenticación de Dos Factores (2FA) para proteger mejor tu cuenta?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                  onClick={() => navigate('/dashboard/seguridad')}
                  style={{ backgroundColor: 'var(--color-accent)', color: 'white', padding: '1rem', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Configurar 2FA ahora
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  style={{ backgroundColor: 'transparent', color: 'var(--text-muted)', padding: '0.8rem', borderRadius: '10px', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
                >
                  Omitir por ahora
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>Recuperar Contraseña</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', textAlign: 'center' }}>Ingresa tu correo para recibir un enlace de recuperación.</p>
              
              <div style={inputGroupStyle}>
                <Mail size={18} style={iconStyle} />
                <input 
                  type="email" 
                  placeholder="Correo electrónico" 
                  value={correo} 
                  onChange={(e) => setCorreo(e.target.value)} 
                  required 
                  style={modernInputStyle} 
                />
              </div>

              <button type="submit" disabled={loading} style={{ 
                width: '100%', 
                backgroundColor: 'var(--color-accent)', 
                color: 'white', 
                padding: '1rem', 
                borderRadius: '10px', 
                border: 'none', 
                fontWeight: 'bold', 
                fontSize: '1rem', 
                cursor: 'pointer',
                marginTop: '1rem'
              }}>
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
              <button type="button" onClick={() => setStep(1)} style={{ 
                width: '100%', 
                backgroundColor: 'transparent', 
                color: 'var(--text-muted)', 
                padding: '1rem', 
                border: 'none', 
                cursor: 'pointer',
                marginTop: '0.5rem'
              }}>
                Volver al inicio de sesión
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            ¿No tienes cuenta? <a href="/registro" style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>Regístrate aquí</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
