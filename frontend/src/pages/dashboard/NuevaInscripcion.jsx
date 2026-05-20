import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '../../api';
import { UserPlus, BookOpen, DollarSign, Calendar, Info, CheckCircle, UserCheck, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NuevaInscripcion = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  // Catálogos
  const [programas, setProgramas] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [utils, setUtils] = useState({
    estados_inscripcion: [],
    origenes: [],
    departamentos: [],
    grados_academicos: []
  });

  // Estado del Formulario
  const [isNewStudent, setIsNewStudent] = useState(false);
  const [formData, setFormData] = useState({
    usuario_id: '',
    programa_id: '',
    estado_id: '',
    origen_id: '',
    costo_pagado: '',
    fecha_inscripcion: new Date().toISOString().split('T')[0],
    // Datos para nuevo estudiante
    nuevo_estudiante: {
      nombre_completo: '',
      correo: '',
      ci: '',
      password: 'estudiante123',
      fecha_nacimiento: '',
      departamento_id: '',
      grado_academico_id: ''
    }
  });

  // Búsqueda interactiva de estudiantes existentes
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [progs, ests, cats] = await Promise.all([
          fetchApi('/programas'), // Usamos los públicos activos
          fetchApi('/admin/estudiantes'),
          fetchApi('/admin/utils/catalogos')
        ]);
        setProgramas(progs);
        setEstudiantes(ests);
        setUtils(cats);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let usuarioId = formData.usuario_id;

      // Validación para asegurarse de elegir o crear un estudiante
      if (!isNewStudent && !usuarioId) {
        alert("Por favor, busque y seleccione un estudiante existente o marque 'Registrar como estudiante nuevo'.");
        setSubmitting(false);
        return;
      }

      // 1. Si es nuevo estudiante, registrarlo primero
      if (isNewStudent) {
        const estudianteData = {
          ...formData.nuevo_estudiante,
          password: formData.nuevo_estudiante.ci // Usamos el CI como contraseña por defecto
        };
        const regRes = await fetchApi('/registro', {
          method: 'POST',
          body: JSON.stringify(estudianteData)
        });
        // Necesitamos el ID del estudiante recién creado. 
        // El backend /api/registro no lo devuelve actualmente en el JSON, 
        // así que tendríamos que buscarlo por correo o modificar el backend.
        // Por ahora, buscaré en la lista actualizada.
        const updatedEsts = await fetchApi('/admin/estudiantes');
        const newEst = updatedEsts.find(u => u.correo === formData.nuevo_estudiante.correo);
        if (newEst) usuarioId = newEst.id;
      }

      // 2. Crear la inscripción
      await fetchApi('/admin/inscripciones', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          usuario_id: usuarioId
        })
      });

      setStatus('Inscripción completada con éxito.');
      setTimeout(() => navigate('/dashboard/inscripciones'), 2000);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    padding: '0.8rem',
    borderRadius: '6px',
    border: '1px solid var(--glass-border)',
    backgroundColor: 'var(--bg-page)',
    color: 'var(--text-main)',
    fontSize: '0.95rem',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    marginBottom: '1rem'
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando formularios...</div>;

  return (
    <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <UserPlus size={28} /> Nueva Inscripción Manual
      </h2>

      {status && (
        <div style={{ padding: '1.5rem', backgroundColor: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71', borderRadius: '12px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <CheckCircle size={24} /> <strong>{status}</strong> Redirigiendo al histórico...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', position: 'relative', zIndex: 2 }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>1. Selección de Estudiante</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={isNewStudent} 
                onChange={() => setIsNewStudent(!isNewStudent)}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontWeight: '600' }}>Registrar como estudiante nuevo</span>
            </label>
          </div>

          {isNewStudent ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>Nombre Completo</label>
                <input required style={inputStyle} value={formData.nuevo_estudiante.nombre_completo} onChange={e => setFormData({...formData, nuevo_estudiante: {...formData.nuevo_estudiante, nombre_completo: e.target.value}})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>Correo</label>
                <input required type="email" style={inputStyle} value={formData.nuevo_estudiante.correo} onChange={e => setFormData({...formData, nuevo_estudiante: {...formData.nuevo_estudiante, correo: e.target.value}})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>Carnet de Identidad (CI)</label>
                <input required style={inputStyle} value={formData.nuevo_estudiante.ci} onChange={e => setFormData({...formData, nuevo_estudiante: {...formData.nuevo_estudiante, ci: e.target.value}})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>F. Nacimiento</label>
                <input required type="date" style={inputStyle} value={formData.nuevo_estudiante.fecha_nacimiento} onChange={e => setFormData({...formData, nuevo_estudiante: {...formData.nuevo_estudiante, fecha_nacimiento: e.target.value}})} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>Departamento</label>
                <select required style={inputStyle} value={formData.nuevo_estudiante.departamento_id} onChange={e => setFormData({...formData, nuevo_estudiante: {...formData.nuevo_estudiante, departamento_id: e.target.value}})}>
                  <option value="">Seleccionar...</option>
                  {utils.departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>Grado Académico</label>
                <select required style={inputStyle} value={formData.nuevo_estudiante.grado_academico_id} onChange={e => setFormData({...formData, nuevo_estudiante: {...formData.nuevo_estudiante, grado_academico_id: e.target.value}})}>
                  <option value="">Seleccionar...</option>
                  {utils.grados_academicos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div ref={searchContainerRef} style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.6rem', color: 'var(--text-main)' }}>
                Seleccionar Estudiante Existente
              </label>
              
              {formData.usuario_id ? (
                // Estudiante seleccionado
                (() => {
                  const selectedEst = estudiantes.find(e => e.id.toString() === formData.usuario_id.toString());
                  if (!selectedEst) return null;
                  return (
                    <div 
                      className="glass-panel fade-in" 
                      style={{ 
                        padding: '1.2rem', 
                        borderLeft: '4px solid var(--color-primary)', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        backgroundColor: 'rgba(127, 43, 128, 0.04)',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 15px var(--glass-shadow)',
                        gap: '1rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div 
                          style={{ 
                            width: '45px', 
                            height: '45px', 
                            borderRadius: '50%', 
                            backgroundColor: 'var(--color-primary)', 
                            color: 'white', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontWeight: 'bold',
                            fontSize: '1.2rem',
                            boxShadow: '0 2px 8px var(--glass-shadow)'
                          }}
                        >
                          {selectedEst.nombre ? selectedEst.nombre.charAt(0).toUpperCase() : 'E'}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '1.1rem', fontWeight: '700' }}>
                            {selectedEst.nombre}
                          </h4>
                          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              <strong>Correo:</strong> {selectedEst.correo}
                            </span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              <strong>CI:</strong> {selectedEst.ci || 'N/D'}
                            </span>
                            {selectedEst.telefono && (
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                <strong>Teléfono:</strong> {selectedEst.telefono}
                              </span>
                            )}
                            {selectedEst.departamento && (
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                <strong>Depto:</strong> {selectedEst.departamento}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, usuario_id: '' });
                          setSearchTerm('');
                        }}
                        style={{
                          padding: '0.5rem 1.2rem',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(231, 76, 60, 0.1)',
                          border: '1px solid rgba(231, 76, 60, 0.2)',
                          color: '#e74c3c',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          transition: 'all 0.2s ease',
                          outline: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = '#e74c3c';
                          e.currentTarget.style.color = 'white';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
                          e.currentTarget.style.color = '#e74c3c';
                          e.currentTarget.style.transform = 'none';
                        }}
                      >
                        <X size={14} /> Cambiar Estudiante
                      </button>
                    </div>
                  );
                })()
              ) : (
                // Buscador interactivo
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '100%' }}>
                    <Search 
                      size={18} 
                      style={{ 
                        position: 'absolute', 
                        left: '12px', 
                        color: 'var(--color-primary)', 
                        opacity: 0.7 
                      }} 
                    />
                    <input
                      type="text"
                      placeholder="Escriba nombre completo, CI, correo o celular del estudiante..."
                      style={{ 
                        ...inputStyle, 
                        paddingLeft: '2.5rem', 
                        paddingRight: searchTerm ? '2.5rem' : '1rem',
                        marginBottom: 0,
                        border: showDropdown && searchTerm ? '1px solid var(--color-primary)' : '1px solid var(--glass-border)',
                        boxShadow: showDropdown && searchTerm ? '0 0 0 3px rgba(127, 43, 128, 0.15)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                      value={searchTerm}
                      onChange={e => {
                        setSearchTerm(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  
                  {/* Dropdown de resultados (en flujo para no solapar) */}
                  {showDropdown && searchTerm && (
                    <div
                      className="glass-panel"
                      style={{
                        position: 'relative',
                        marginTop: '0.5rem',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        border: '1px solid var(--glass-border)',
                        backgroundColor: 'var(--panel-bg)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        borderRadius: '10px',
                        padding: '0.4rem 0'
                      }}
                    >
                      {(() => {
                        const term = searchTerm.toLowerCase().trim();
                        const filtered = estudiantes.filter(est => {
                          return (
                            (est.nombre && est.nombre.toLowerCase().includes(term)) ||
                            (est.ci && est.ci.toLowerCase().includes(term)) ||
                            (est.correo && est.correo.toLowerCase().includes(term)) ||
                            (est.telefono && est.telefono.toLowerCase().includes(term))
                          );
                        });

                        if (filtered.length > 0) {
                          return filtered.map(est => (
                            <div
                              key={est.id}
                              onClick={() => {
                                setFormData({ ...formData, usuario_id: est.id.toString() });
                                setSearchTerm('');
                                setShowDropdown(false);
                              }}
                              style={{
                                padding: '0.8rem 1.2rem',
                                borderBottom: '1px solid var(--glass-border)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '1rem'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor = 'rgba(127, 43, 128, 0.08)';
                                e.currentTarget.style.paddingLeft = '1.5rem';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.paddingLeft = '1.2rem';
                              }}
                            >
                              <div>
                                <strong style={{ display: 'block', color: 'var(--color-primary-dark)', fontSize: '0.95rem' }}>
                                  {est.nombre}
                                </strong>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.1rem' }}>
                                  {est.correo}
                                </span>
                              </div>
                              <div style={{ textAlign: 'right', minWidth: '90px' }}>
                                <span 
                                  style={{ 
                                    fontSize: '0.8rem', 
                                    fontWeight: '700', 
                                    display: 'inline-block', 
                                    color: 'var(--color-accent)',
                                    backgroundColor: 'rgba(3, 143, 186, 0.08)',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(3, 143, 186, 0.15)'
                                  }}
                                >
                                  CI: {est.ci || 'N/D'}
                                </span>
                                {est.telefono && (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                                    Tel: {est.telefono}
                                  </span>
                                )}
                              </div>
                            </div>
                          ));
                        } else {
                          return (
                            <div 
                              style={{ 
                                padding: '2rem 1rem', 
                                textAlign: 'center', 
                                color: 'var(--text-muted)',
                                fontSize: '0.9rem' 
                              }}
                            >
                              No se encontraron estudiantes para <strong style={{ color: 'var(--color-primary)' }}>"{searchTerm}"</strong>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}
                  
                  {/* Consejo informativo cuando la barra de búsqueda está vacía y se enfoca */}
                  {showDropdown && !searchTerm && (
                    <div
                      className="glass-panel"
                      style={{
                        position: 'relative',
                        marginTop: '0.5rem',
                        padding: '1rem',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                        border: '1px solid var(--glass-border)',
                        backgroundColor: 'var(--panel-bg)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Info size={14} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                      <span>Escriba para buscar por <strong>Nombre</strong>, <strong>Carnet de Identidad (CI)</strong>, <strong>Correo Electrónico</strong> o <strong>Celular</strong>.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>2. Detalles del Programa e Inscripción</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>
                <BookOpen size={14} /> Programa Académico (Activos)
              </label>
              <select 
                required 
                style={inputStyle} 
                value={formData.programa_id} 
                onChange={e => {
                  const prog = programas.find(p => p.id === parseInt(e.target.value));
                  setFormData({
                    ...formData, 
                    programa_id: e.target.value,
                    costo_pagado: prog ? prog.costo : ''
                  });
                }}
              >
                <option value="">Seleccionar curso o diplomado...</option>
                {programas.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.tipo})</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>
                <DollarSign size={14} /> Costo Pagado (Bs.)
              </label>
              <input required type="number" step="0.01" style={inputStyle} value={formData.costo_pagado} onChange={e => setFormData({...formData, costo_pagado: e.target.value})} />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>
                <Calendar size={14} /> Fecha de Inscripción
              </label>
              <input required type="date" style={inputStyle} value={formData.fecha_inscripcion} onChange={e => setFormData({...formData, fecha_inscripcion: e.target.value})} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>Estado de Inscripción</label>
              <select required style={inputStyle} value={formData.estado_id} onChange={e => setFormData({...formData, estado_id: e.target.value})}>
                <option value="">Seleccionar...</option>
                {utils.estados_inscripcion.map(es => <option key={es.id} value={es.id}>{es.nombre}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>Origen de Captación</label>
              <select required style={inputStyle} value={formData.origen_id} onChange={e => setFormData({...formData, origen_id: e.target.value})}>
                <option value="">Seleccionar...</option>
                {utils.origenes.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate('/dashboard/inscripciones')}
            style={{ padding: '0.8rem 2rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'none', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '0.8rem 3rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              fontWeight: 'bold',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {submitting ? 'Procesando...' : <><UserCheck size={20} /> Completar Inscripción</>}
          </button>
        </div>
      </form>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(52, 152, 219, 0.05)', borderRadius: '8px', display: 'flex', gap: '1rem' }}>
        <Info color="var(--color-primary)" size={20} />
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          Este formulario registra una venta manual. Si el estudiante es nuevo, se le creará una cuenta automáticamente usando su **Carnet de Identidad (CI)** como contraseña por defecto para su primer inicio de sesión.
        </p>
      </div>
    </div>
  );
};

export default NuevaInscripcion;
