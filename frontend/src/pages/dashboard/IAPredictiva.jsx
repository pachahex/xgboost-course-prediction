import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';

const MESES = [
  { id: 1, nombre: 'Enero' }, { id: 2, nombre: 'Febrero' }, { id: 3, nombre: 'Marzo' },
  { id: 4, nombre: 'Abril' }, { id: 5, nombre: 'Mayo' }, { id: 6, nombre: 'Junio' },
  { id: 7, nombre: 'Julio' }, { id: 8, nombre: 'Agosto' }, { id: 9, nombre: 'Septiembre' },
  { id: 10, nombre: 'Octubre' }, { id: 11, nombre: 'Noviembre' }, { id: 12, nombre: 'Diciembre' }
];

const COLORS = ['#ff6b6b', '#339af0', '#51cf66', '#fcc419', '#845ef7', '#20c997'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '12px', border: '1px solid #ebeeef', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>{label}</p>
        <p style={{ margin: 0, color: payload[0].payload.color || '#333', fontSize: '0.9rem' }}>
          Impacto SHAP: {Number(payload[0].value).toFixed(3)}
        </p>
      </div>
    );
  }
  return null;
};

const IAPredictiva = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mesObjetivo, setMesObjetivo] = useState(new Date().getMonth() + 1);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const cargarPredicciones = async (mes) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchApi(`/admin/predecir-demanda?mes=${mes}`);
      setData(res.predicciones);
      setCurrentPage(1); // Reset page to 1 on mes change
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPredicciones(mesObjetivo);
  }, [mesObjetivo]);

  const handleMesChange = (e) => {
    setMesObjetivo(parseInt(e.target.value));
  };

  if (error) return <p style={{ color: 'red', textAlign: 'center', marginTop: '2rem' }}>Error: {error}</p>;

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data ? data.slice(indexOfFirstItem, indexOfLastItem) : [];
  const totalPages = data ? Math.ceil(data.length / itemsPerPage) : 0;

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ color: 'var(--color-primary-dark)', margin: 0, fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.5px' }}>
            Ranking Predictivo de Programas (XGBoost)
          </h2>
          <p style={{ color: '#666', marginTop: '0.5rem', fontSize: '1.05rem', maxWidth: '800px' }}>
            Selecciona un mes de lanzamiento para simular el comportamiento del mercado. La IA rankeará los programas según su demanda predicha e indicará las variables a favor y en contra usando valores SHAP.
          </p>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '1rem 1.5rem', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>Mes de Lanzamiento Objetivo:</span>
          <select 
            value={mesObjetivo} 
            onChange={handleMesChange}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}
          >
            {MESES.filter(m => m.id >= new Date().getMonth() + 1).map(m => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ position: 'relative', minHeight: '60vh' }}>
        {loading && (
          <div style={{ 
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(255, 255, 255, 0.6)', 
            display: 'flex', justifyContent: 'center', alignItems: 'center', 
            flexDirection: 'column', zIndex: 10,
            backdropFilter: 'blur(2px)',
            borderRadius: '16px'
          }}>
            <div className="spinner" style={{ width: '50px', height: '50px', border: '4px solid var(--color-accent-light)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ marginTop: '1rem', color: 'var(--color-primary-dark)', fontWeight: 'bold', backgroundColor: 'white', padding: '8px 16px', borderRadius: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>Recalculando Predicciones... 🤖</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', opacity: loading && !data ? 0 : 1, transition: 'opacity 0.3s' }}>
          {data && data.length > 0 ? (
            <>
              {currentItems.map((prog, index) => {
                const globalIndex = indexOfFirstItem + index;
                // Preparar datos para el gráfico SHAP
                const shapChartData = Object.entries(prog.shap_values)
                  .map(([key, value]) => ({
                    name: key.replace('Categoria_', 'Cat: ').replace('Tipo_Programa_', 'Tipo: '),
                    value: value,
                    color: value >= 0 ? '#51cf66' : '#ff6b6b' // Verde positivo, Rojo negativo
                  }))
                  .sort((a, b) => Math.abs(b.value) - Math.abs(a.value)) // Ordenar por mayor impacto absoluto
                  .slice(0, 6); // Tomar solo los 6 features más importantes para que sea legible

                const isTop = globalIndex < 3; // Destacar el Top 3 global

                return (
                  <div key={prog.programa_id} style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '16px', 
                    padding: '1.5rem', 
                    boxShadow: isTop ? '0 10px 30px rgba(81, 207, 102, 0.15)' : '0 4px 15px rgba(0,0,0,0.05)',
                    border: isTop ? '2px solid #51cf66' : '1px solid #eee',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '2rem',
                    alignItems: 'center'
                  }}>
                    {/* Detalles del Programa */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ 
                          width: '40px', height: '40px', borderRadius: '50%', 
                          backgroundColor: isTop ? '#51cf66' : '#f8f9fa', 
                          color: isTop ? 'white' : '#adb5bd',
                          display: 'flex', justifyContent: 'center', alignItems: 'center',
                          fontWeight: 'bold', fontSize: '1.2rem'
                        }}>
                          {globalIndex + 1}
                        </div>
                        <h3 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '1.3rem' }}>{prog.nombre}</h3>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                          <span style={{ display: 'block', color: '#868e96', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Demanda Predicha</span>
                          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                            {Math.round(prog.demanda_predicha)} <span style={{ fontSize: '1rem', color: '#666', fontWeight: 'normal' }}>estudiantes</span>
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
                          <div><strong style={{ color: '#495057' }}>Tipo:</strong> <span style={{ backgroundColor: '#e7f5ff', color: '#1971c2', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem' }}>{prog.tipo}</span></div>
                          <div><strong style={{ color: '#495057' }}>Categoría:</strong> <span style={{ backgroundColor: '#fff0f6', color: '#a61e4d', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem' }}>{prog.categoria}</span></div>
                          <div><strong style={{ color: '#495057' }}>Costo:</strong> {prog.costo} Bs.</div>
                        </div>
                      </div>
                    </div>

                    {/* Explicabilidad SHAP */}
                    <div style={{ height: '200px' }}>
                      <h4 style={{ margin: '0 0 10px', color: '#495057', fontSize: '0.9rem', textAlign: 'center' }}>Impacto de Variables (SHAP Values)</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={shapChartData} layout="vertical" margin={{ left: 80, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                          <XAxis type="number" tick={{fontSize: 10}} />
                          <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10, fill: '#555'}} axisLine={false} tickLine={false} />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {shapChartData.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })}

              {/* Controles de Paginación */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '1rem',
                  marginTop: '2rem',
                  padding: '1.5rem 0 0 0',
                  borderTop: '1px solid var(--glass-border)',
                  flexWrap: 'wrap'
                }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage(prev => Math.max(prev - 1, 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{
                      padding: '0.6rem 1.2rem',
                      borderRadius: '6px',
                      border: '1px solid var(--glass-border)',
                      backgroundColor: 'var(--bg-page)',
                      color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-main)',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    Anterior
                  </button>
                  
                  <span style={{
                    color: 'var(--text-main)',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    userSelect: 'none'
                  }}>
                    Página {currentPage} de {totalPages}
                  </span>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage(prev => Math.min(prev + 1, totalPages));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{
                      padding: '0.6rem 1.2rem',
                      borderRadius: '6px',
                      border: '1px solid var(--glass-border)',
                      backgroundColor: 'var(--bg-page)',
                      color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-main)',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          ) : (
            !loading && <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No hay programas disponibles para predecir.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default IAPredictiva;
