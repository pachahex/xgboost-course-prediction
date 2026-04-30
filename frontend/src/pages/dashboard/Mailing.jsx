import React, { useState } from 'react';
import { fetchApi } from '../../api';

const Mailing = () => {
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetchApi('/admin/mailing/send', {
        method: 'POST',
        body: JSON.stringify({ asunto, mensaje })
      });
      setFeedback({ type: 'success', text: `${res.message} Se ha enviado a ${res.destinatarios} suscriptor(es).` });
      setAsunto('');
      setMensaje('');
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Error al enviar.' });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', marginBottom: '1.5rem', outline: 'none' };

  return (
    <div>
      <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: '1rem' }}>Módulo de Email Marketing</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Envía boletines y actualizaciones a tu lista de suscriptores.</p>

      {feedback && (
        <div style={{ padding: '1rem', marginBottom: '2rem', borderRadius: '8px', backgroundColor: feedback.type === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)', color: feedback.type === 'success' ? '#2e7d32' : '#d32f2f', border: `1px solid ${feedback.type === 'success' ? '#4caf50' : '#f44336'}` }}>
          {feedback.text}
        </div>
      )}

      <form onSubmit={handleSend} style={{ backgroundColor: 'var(--bg-page)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Asunto del correo</label>
        <input type="text" value={asunto} onChange={(e) => setAsunto(e.target.value)} required style={inputStyle} placeholder="Ej. ¡Lanzamos un nuevo Diplomado!" />

        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Mensaje</label>
        <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} required style={{ ...inputStyle, minHeight: '200px', resize: 'vertical' }} placeholder="Escribe el contenido de tu boletín aquí..."></textarea>

        <button type="submit" disabled={loading} style={{ backgroundColor: 'var(--color-accent)', color: 'white', fontWeight: 'bold', padding: '1rem 2rem', borderRadius: '30px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Enviando Campaña...' : '🚀 Enviar a todos los suscriptores'}
        </button>
      </form>
    </div>
  );
};

export default Mailing;
