import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';

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
    <div style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
      <h1>Cursos Cortos y Especializados</h1>
      <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '3rem' }}>
        Actualiza tus habilidades en pocas semanas con nuestra oferta de cursos.
      </p>
      
      {loading ? <p>Cargando catálogo...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {cursos.map(c => (
            <div key={c.id} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {c.imagen_url && (
                <div style={{ width: '100%', height: '150px', backgroundImage: `url('http://localhost:5000${c.imagen_url}')`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '8px', marginBottom: '1rem' }}></div>
              )}
              <h3 style={{ color: 'var(--color-primary-dark)' }}>{c.nombre}</h3>
              <p>{c.descripcion || "Curso formativo impartido por la academia."}</p>
              <span style={{ display: 'inline-block', marginTop: 'auto', paddingTop: '1rem', color: 'var(--color-accent)', fontWeight: 'bold' }}>{c.costo} Bs.</span>
            </div>
          ))}
          {cursos.length === 0 && <p style={{ gridColumn: '1 / -1' }}>Aún no hay cursos registrados.</p>}
        </div>
      )}
    </div>
  );
};

export default Cursos;
