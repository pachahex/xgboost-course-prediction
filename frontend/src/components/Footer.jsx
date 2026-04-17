import React, { useState } from 'react';
import { fetchApi } from '../api';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus('Subscribiendo...');
    try {
      const res = await fetchApi('/suscribir', {
        method: 'POST',
        body: JSON.stringify({ correo: email })
      });
      setStatus('¡Suscrito existosamente!');
      setEmail('');
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <footer style={{ backgroundColor: 'var(--color-primary-dark)', color: 'white', padding: '3rem 2rem', marginTop: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <h2>Academia Autopoiesis</h2>
          <p style={{ maxWidth: '300px', color: '#ccc' }}>Educación de excelencia para el desarrollo integral en innovación e investigación.</p>
        </div>
        
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h3 style={{ color: 'var(--color-accent)' }}>Boletín Informativo</h3>
          <p style={{ color: '#ccc' }}>Suscríbete para recibir noticias, cursos y diplomados de primera mano.</p>
          <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="email" 
              placeholder="tu@correo.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: '0.8rem', borderRadius: '4px', border: 'none', flex: 1, maxWidth: '250px' }}
            />
            <button type="submit" style={{ backgroundColor: 'var(--color-accent)' }}>Suscribir</button>
          </form>
          {status && <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: status.includes('Error') ? '#ff6b6b' : '#51cf66' }}>{status}</p>}
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', color: '#999' }}>
        &copy; {new Date().getFullYear()} Academia Autopoiesis. Todos los derechos reservados.
      </div>
    </footer>
  );
};

export default Footer;
