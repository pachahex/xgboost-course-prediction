import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../api';

const Inscripciones = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const loadInscripciones = async () => {
      setLoading(true);
      setError('');
      try {
        // Obteniendo 50 por página
        const res = await fetchApi(`/admin/inscripciones?page=${page}&limit=50`);
        setData(res.data);
        setTotal(res.total);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadInscripciones();
  }, [page]);

  const thStyle = { padding: '1rem', backgroundColor: '#f8f9fa', textAlign: 'left', color: '#555', borderBottom: '2px solid #ddd' };
  const tdStyle = { padding: '1rem', borderBottom: '1px solid #eee' };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-primary-dark)' }}>Inspección de Transacciones Históricas</h2>
      
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
      
      {loading ? (
        <p>Cargando registros...</p>
      ) : (
        <>
          <p style={{ color: '#666', marginBottom: '1rem' }}>Mostrando resultados {((page-1)*50) + 1} a {Math.min(page*50, total)} de {total}.</p>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Fecha</th>
                  <th style={thStyle}>Programa</th>
                  <th style={thStyle}>Depto</th>
                  <th style={thStyle}>Edad</th>
                  <th style={thStyle}>Costo</th>
                  <th style={thStyle}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.map(item => (
                  <tr key={item.id} style={{ transition: 'background-color 0.2s' }}>
                    <td style={tdStyle}>#{item.id}</td>
                    <td style={tdStyle}>{item.fecha}</td>
                    <td style={tdStyle}><strong>{item.programa}</strong></td>
                    <td style={tdStyle}>{item.departamento}</td>
                    <td style={tdStyle}>{item.edad}</td>
                    <td style={tdStyle}><span style={{color: 'green', fontWeight: 'bold'}}>{item.costo} Bs.</span></td>
                    <td style={tdStyle}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '12px', 
                        fontSize: '0.8rem',
                        backgroundColor: item.estado === 'Completado' ? '#e8f5e9' : (item.estado === 'Cancelado' ? '#ffe3e3' : '#fff3cd'),
                        color: item.estado === 'Completado' ? '#2b8a3e' : (item.estado === 'Cancelado' ? '#c92a2a' : '#e67700')
                      }}>
                        {item.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Wrapper Paginación */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
            <button 
              disabled={page === 1} 
              onClick={() => setPage(page-1)}
              style={{ padding: '0.5rem 1rem', opacity: page === 1 ? 0.5 : 1 }}
            >
              &larr; Anterior
            </button>
            <span style={{ fontWeight: 'bold' }}>Página {page}</span>
            <button 
              disabled={page * 50 >= total} 
              onClick={() => setPage(page+1)}
              style={{ padding: '0.5rem 1rem', opacity: page * 50 >= total ? 0.5 : 1 }}
            >
              Siguiente &rarr;
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Inscripciones;
