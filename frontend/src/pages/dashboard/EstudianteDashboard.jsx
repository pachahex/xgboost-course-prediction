import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../api';
import { GraduationCap, Calendar, Clock, Award, AlertTriangle, BookOpen, CheckCircle, HelpCircle } from 'lucide-react';

const EstudianteDashboard = () => {
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchApi('/usuario/inscripciones');
        setInscripciones(res);
      } catch (err) {
        setError(err.message || 'Error al cargar tus cursos.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Calcular métricas
  const activasCount = inscripciones.filter(i => i.estado === 'Activo').length;
  const finalizadasCount = inscripciones.filter(i => i.estado === 'Finalizado').length;
  const pendientesCount = inscripciones.filter(i => i.estado === 'Pendiente de Pago').length;

  // Función para formatear fechas
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'None') return 'Por definir';
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateStr).toLocaleDateString('es-ES', options);
    } catch {
      return dateStr;
    }
  };

  // Función para calcular progreso temporal de la cohorte
  const getCohortProgress = (startStr, endStr) => {
    if (!startStr || !endStr || startStr === 'None' || endStr === 'None') return 0;
    try {
      const start = new Date(startStr).getTime();
      const end = new Date(endStr).getTime();
      const now = new Date().getTime();
      if (now < start) return 0;
      if (now > end) return 100;
      const total = end - start;
      const elapsed = now - start;
      return Math.round((elapsed / total) * 100);
    } catch {
      return 0;
    }
  };

  const getStatusBadgeStyle = (estado) => {
    const base = {
      padding: '0.4rem 0.8rem',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: 'bold',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px'
    };
    if (estado === 'Activo') {
      return { ...base, backgroundColor: 'rgba(46, 204, 113, 0.15)', color: '#2ecc71', border: '1px solid rgba(46, 204, 113, 0.3)' };
    }
    if (estado === 'Finalizado') {
      return { ...base, backgroundColor: 'rgba(52, 152, 219, 0.15)', color: '#3498db', border: '1px solid rgba(52, 152, 219, 0.3)' };
    }
    if (estado === 'Pendiente de Pago') {
      return { ...base, backgroundColor: 'rgba(241, 196, 15, 0.15)', color: '#f1c40f', border: '1px solid rgba(241, 196, 15, 0.3)' };
    }
    return { ...base, backgroundColor: 'rgba(149, 165, 166, 0.15)', color: '#95a5a6', border: '1px solid rgba(149, 165, 166, 0.3)' };
  };

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
            ¡Hola, {user.nombre || 'Estudiante'}!
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1rem' }}>
            {inscripciones.length > 0 
              ? `¡Estás inscrito en ${inscripciones.length} programa(s) académico(s)! Continúa con tu aprendizaje.`
              : `Te damos la bienvenida a tu centro de control académico. Aquí puedes gestionar tu aprendizaje y certificados.`}
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
          <GraduationCap size={200} />
        </div>
      </div>

      {/* Grid de Estadísticas / Resumen */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '3rem' 
      }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '5px solid #2ecc71', backgroundColor: 'var(--panel-bg)' }}>
          <div style={{ backgroundColor: 'rgba(46, 204, 113, 0.1)', padding: '0.8rem', borderRadius: '12px', color: '#2ecc71' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{activasCount}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Cursos Activos</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '5px solid #3498db', backgroundColor: 'var(--panel-bg)' }}>
          <div style={{ backgroundColor: 'rgba(52, 152, 219, 0.1)', padding: '0.8rem', borderRadius: '12px', color: '#3498db' }}>
            <Award size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{finalizadasCount}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Certificaciones</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '5px solid #f1c40f', backgroundColor: 'var(--panel-bg)' }}>
          <div style={{ backgroundColor: 'rgba(241, 196, 15, 0.1)', padding: '0.8rem', borderRadius: '12px', color: '#f1c40f' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{pendientesCount}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Pendientes de Pago</div>
          </div>
        </div>
      </div>

      <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: '1.5rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <BookOpen size={24} /> Mis Inscripciones Académicas
      </h2>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(231,76,60,0.1)', color: '#e74c3c', borderRadius: '8px', marginBottom: '2rem', border: '1px solid rgba(231,76,60,0.3)' }}>
          {error}
        </div>
      )}

      {inscripciones.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--panel-bg)', border: '1px solid var(--glass-border)' }}>
          <GraduationCap size={64} style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }} />
          <h3 style={{ color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>No estás inscrito en ningún programa aún</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
            Explora nuestro catálogo de cursos y diplomados de Inteligencia Artificial para comenzar tu carrera profesional con inferencias avanzadas de Machine Learning.
          </p>
          <a href="/cursos" style={{ 
            display: 'inline-block',
            backgroundColor: 'var(--color-primary)', 
            color: 'white', 
            padding: '0.8rem 2rem', 
            borderRadius: '6px', 
            textDecoration: 'none',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(127, 43, 128, 0.3)'
          }}>
            Ver Oferta Académica
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {inscripciones.map((insc) => {
            const progress = getCohortProgress(insc.fecha_inicio, insc.fecha_fin);
            return (
              <div 
                key={insc.id} 
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
                  backgroundImage: insc.imagen_url ? `url(http://localhost:5000${insc.imagen_url})` : 'linear-gradient(45deg, var(--color-primary-dark), var(--color-primary))',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }} />

                {/* Detalle y Métricas */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--text-main)' }}>{insc.programa}</h3>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {insc.tipo_servicio && (
                          <span style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            backgroundColor: 'rgba(127, 43, 128, 0.15)',
                            color: 'var(--color-primary-dark)',
                            border: '1px solid rgba(127, 43, 128, 0.3)'
                          }}>{insc.tipo_servicio}</span>
                        )}
                        <span style={getStatusBadgeStyle(insc.estado)}>{insc.estado}</span>
                      </div>
                    </div>
                    
                    <p style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      Edición/Cohorte: <span style={{ color: 'var(--color-primary)' }}>{insc.cohorte}</span>
                    </p>

                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <Calendar size={16} />
                        <span><strong>Duración:</strong> {formatDate(insc.fecha_inicio)} al {formatDate(insc.fecha_fin)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <Clock size={16} />
                        <span><strong>Carga Horaria:</strong> {insc.duracion_horas || 40} Horas</span>
                      </div>
                      {insc.costo_pagado !== undefined && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          <Award size={16} />
                          <span><strong>Monto Invertido:</strong> Bs. {insc.costo_pagado}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Barra de Progreso Temporal de la Cohorte */}
                  <div style={{ marginTop: 'auto', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: '600' }}>
                      <span>Progreso de la Cohorte</span>
                      <span>{progress}% Transcurrido</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--color-accent)', borderRadius: '4px', transition: 'width 0.5s ease-out' }} />
                    </div>
                  </div>

                  {/* Acciones */}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                    {insc.estado === 'Activo' && (
                      <button 
                        onClick={() => alert("¡Bienvenido al Aula Virtual! Esta sección del simulador académico está funcionando. En un entorno de producción, aquí se cargaría el contenido multimedia Moodle/LMS.")}
                        style={{
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          border: 'none',
                          padding: '0.6rem 1.2rem',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <BookOpen size={16} /> Ingresar al Aula
                      </button>
                    )}
                    {insc.estado === 'Finalizado' && (
                      <button 
                        onClick={() => alert("¡Descargando Certificado Digital! Código de verificación único encriptado con SHA-256 en la base de datos.")}
                        style={{
                          backgroundColor: 'var(--color-accent)',
                          color: 'white',
                          border: 'none',
                          padding: '0.6rem 1.2rem',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Award size={16} /> Descargar Certificado
                      </button>
                    )}
                    {insc.estado === 'Pendiente de Pago' && (
                      <button 
                        onClick={() => alert("Dirígete a caja o realiza una transferencia QR para activar tu inscripción.")}
                        style={{
                          backgroundColor: 'transparent',
                          color: 'var(--text-main)',
                          border: '1px solid var(--glass-border)',
                          padding: '0.6rem 1.2rem',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <AlertTriangle size={16} color="#f1c40f" /> Pagar Inscripción (Bs. {insc.costo})
                      </button>
                    )}
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

export default EstudianteDashboard;
