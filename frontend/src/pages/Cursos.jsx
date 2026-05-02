import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';
import { Zap, BookOpen } from 'lucide-react';

const Cursos = () => {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchApi('/programas');
        const soloCursos = res.filter(p => p.tipo === 'Curso');
        setCursos(soloCursos);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="container section-padding" style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <Zap size={32} color="var(--color-accent)" />
        <h1 style={{ color: 'var(--color-primary)', margin: 0 }}>Cursos Cortos y Especializados</h1>
      </div>
      <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '3rem' }}>
        Actualiza tus habilidades en pocas semanas con nuestra oferta de cursos.
      </p>
      
      {loading ? <p style={{ color: 'var(--text-main)' }}>Cargando catálogo...</p> : (
        <div className="grid-responsive">
          {cursos.map(c => (
            <div key={c.id} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform 0.3s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              {c.imagen_url ? (
                <div className="img-expand-container" style={{ height: '150px', marginBottom: '1rem' }}>
                  <div className="img-expand" style={{ backgroundImage: `url('http://localhost:5000${c.imagen_url}')` }}></div>
                </div>
              ) : (
                <div style={{ width: '100%', height: '150px', backgroundColor: 'var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', marginBottom: '1rem', color: 'var(--color-primary)', opacity: 0.5 }}>
                   <BookOpen size={48} />
                </div>
              )}
              <h3 style={{ color: 'var(--color-primary-dark)' }}>{c.nombre}</h3>
              <p style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{c.descripcion || "Curso formativo impartido por la academia."}</p>
              <div style={{ marginTop: 'auto', paddingTop: '1.5rem', width: '100%', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-accent)', fontWeight: 'bold', fontSize: '1.1rem' }}>{c.costo} Bs.</span>
                <button style={{ backgroundColor: 'var(--color-accent)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '4px', border: 'none', fontSize: '0.8rem', fontWeight: 'bold' }}>Ver más</button>
              </div>
            </div>
          ))}
          {cursos.length === 0 && <p style={{ gridColumn: '1 / -1', color: 'var(--text-main)' }}>Aún no hay cursos registrados.</p>}
        </div>
      )}
    </div>
  );
};

export default Cursos;
