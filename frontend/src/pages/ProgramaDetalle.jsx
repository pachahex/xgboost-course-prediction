import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';
import { Calendar, Clock, CheckCircle, CreditCard, AlertCircle, ArrowLeft } from 'lucide-react';

const ProgramaDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [programa, setPrograma] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [simulatingPayment, setSimulatingPayment] = useState(false);

  useEffect(() => {
    fetchApi(`/programas/${id}`)
      .then(res => {
        setPrograma(res);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleInscription = async () => {
    const loggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    if (!loggedIn) {
      if(window.confirm("Debes iniciar sesión o registrarte para inscribirte. ¿Ir a login?")) {
        navigate('/login');
      }
      return;
    }

    // Iniciar simulación de pago
    setSimulatingPayment(true);
    
    try {
      // Registrar la inscripción real en la cohorte activa del programa
      await fetchApi('/usuario/inscribir', {
        method: 'POST',
        body: JSON.stringify({
          programa_id: programa.id,
          costo: programa.costo
        })
      });
      
      setSimulatingPayment(false);
      alert("¡Simulación de Pago y Autoinscripción Exitosas! Serás redirigido a tu Dashboard de estudiante.");
      navigate('/dashboard');
    } catch (err) {
      setSimulatingPayment(false);
      alert("Error al inscribirse: " + err.message);
    }
  };

  if (loading) return <div style={{ padding: '5rem', textAlign: 'center' }}>Cargando programa...</div>;
  if (error) return <div style={{ padding: '5rem', textAlign: 'center', color: 'red' }}>Error: {error}</div>;
  if (!programa) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      {/* Banner Principal */}
      <div style={{ 
        position: 'relative', 
        height: '400px', 
        backgroundColor: '#1a1a1a',
        backgroundImage: programa.imagen_url ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(http://localhost:5000${programa.imagen_url})` : 'linear-gradient(45deg, var(--color-primary-dark), var(--color-primary))',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        color: 'white',
        padding: '0 2rem'
      }}>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1rem' }}>
            <ArrowLeft size={18} /> Volver al catálogo
          </button>
          <span style={{ backgroundColor: 'var(--color-accent)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {programa.tipo} • {programa.modalidad}
          </span>
          <h1 style={{ fontSize: window.innerWidth < 600 ? '2rem' : '3.5rem', margin: '1rem 0', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{programa.nombre}</h1>
          <p style={{ fontSize: '1.2rem', maxWidth: '600px', opacity: 0.9 }}>{programa.categoria}</p>
        </div>
      </div>

      <div className="container" style={{ padding: '3rem 2rem', display: 'flex', gap: '3rem', flexDirection: window.innerWidth < 900 ? 'column' : 'row' }}>
        
        {/* Contenido Principal */}
        <div style={{ flex: 2 }}>
          <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: '1.5rem' }}>Acerca de este programa</h2>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--text-main)', whiteSpace: 'pre-wrap', marginBottom: '3rem' }}>
            {programa.descripcion || 'Sin descripción disponible.'}
          </p>

          <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: '1.5rem' }}>Lo que obtendrás</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {programa.beneficios.length > 0 ? programa.beneficios.map((b, idx) => (
              <div key={idx} style={{ padding: '1.5rem', backgroundColor: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <CheckCircle color="var(--color-accent)" size={24} style={{ marginBottom: '1rem' }} />
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>{b.nombre}</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{b.descripcion}</p>
              </div>
            )) : (
              <p style={{ color: 'var(--text-muted)' }}>Este programa incluye material estándar.</p>
            )}
          </div>

          {programa.facilitadores && programa.facilitadores.length > 0 && (
            <>
              <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: '1.5rem' }}>Facilitadores del programa</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {programa.facilitadores.map((f, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {f[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{f}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Docente Facilitador</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Panel Lateral de Checkout */}
        <div style={{ flex: 1 }}>
          <div style={{ 
            backgroundColor: 'var(--panel-bg)', 
            padding: '2rem', 
            borderRadius: '16px', 
            border: '1px solid var(--glass-border)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: '20px'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', textAlign: 'center' }}>Inversión</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-accent)', textAlign: 'center', marginBottom: '2rem' }}>
              {programa.costo} Bs.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-main)' }}>
                <Calendar color="var(--color-primary)" size={20} />
                <span><strong>Inicio:</strong> {programa.fecha_inicio ? new Date(programa.fecha_inicio).toLocaleDateString() : 'Por definir'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-main)' }}>
                <Clock color="var(--color-primary)" size={20} />
                <span><strong>Duración:</strong> {programa.duracion_horas ? `${programa.duracion_horas} Horas académicas` : 'Por definir'}</span>
              </div>
            </div>

            {!programa.activo && (
              <div style={{ padding: '1rem', backgroundColor: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', borderRadius: '8px', display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                <AlertCircle size={20} />
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Las inscripciones a esta cohorte han cerrado.</span>
              </div>
            )}

            <button 
              onClick={handleInscription}
              disabled={!programa.activo || simulatingPayment}
              style={{
                width: '100%',
                padding: '1.2rem',
                backgroundColor: programa.activo ? 'var(--color-primary)' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: programa.activo && !simulatingPayment ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.8rem',
                transition: 'transform 0.2s',
                opacity: simulatingPayment ? 0.8 : 1
              }}
            >
              {simulatingPayment ? 'Procesando Pago...' : <><CreditCard size={20} /> Inscribirme Ahora</>}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
              Pago 100% seguro. Acceso inmediato tras la confirmación.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramaDetalle;
