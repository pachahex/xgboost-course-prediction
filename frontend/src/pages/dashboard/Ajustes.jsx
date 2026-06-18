import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../api';
import { Bell, BellOff, Loader2, Brain, CheckCircle, Database, Calendar } from 'lucide-react';

const Ajustes = () => {
  // Estado Boletín
  const [suscrito, setSuscrito] = useState(false);
  const [savingBoletin, setSavingBoletin] = useState(false);
  const [feedbackBoletin, setFeedbackBoletin] = useState(null);

  // Estado Modelo
  const [statusModelo, setStatusModelo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [feedbackModelo, setFeedbackModelo] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resPref, resStatus] = await Promise.all([
          fetchApi('/usuario/preferencias'),
          fetchApi('/admin/modelo/status')
        ]);
        setSuscrito(resPref.suscrito_boletin);
        setStatusModelo(resStatus);
      } catch (err) {
        console.error("Error al cargar datos:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const toggleSuscripcion = async () => {
    setSavingBoletin(true);
    setFeedbackBoletin(null);
    try {
      const nuevoEstado = !suscrito;
      const res = await fetchApi('/usuario/preferencias', {
        method: 'PUT',
        body: JSON.stringify({ suscrito_boletin: nuevoEstado })
      });
      setSuscrito(res.suscrito_boletin);
      setFeedbackBoletin({ type: 'success', text: res.message });
      setTimeout(() => setFeedbackBoletin(null), 3000);
    } catch (err) {
      setFeedbackBoletin({ type: 'error', text: err.message || 'Error al actualizar preferencias.' });
    } finally {
      setSavingBoletin(false);
    }
  };

  const handleRetrain = async () => {
    if (!statusModelo?.can_retrain) return;
    
    setRetraining(true);
    setFeedbackModelo(null);
    try {
      const res = await fetchApi('/admin/modelo/retrain', { method: 'POST' });
      setFeedbackModelo({ type: 'success', text: res.message });
      
      // Recargar status
      const resStatus = await fetchApi('/admin/modelo/status');
      setStatusModelo(resStatus);
    } catch (err) {
      setFeedbackModelo({ type: 'error', text: err.message || 'Error al reentrenar.' });
    } finally {
      setRetraining(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        <Loader2 size={32} style={{ animation: 'spin 2s linear infinite' }} />
      </div>
    );
  }

  // Cálculos para las barras de progreso
  const daysProgress = Math.min((statusModelo?.days_passed / statusModelo?.days_required) * 100, 100) || 0;
  const recordsProgress = Math.min((statusModelo?.increase_pct / statusModelo?.increase_required) * 100, 100) || 0;

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: '0.5rem', fontSize: '1.8rem' }}>Ajustes del Sistema</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Gestión de preferencias y configuraciones avanzadas.</p>
      </div>

      {/* SECCIÓN 1: REENTRENAMIENTO DEL MODELO */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ backgroundColor: 'rgba(127, 43, 128, 0.1)', padding: '0.5rem', borderRadius: '10px', color: 'var(--color-primary)' }}>
            <Brain size={24} />
          </div>
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.3rem' }}>Reentrenamiento del Modelo</h3>
        </div>
        
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
          Para evitar el sobreajuste y mantener la precisión de las proyecciones, el modelo predictivo (XGBoost) se reentrena cuando se cumplen ciertas reglas de evolución temporal y de crecimiento de la base de datos.
        </p>

        {feedbackModelo && (
          <div style={{ 
            padding: '1rem', 
            borderRadius: '8px', 
            backgroundColor: feedbackModelo.type === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)', 
            color: feedbackModelo.type === 'success' ? '#2e7d32' : '#d32f2f', 
            border: `1px solid ${feedbackModelo.type === 'success' ? '#4caf50' : '#f44336'}`,
            fontSize: '0.95rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <CheckCircle size={18} />
            {feedbackModelo.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Regla 1: Tiempo */}
          <div style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
                <Calendar size={16} color="var(--color-accent)" /> Semestral (180 Días)
              </div>
              <span style={{ fontSize: '0.9rem' }}>{statusModelo?.days_passed} / 180</span>
            </div>
            <div style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${daysProgress}%`, height: '100%', backgroundColor: daysProgress >= 100 ? '#4caf50' : 'var(--color-accent)', transition: 'width 0.5s ease' }}></div>
            </div>
          </div>

          {/* Regla 2: Registros */}
          <div style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
                <Database size={16} color="var(--color-accent)" /> Nuevos Registros
              </div>
              <span style={{ fontSize: '0.9rem' }}>{statusModelo?.increase_pct?.toFixed(1)}% / 10%</span>
            </div>
            <div style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${recordsProgress}%`, height: '100%', backgroundColor: recordsProgress >= 100 ? '#4caf50' : 'var(--color-accent)', transition: 'width 0.5s ease' }}></div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
          {statusModelo?.can_retrain ? (
            <span style={{ color: '#4caf50', fontSize: '0.9rem', fontWeight: '500' }}>¡Condiciones cumplidas!</span>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Requiere cumplir ambas condiciones</span>
          )}
          
          <button 
            onClick={handleRetrain}
            disabled={!statusModelo?.can_retrain || retraining}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: statusModelo?.can_retrain ? 'var(--color-primary)' : 'rgba(0,0,0,0.1)',
              color: statusModelo?.can_retrain ? 'white' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: (!statusModelo?.can_retrain || retraining) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              transition: 'all 0.3s'
            }}
          >
            {retraining ? (
              <><Loader2 size={18} style={{ animation: 'spin 2s linear infinite' }} /> Entrenando...</>
            ) : (
              <><Brain size={18} /> Reentrenar Modelo</>
            )}
          </button>
        </div>
      </div>

      {/* SECCIÓN 2: BOLETÍN INFORMATIVO */}
      {feedbackBoletin && (
        <div style={{ 
          padding: '1rem', 
          marginBottom: '1rem', 
          borderRadius: '8px', 
          backgroundColor: feedbackBoletin.type === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)', 
          color: feedbackBoletin.type === 'success' ? '#2e7d32' : '#d32f2f', 
          border: `1px solid ${feedbackBoletin.type === 'success' ? '#4caf50' : '#f44336'}`,
          fontSize: '0.95rem'
        }}>
          {feedbackBoletin.text}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '32px' }}>
              <input 
                type="checkbox" 
                checked={suscrito} 
                onChange={toggleSuscripcion} 
                disabled={savingBoletin}
                style={{ opacity: 0, width: 0, height: 0 }} 
              />
              <span style={{
                position: 'absolute', cursor: savingBoletin ? 'not-allowed' : 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: suscrito ? 'var(--color-accent)' : '#cbd5e0', transition: '.4s', borderRadius: '34px',
                opacity: savingBoletin ? 0.7 : 1
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
      </div>
    </div>
  );
};

export default Ajustes;
