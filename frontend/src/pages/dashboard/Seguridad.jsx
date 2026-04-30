import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../api';

const Seguridad = () => {
  const [setupData, setSetupData] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [alreadyConfigured, setAlreadyConfigured] = useState(false);

  useEffect(() => {
    const initSetup = async () => {
      try {
        const res = await fetchApi('/admin/seguridad/2fa/setup');
        setSetupData(res);
      } catch (err) {
        setFeedback({ type: 'error', text: 'No se pudo iniciar la configuración 2FA.' });
      } finally {
        setLoading(false);
      }
    };
    // Idealmente verificaríamos el estado real antes de llamar a setup, 
    // pero como genera uno nuevo, asumiremos que quien entra a esta vista quiere activarlo o resetearlo.
    initSetup();
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetchApi('/admin/seguridad/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ code: totpCode })
      });
      setFeedback({ type: 'success', text: res.message });
      setAlreadyConfigured(true);
      setTotpCode('');
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Código incorrecto. Intenta de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', outline: 'none' };

  return (
    <div>
      <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: '1rem' }}>Seguridad de la Cuenta</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Protege tu cuenta de administrador activando la Autenticación de Dos Factores (2FA).</p>

      {feedback && (
        <div style={{ padding: '1rem', marginBottom: '2rem', borderRadius: '8px', backgroundColor: feedback.type === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)', color: feedback.type === 'success' ? '#2e7d32' : '#d32f2f', border: `1px solid ${feedback.type === 'success' ? '#4caf50' : '#f44336'}` }}>
          {feedback.text}
        </div>
      )}

      {!alreadyConfigured ? (
        <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', backgroundColor: 'var(--bg-page)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h3 style={{ color: 'var(--color-primary)' }}>Paso 1: Escanea el Código QR</h3>
            <p style={{ color: 'var(--text-main)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Abre <strong>Google Authenticator</strong> o Authy en tu celular, presiona el botón "+" y selecciona "Escanear un código QR".
            </p>
            {setupData ? (
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'white', display: 'inline-block', borderRadius: '12px', border: '1px solid #ddd' }}>
                <img src={setupData.qr_code} alt="Código QR 2FA" style={{ width: '200px', height: '200px' }} />
              </div>
            ) : (
              <p>Generando código...</p>
            )}
          </div>

          <div style={{ flex: 1, minWidth: '300px' }}>
            <h3 style={{ color: 'var(--color-primary)' }}>Paso 2: Verifica el Código</h3>
            <p style={{ color: 'var(--text-main)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Para confirmar que la aplicación está vinculada, ingresa el código de 6 dígitos que aparece en tu pantalla.
            </p>
            <form onSubmit={handleVerify}>
              <input 
                type="text" 
                value={totpCode} 
                onChange={(e) => setTotpCode(e.target.value)} 
                required 
                style={inputStyle} 
                placeholder="123456" 
                maxLength="6" 
              />
              <button 
                type="submit" 
                disabled={loading || !setupData} 
                style={{ width: '100%', backgroundColor: 'var(--color-accent)', color: 'white', fontWeight: 'bold', padding: '1rem', borderRadius: '8px', border: 'none', cursor: (loading || !setupData) ? 'not-allowed' : 'pointer', marginTop: '1rem', opacity: (loading || !setupData) ? 0.7 : 1 }}
              >
                {loading ? 'Verificando...' : 'Activar 2FA'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', backgroundColor: 'var(--bg-page)', padding: '3rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛡️</div>
          <h3 style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>2FA está Activo</h3>
          <p style={{ color: 'var(--text-main)' }}>Tu cuenta está protegida con seguridad de grado bancario.</p>
        </div>
      )}
    </div>
  );
};

export default Seguridad;
