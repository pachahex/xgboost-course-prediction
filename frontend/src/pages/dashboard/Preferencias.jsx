import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../api';
import { Bell, BellOff, Loader2 } from 'lucide-react';

const Preferencias = () => {
  const [suscrito, setSuscrito] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const res = await fetchApi('/usuario/preferencias');
        setSuscrito(res.suscrito_boletin);
      } catch (err) {
        console.error("Error al cargar preferencias:", err);
      } finally {
        setLoading(false);
      }
    };
    loadPreferences();
  }, []);

  const toggleSuscripcion = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const nuevoEstado = !suscrito;
      const res = await fetchApi('/usuario/preferencias', {
        method: 'PUT',
        body: JSON.stringify({ suscrito_boletin: nuevoEstado })
      });
      setSuscrito(res.suscrito_boletin);
      setFeedback({ type: 'success', text: res.message });
      
      // Limpiar el mensaje de éxito después de 3 segundos
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Error al actualizar preferencias.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        <Loader2 size={32} style={{ animation: 'spin 2s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: '0.5rem', fontSize: '1.8rem' }}>Configuración de Perfil</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Gestiona cómo la Academia se comunica contigo.</p>
      </div>

      {feedback && (
        <div style={{ 
          padding: '1rem', 
          marginBottom: '1.5rem', 
          borderRadius: '8px', 
          backgroundColor: feedback.type === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)', 
          color: feedback.type === 'success' ? '#2e7d32' : '#d32f2f', 
          border: `1px solid ${feedback.type === 'success' ? '#4caf50' : '#f44336'}`,
          fontSize: '0.95rem'
        }}>
          {feedback.text}
        </div>
      )}

      {/* Card Principal */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Item de Suscripción con Clase Responsiva flex-stack */}
        <div className="flex-stack" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ 
                backgroundColor: suscrito ? 'rgba(3, 143, 186, 0.1)' : 'rgba(0, 0, 0, 0.05)', 
                padding: '0.5rem', 
                borderRadius: '10px',
                color: suscrito ? 'var(--color-accent)' : 'var(--text-muted)'
              }}>
                {suscrito ? <Bell size={22} /> : <BellOff size={22} />}
              </div>
              <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem' }}>Boletín Informativo</h3>
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Recibe notificaciones sobre nuevos cursos, diplomados, masterclasses gratuitas y promociones exclusivas para nuestra comunidad. 
              Mantenemos tu bandeja limpia, solo enviamos información de alto valor académico.
            </p>
          </div>

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '0.75rem',
            padding: '1rem',
            backgroundColor: 'rgba(0,0,0,0.02)',
            borderRadius: '12px',
            minWidth: '120px'
          }}>
            {/* Toggle Switch */}
            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '32px' }}>
              <input 
                type="checkbox" 
                checked={suscrito} 
                onChange={toggleSuscripcion} 
                disabled={saving}
                style={{ opacity: 0, width: 0, height: 0 }} 
              />
              <span style={{
                position: 'absolute', cursor: saving ? 'not-allowed' : 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: suscrito ? 'var(--color-accent)' : '#cbd5e0', transition: '.4s', borderRadius: '34px',
                opacity: saving ? 0.7 : 1
              }}>
                <span style={{
                  position: 'absolute', content: '""', height: '24px', width: '24px', left: '4px', bottom: '4px',
                  backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                  transform: suscrito ? 'translateX(28px)' : 'translateX(0)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </span>
            </label>
            <span style={{ 
              fontSize: '0.85rem', 
              fontWeight: '700', 
              color: suscrito ? 'var(--color-accent)' : 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {suscrito ? 'Suscrito' : 'Inactivo'}
            </span>
          </div>
        </div>
        
        {saving && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-accent)' }}>
            <Loader2 size={14} style={{ animation: 'spin 2s linear infinite' }} />
            Guardando cambios...
          </div>
        )}
      </div>

      <div style={{ marginTop: '2.5rem', padding: '1.5rem', borderLeft: '4px solid var(--color-primary)', backgroundColor: 'rgba(127, 43, 128, 0.05)', borderRadius: '0 8px 8px 0' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary-dark)' }}>¿Por qué suscribirse?</h4>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          Nuestros estudiantes suscritos reciben acceso prioritario a becas de hasta el 50% en diplomados seleccionados y son los primeros en probar nuestras nuevas herramientas de Inteligencia Artificial.
        </p>
      </div>
    </div>
  );
};

export default Preferencias;
