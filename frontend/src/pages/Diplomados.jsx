import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';
import { Info } from 'lucide-react';

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
    <div className="container section-padding" style={{ textAlign: 'center' }}>
      <h1 style={{ color: 'var(--color-primary)' }}>Nuestros Diplomados</h1>
      <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '3rem' }}>
        Programas de posgrado de excelencia avalados internacionalmente.
      </p>
      
      {loading ? <p style={{ color: 'var(--text-main)' }}>Cargando catálogo...</p> : (
        <div className="grid-responsive">
          {diplomados.map(d => (
            <div key={d.id} className="glass-panel" style={{ padding: '3rem', textAlign: 'left', borderTop: '4px solid var(--color-primary)' }}>
              {d.imagen_url && (
                <div className="img-expand-container" style={{ height: '200px', marginBottom: '1.5rem' }}>
                  <div className="img-expand" style={{ backgroundImage: `url('http://localhost:5000${d.imagen_url}')` }}></div>
                </div>
              )}
              <h2 style={{ color: 'var(--color-primary-dark)' }}>{d.nombre}</h2>
              <p style={{ color: 'var(--text-main)', lineHeight: '1.6' }}>
                {d.descripcion || 'Especialidad avanzada orientada al entorno profesional con metodología práctica.'}
              </p>
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-accent)', fontWeight: 'bold', fontSize: '1.2rem' }}>{d.costo} Bs.</span>
                <button style={{ backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '6px', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                  <Info size={18} /> Solicitar info
                </button>
              </div>
            </div>
          ))}
          {diplomados.length === 0 && <p style={{ gridColumn: '1 / -1', color: 'var(--text-main)' }}>Aún no hay diplomados registrados.</p>}
        </div>
      )}
    </div>
  );
};

export default Diplomados;
