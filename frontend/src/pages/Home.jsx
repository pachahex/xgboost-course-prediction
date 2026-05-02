import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../api';
import { Brain, Scale, Code, Rocket } from 'lucide-react';

const Home = () => {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetchApi('/public-stats');
        setStats(res.stats);
      } catch (e) {
        console.error("Error al cargar estadisticas", e);
      }
    };
    loadStats();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="section-padding" style={{ 
        color: 'white', 
        textAlign: 'center',
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)'
      }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', color: 'white' }}>Educación Integral y Excelencia Académica</h1>
        <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 2rem auto', opacity: 0.9 }}>
          Descubre oportunidades que transformarán tu carrera profesional con nuestros cursos y diplomados de vanguardia.
        </p>
        <Link to="/diplomados">
          <button style={{ 
            backgroundColor: 'var(--color-accent)', 
            color: 'white', 
            padding: '1rem 2rem', 
            fontSize: '1.1rem', 
            borderRadius: '30px',
            fontWeight: '700',
            boxShadow: '0 4px 14px 0 rgba(3, 143, 186, 0.39)',
            border: 'none'
          }}>
            Conoce nuestros programas
          </button>
        </Link>
      </section>

      {/* Stats Panel */}
      {stats.length > 0 && (
        <section className="container section-padding" style={{ display: 'flex', justifyContent: 'center', gap: '3rem', backgroundColor: 'var(--bg-page)', flexWrap: 'wrap', transition: 'background-color 0.3s' }}>
          {stats.map((stat, idx) => (
            <div key={idx} style={{ 
              textAlign: 'center', 
              padding: '1.5rem', 
              borderRadius: '10px', 
              boxShadow: '0 4px 6px var(--glass-shadow)', 
              minWidth: '200px',
              backgroundColor: 'var(--panel-bg)',
              transition: 'background-color 0.3s, box-shadow 0.3s'
            }}>
              <h2 style={{ fontSize: '2.5rem', color: 'var(--color-accent)', margin: 0 }}>+{stat.value}</h2>
              <p style={{ color: 'var(--text-muted)', fontWeight: 500, margin: '0.5rem 0 0 0' }}>{stat.label}</p>
            </div>
          ))}
        </section>
      )}

      {/* Featured Section */}
      <section className="container section-padding">
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '2rem', color: 'var(--color-primary)' }}>Áreas de Estudio</h2>
        <div className="grid-responsive">
          
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ backgroundColor: 'rgba(52, 152, 219, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--color-accent)' }}>
              <Brain size={40} />
            </div>
            <h3>Psicología</h3>
            <p style={{ color: 'var(--text-muted)' }}>Programas como Terapia Cognitivo Conductual y Dependencia Emocional.</p>
          </div>
          
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ backgroundColor: 'rgba(46, 204, 113, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--color-primary)' }}>
              <Scale size={40} />
            </div>
            <h3>Derecho</h3>
            <p style={{ color: 'var(--text-muted)' }}>Especializaciones en Litigación y Derecho de Familia.</p>
          </div>
 
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ backgroundColor: 'rgba(155, 89, 182, 0.1)', padding: '1rem', borderRadius: '50%', color: '#9b59b6' }}>
              <Code size={40} />
            </div>
            <h3>Tecnología y Educación</h3>
            <p style={{ color: 'var(--text-muted)' }}>Explora Tecnologías Web y Neuropedagogía Aplicada.</p>
          </div>
 
        </div>
      </section>
    </div>
  );
};

export default Home;
