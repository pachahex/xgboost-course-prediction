import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../api';
import { UserPlus, BookOpen, DollarSign, Calendar, Info, CheckCircle, UserCheck } from 'lucide-react';
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
      password: 'estudiante123',
      fecha_nacimiento: '',
      departamento_id: '',
      grado_academico_id: ''
    }
  });

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

      // 1. Si es nuevo estudiante, registrarlo primero
      if (isNewStudent) {
        const regRes = await fetchApi('/registro', {
          method: 'POST',
          body: JSON.stringify(formData.nuevo_estudiante)
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
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
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
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>Seleccionar Estudiante Existente</label>
              <select required style={inputStyle} value={formData.usuario_id} onChange={e => setFormData({...formData, usuario_id: e.target.value})}>
                <option value="">Buscar estudiante...</option>
                {estudiantes.map(e => <option key={e.id} value={e.id}>{e.nombre} ({e.correo})</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
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
          Este formulario registra una venta manual. Si el estudiante es nuevo, se le creará una cuenta automáticamente con la contraseña por defecto <code>estudiante123</code>. El sistema enviará un correo de bienvenida si las notificaciones están activas.
        </p>
      </div>
    </div>
  );
};

export default NuevaInscripcion;
