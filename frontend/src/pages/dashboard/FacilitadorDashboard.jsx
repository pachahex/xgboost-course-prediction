import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../api';
import { BookOpen, Users, Clock, HelpCircle, Layers } from 'lucide-react';

const FacilitadorDashboard = () => {
  const [programas, setProgramas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchApi('/usuario/facilitador/programas');
        setProgramas(res);
      } catch (err) {
        setError(err.message || 'Error al cargar tus programas asignados.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando tus programas académicos...</div>;
  }

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Cabecera / Saludo */}
      <div style={{ 
        padding: '2.5rem', 
        borderRadius: '16px', 
        background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
        color: 'white',
        marginBottom: '2.5rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2.2rem', fontWeight: '800' }}>
            ¡Hola, {user.nombre || 'Facilitador'}!
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1rem' }}>
            {programas.length > 0 
              ? `Estás asignado para impartir ${programas.length} programa(s) académico(s).`
              : `Aún no tienes programas asignados. Pronto los coordinadores te agregarán a los cursos.`}
          </p>
        </div>
        <div style={{ 
          position: 'absolute', 
          right: '-20px', 
          bottom: '-30px', 
          opacity: 0.1, 
          color: 'white',
          transform: 'rotate(-15deg)'
        }}>
          <Users size={200} />
        </div>
      </div>

      <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: '1.5rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <BookOpen size={24} /> Mis Cursos y Diplomados Asignados
      </h2>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(231,76,60,0.1)', color: '#e74c3c', borderRadius: '8px', marginBottom: '2rem', border: '1px solid rgba(231,76,60,0.3)' }}>
          {error}
        </div>
      )}

      {programas.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--panel-bg)', border: '1px solid var(--glass-border)' }}>
          <Users size={64} style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }} />
          <h3 style={{ color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>Aún no tienes grupos asignados</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
            El administrador del sistema debe agregarte como facilitador en alguno de los programas de la academia.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {programas.map((prog) => {
            return (
              <div 
                key={prog.id} 
                className="glass-panel" 
                style={{ 
                  display: 'flex', 
                  flexDirection: window.innerWidth < 800 ? 'column' : 'row',
                  gap: '2rem',
                  padding: '2rem',
                  backgroundColor: 'var(--panel-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s',
                  position: 'relative'
                }}
              >
                {/* Miniatura / Thumbnail del Programa */}
                <div style={{ 
                  flex: '0 0 220px', 
                  height: '140px', 
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-page)',
                  backgroundImage: prog.imagen_url ? `url(http://localhost:5000${prog.imagen_url})` : 'linear-gradient(45deg, var(--color-primary-dark), var(--color-primary))',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }} />

                {/* Detalle y Métricas */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--text-main)' }}>{prog.nombre}</h3>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {prog.tipo_servicio && (
                          <span style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            backgroundColor: 'rgba(127, 43, 128, 0.15)',
                            color: 'var(--color-primary-dark)',
                            border: '1px solid rgba(127, 43, 128, 0.3)'
                          }}>{prog.tipo_servicio}</span>
                        )}
                        <span style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            backgroundColor: 'rgba(52, 152, 219, 0.15)',
                            color: '#3498db',
                            border: '1px solid rgba(52, 152, 219, 0.3)'
                        }}>{prog.categoria}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', marginTop: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <Clock size={16} />
                        <span><strong>Carga Horaria del Programa:</strong> {prog.duracion_horas || 40} Horas</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <Layers size={16} />
                        <span><strong>Módulos:</strong> Asignados por Coordinación</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FacilitadorDashboard;
