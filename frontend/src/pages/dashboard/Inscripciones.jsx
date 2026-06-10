import React, { useState, useEffect, useMemo } from 'react';
import { fetchApi } from '../../api';
import { Award, BookOpen, Calendar, Clock, Filter, Search, Users, Activity, BarChart2 } from 'lucide-react';

// Calcular progreso temporal de la cohorte
const getCohortProgress = (startStr, endStr) => {
  if (!startStr || !endStr || startStr === 'None' || endStr === 'None') return 0;
  try {
    const start = new Date(startStr).getTime();
    const end = new Date(endStr).getTime();
    const now = new Date().getTime();
    if (now < start) return 0;
    if (now > end) return 100;
    const totalTime = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / totalTime) * 100);
  } catch {
    return 0;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr || dateStr === 'None') return 'Por definir';
  try {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('es-ES', options);
  } catch {
    return dateStr;
  }
};

const thStyle = { 
  padding: '1rem', 
  backgroundColor: 'var(--bg-page)', 
  textAlign: 'left', 
  color: 'var(--text-main)', 
  borderBottom: '2px solid var(--glass-border)',
  transition: 'background-color 0.3s, color 0.3s, border-color 0.3s'
};

const tdStyle = { 
  padding: '1rem', 
  borderBottom: '1px solid var(--glass-border)',
  color: 'var(--text-main)',
  transition: 'border-color 0.3s, color 0.3s'
};

const Inscripciones = () => {
  const [data, setData] = useState([]);
  const [cohortes, setCohortes] = useState([]);
  const [selectedCohorte, setSelectedCohorte] = useState('');
  const [cohortesFilter, setCohortesFilter] = useState('active'); // 'active', 'closed'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchApi('/admin/cohortes/all')
      .then(res => setCohortes(res))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedCohorte) {
      setData([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    const loadInscripciones = async () => {
      setLoading(true);
      setError('');
      try {
        const queryParams = new URLSearchParams({ page, limit: 50 });
        queryParams.append('cohorte_id', selectedCohorte);
        const res = await fetchApi(`/admin/inscripciones?${queryParams.toString()}`);
        setData(res.data);
        setTotal(res.total);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadInscripciones();
  }, [page, selectedCohorte]);

  // Filtrar las cohortes para el selector y el sumario superior
  const visibleCohortes = useMemo(() => {
    return cohortes.filter(c => {
      if (cohortesFilter === 'active') return c.activo;
      if (cohortesFilter === 'closed') return !c.activo;
      return true;
    });
  }, [cohortes, cohortesFilter]);

  const activeCohortes = useMemo(() => {
    return cohortes.filter(c => c.activo);
  }, [cohortes]);

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary-dark)', fontSize: '1.8rem' }}>Gestor de Cohortes & Inscripciones</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Supervisa y audita las cohortes activas, enrollees, y el histórico general de transacciones.</p>
      </div>

      {/* 1. SECCIÓN DE COHORTES ABIERTAS / ACTIVAS (Cómo van) */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ 
          color: 'var(--text-main)', 
          fontSize: '1.25rem', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Activity size={20} color="var(--color-accent)" /> 
          Estado y Avance de Cohortes Activas
        </h3>

        {activeCohortes.length === 0 ? (
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No hay cohortes activas en este momento. Lanza una desde el Gestor de Programas.
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {activeCohortes.map(c => {
              const progress = getCohortProgress(c.fecha_inicio, c.fecha_fin);
              return (
                <div 
                  key={c.id} 
                  className="glass-panel" 
                  style={{ 
                    padding: '1.5rem', 
                    borderLeft: '5px solid var(--color-accent)',
                    backgroundColor: 'var(--panel-bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: '700' }}>
                        {c.programa_nombre} {c.programa_tipo && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({c.programa_tipo})</span>}
                      </h4>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.2rem 0.5rem', 
                        backgroundColor: 'rgba(3, 143, 186, 0.12)', 
                        color: 'var(--color-accent)', 
                        borderRadius: '12px',
                        fontWeight: 'bold'
                      }}>
                        {c.cohorte_nombre}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} /> {formatDate(c.fecha_inicio)} - {formatDate(c.fecha_fin)}
                      </span>
                    </div>

                    {/* Barra de progreso de la cohorte */}
                    <div style={{ marginBottom: '1.2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                        <span>Duración Transcurrida</span>
                        <strong>{progress}%</strong>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--color-accent)', borderRadius: '3px' }} />
                      </div>
                    </div>
                  </div>

                  {/* Estadísticas de enrollees */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: '0.5rem', 
                    borderTop: '1px solid var(--glass-border)', 
                    paddingTop: '0.8rem',
                    textAlign: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{c.total_inscritos}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Inscritos</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#2ecc71' }}>{c.activos}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Activos</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f1c40f' }}>{c.pendientes}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pendientes</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#3498db' }}>{c.finalizados}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Egresados</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. TABLA DE TRANSACCIONES E INSCRIPCIONES */}
      <div className="glass-panel" style={{ padding: '2rem', backgroundColor: 'var(--panel-bg)', borderRadius: '16px' }}>
        
        {/* Controles de Filtros */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem', 
          flexWrap: 'wrap', 
          gap: '1.5rem',
          borderBottom: '1px solid var(--glass-border)',
          paddingBottom: '1.5rem'
        }}>
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={20} /> Historial y Auditoría de Inscritos
          </h3>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            
            {/* Filtro de Estado de Cohorte */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={16} style={{ color: 'var(--text-muted)' }} />
              <select 
                value={cohortesFilter} 
                onChange={(e) => { setCohortesFilter(e.target.value); setSelectedCohorte(''); setPage(1); }}
                style={{
                  padding: '0.6rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid var(--glass-border)',
                  backgroundColor: 'var(--bg-page)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem'
                }}
              >
                <option value="active">Cohortes Activas</option>
                <option value="closed">Cohortes Cerradas</option>
              </select>
            </div>

            {/* Selector de Cohorte específica */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select 
                value={selectedCohorte} 
                onChange={(e) => { setSelectedCohorte(e.target.value); setPage(1); }}
                style={{
                  padding: '0.6rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid var(--glass-border)',
                  backgroundColor: 'var(--bg-page)',
                  color: 'var(--text-main)',
                  minWidth: '220px',
                  fontSize: '0.9rem'
                }}
              >
                <option value="">Seleccionar cohorte...</option>
                {visibleCohortes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {error && (
          <div style={{ 
            padding: '1rem', 
            backgroundColor: 'rgba(231,76,60,0.1)', 
            color: '#e74c3c', 
            borderRadius: '8px', 
            marginBottom: '1.5rem',
            border: '1px solid rgba(231,76,60,0.3)'
          }}>
            {error}
          </div>
        )}
        
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando transacciones históricas...</div>
        ) : (
          <>
            {/* Banner de Cohorte seleccionada en la parte superior */}
            {selectedCohorte && (() => {
              const selectedCohorteObj = cohortes.find(c => String(c.id) === String(selectedCohorte));
              const selectedProgName = selectedCohorteObj ? (selectedCohorteObj.programa_nombre || selectedCohorteObj.programa) : '';
              const selectedCohName = selectedCohorteObj ? (selectedCohorteObj.cohorte_nombre || selectedCohorteObj.nombre) : '';
              return selectedCohorteObj ? (
                <div className="glass-panel" style={{
                  padding: '1.2rem 1.5rem',
                  marginBottom: '1.5rem',
                  backgroundColor: 'rgba(3, 143, 186, 0.04)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>Filtro de Cohorte Activo</span>
                    <h4 style={{ margin: '0.1rem 0 0 0', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 'bold' }}>
                      Programa: <span style={{ color: 'var(--color-primary-dark)' }}>{selectedProgName}</span> {selectedCohorteObj.programa_tipo && <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({selectedCohorteObj.programa_tipo})</span>}
                    </h4>
                  </div>
                  <div>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      padding: '0.4rem 0.8rem', 
                      backgroundColor: 'rgba(3, 143, 186, 0.12)', 
                      color: 'var(--color-accent)', 
                      borderRadius: '12px',
                      fontWeight: 'bold'
                    }}>
                      Edición: {selectedCohName}
                    </span>
                  </div>
                </div>
              ) : null;
            })()}

            {selectedCohorte && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
                  Mostrando resultados {total === 0 ? 0 : ((page-1)*50) + 1} a {Math.min(page*50, total)} de <strong>{total}</strong> transacciones.
                </p>
              </div>
            )}
            
            <div style={{ overflowX: 'auto' }}>
              {(() => {
                const showProgCoh = !selectedCohorte;
                return (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>ID</th>
                        <th style={thStyle}>Fecha</th>
                        <th style={thStyle}>Estudiante</th>
                        <th style={thStyle}>Procedencia</th>
                        {showProgCoh && <th style={thStyle}>Programa</th>}
                        {showProgCoh && <th style={thStyle}>Cohorte</th>}
                        <th style={thStyle}>Medio Captación</th>
                        <th style={thStyle}>Monto Cobrado</th>
                        <th style={thStyle}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!selectedCohorte ? (
                        <tr>
                          <td colSpan={showProgCoh ? 9 : 7} style={{ ...tdStyle, textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            Selecciona una cohorte de la lista superior para visualizar sus inscritos.
                          </td>
                        </tr>
                      ) : data.length === 0 ? (
                        <tr>
                          <td colSpan={showProgCoh ? 9 : 7} style={{ ...tdStyle, textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            No se encontraron inscripciones para la cohorte seleccionada.
                          </td>
                        </tr>
                      ) : (
                        data.map(item => (
                          <tr key={item.id} style={{ transition: 'background-color 0.2s' }}>
                            <td style={{ ...tdStyle, fontWeight: 'bold' }}>#{item.id}</td>
                            <td style={tdStyle}>{new Date(item.fecha).toLocaleDateString('es-ES')}</td>
                            <td style={tdStyle}>
                              <div style={{fontWeight: '700', color: 'var(--text-main)'}}>{item.usuario_nombre || `Usuario #${item.usuario_id}`}</div>
                              <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{item.usuario_ci ? `C.I. ${item.usuario_ci}` : 'S/N C.I.'} • {item.edad} años</div>
                            </td>
                            <td style={tdStyle}>{item.departamento}</td>
                            {showProgCoh && <td style={tdStyle}><strong>{item.programa}</strong></td>}
                            {showProgCoh && (
                              <td style={tdStyle}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--color-primary-dark)', fontWeight: '600' }}>
                                  {item.cohorte}
                                </span>
                              </td>
                            )}
                            <td style={tdStyle}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.origen}</span>
                            </td>
                            <td style={tdStyle}>
                              <span style={{color: 'var(--color-accent)', fontWeight: 'bold'}}>{item.costo} Bs.</span>
                            </td>
                            <td style={tdStyle}>
                              <span style={{ 
                                padding: '4px 10px', 
                                borderRadius: '12px', 
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                backgroundColor: item.estado === 'Activo' ? 'rgba(46, 204, 113, 0.15)' : 
                                                 (item.estado === 'Finalizado' ? 'rgba(52, 152, 219, 0.15)' : 'rgba(241, 196, 15, 0.15)'),
                                color: item.estado === 'Activo' ? '#2e7d32' :  
                                       (item.estado === 'Finalizado' ? '#1565c0' : '#e65100'),
                                border: `1px solid ${item.estado === 'Activo' ? 'rgba(46, 204, 113, 0.3)' : 
                                                     (item.estado === 'Finalizado' ? 'rgba(52, 152, 219, 0.3)' : 'rgba(241, 196, 15, 0.3)')}`
                              }}>
                                {item.estado}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            {/* Paginación */}
            {total > 50 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '1rem',
                marginTop: '1.5rem',
                padding: '1.5rem 0 0 0',
                borderTop: '1px solid var(--glass-border)',
                flexWrap: 'wrap'
              }}>
                <button
                  disabled={page === 1}
                  onClick={() => {
                    setPage(prev => Math.max(prev - 1, 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '6px',
                    border: '1px solid var(--glass-border)',
                    backgroundColor: 'var(--bg-page)',
                    color: page === 1 ? 'var(--text-muted)' : 'var(--text-main)',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
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
                  Página {page} de {Math.ceil(total / 50)}
                </span>

                <button
                  disabled={page * 50 >= total}
                  onClick={() => {
                    setPage(prev => Math.min(prev + 1, Math.ceil(total / 50)));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '6px',
                    border: '1px solid var(--glass-border)',
                    backgroundColor: 'var(--bg-page)',
                    color: page * 50 >= total ? 'var(--text-muted)' : 'var(--text-main)',
                    cursor: page * 50 >= total ? 'not-allowed' : 'pointer',
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
        )}
      </div>
    </div>
  );
};

export default Inscripciones;

