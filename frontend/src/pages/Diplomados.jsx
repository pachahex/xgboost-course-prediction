import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';

const Diplomados = () => {
  const [diplomados, setDiplomados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchApi('/programas');
        const soloDiplomados = res.filter(p => p.tipo === 'Diplomado');
        setDiplomados(soloDiplomados);
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
      <h1>Nuestros Diplomados</h1>
      <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '3rem' }}>
        Programas de posgrado de excelencia avalados internacionalmente.
      </p>
      
      {loading ? <p>Cargando catálogo...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
          {diplomados.map(d => (
            <div key={d.id} className="glass-panel" style={{ padding: '3rem', textAlign: 'left', borderTop: '4px solid var(--color-primary)' }}>
              {d.imagen_url && (
                <div style={{ width: '100%', height: '200px', backgroundImage: `url('http://localhost:5000${d.imagen_url}')`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '8px', marginBottom: '1.5rem' }}></div>
              )}
              <h2 style={{ color: 'var(--color-primary-dark)' }}>{d.nombre}</h2>
              <p style={{ color: '#555', lineHeight: '1.6' }}>
                {d.descripcion || 'Especialidad avanzada orientada al entorno profesional con metodología práctica.'}
              </p>
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-accent)', fontWeight: 'bold', fontSize: '1.2rem' }}>{d.costo} Bs.</span>
                <button style={{ backgroundColor: 'var(--color-primary)' }}>Solicitar info</button>
              </div>
            </div>
          ))}
          {diplomados.length === 0 && <p style={{ gridColumn: '1 / -1' }}>Aún no hay diplomados registrados.</p>}
        </div>
      )}
    </div>
  );
};

export default Diplomados;
