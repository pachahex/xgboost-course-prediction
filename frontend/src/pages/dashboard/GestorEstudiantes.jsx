import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../api';
import { Users, Search, PlusCircle, Save, XCircle, CheckCircle } from 'lucide-react';

const GestorEstudiantes = () => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [grados, setGrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre_completo: '', correo: '', ci: '', telefono: '',
    fecha_nacimiento: '', departamento_id: '', grado_academico_id: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [estRes, depRes, graRes] = await Promise.all([
        fetchApi('/admin/estudiantes'),
        fetchApi('/departamentos'),
        fetchApi('/grados-academicos')
      ]);
      setEstudiantes(estRes);
      setDepartamentos(depRes);
      setGrados(graRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setStatus('');
    
    try {
      await fetchApi('/admin/estudiantes', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      setStatus('Estudiante registrado exitosamente. Su CI es su contraseña temporal.');
      setFormData({
        nombre_completo: '', correo: '', ci: '', telefono: '',
        fecha_nacimiento: '', departamento_id: '', grado_academico_id: ''
      });
      loadData();
      setTimeout(() => {
        setStatus('');
        setShowForm(false);
      }, 4000);
    } catch (err) {
      setStatus('Error: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const filteredEstudiantes = estudiantes.filter(e => 
    e.nombre.toLowerCase().includes(search.toLowerCase()) || 
    (e.ci && e.ci.includes(search)) ||
    e.correo.toLowerCase().includes(search.toLowerCase())
  );

  const inputStyle = {
    padding: '0.8rem',
    borderRadius: '6px',
    border: '1px solid var(--glass-border)',
    backgroundColor: 'var(--bg-page)',
    color: 'var(--text-main)',
    width: '100%',
    boxSizing: 'border-box'
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={24} /> Registro de Estudiantes
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>Administra la base histórica y registra nuevos alumnos.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            padding: '0.6rem 1.2rem',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 'bold'
          }}
        >
          {showForm ? <XCircle size={18} /> : <PlusCircle size={18} />}
          {showForm ? 'Cancelar Registro' : 'Registrar Estudiante'}
        </button>
      </div>

      {showForm && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid var(--color-primary)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Registrar Nuevo Estudiante</h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>Nombre Completo *</label>
              <input type="text" value={formData.nombre_completo} onChange={e => setFormData({...formData, nombre_completo: e.target.value})} required style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>Cédula de Identidad *</label>
              <input type="text" value={formData.ci} onChange={e => setFormData({...formData, ci: e.target.value})} required style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>Correo Electrónico *</label>
              <input type="email" value={formData.correo} onChange={e => setFormData({...formData, correo: e.target.value})} required style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>Teléfono</label>
              <input type="text" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>Fecha de Nacimiento *</label>
              <input type="date" value={formData.fecha_nacimiento} onChange={e => setFormData({...formData, fecha_nacimiento: e.target.value})} required style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>Departamento *</label>
              <select value={formData.departamento_id} onChange={e => setFormData({...formData, departamento_id: e.target.value})} required style={inputStyle}>
                <option value="">Seleccionar...</option>
                {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>Grado Académico *</label>
              <select value={formData.grado_academico_id} onChange={e => setFormData({...formData, grado_academico_id: e.target.value})} required style={inputStyle}>
                <option value="">Seleccionar...</option>
                {grados.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" disabled={formLoading} style={{
                backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '6px', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold'
              }}>
                {formLoading ? 'Registrando...' : <><Save size={18} /> Registrar y Asignar Password</>}
              </button>
            </div>
          </form>
          {status && (
            <div style={{ marginTop: '1rem', padding: '0.8rem', borderRadius: '6px', backgroundColor: status.includes('Error') ? 'rgba(231, 76, 60, 0.1)' : 'rgba(46, 204, 113, 0.1)', color: status.includes('Error') ? '#e74c3c' : '#2ecc71', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {!status.includes('Error') && <CheckCircle size={18} />} {status}
            </div>
          )}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, CI o correo..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            style={{ ...inputStyle, paddingLeft: '2.5rem' }} 
          />
        </div>

        {loading ? <p>Cargando estudiantes...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.02)', borderBottom: '2px solid var(--glass-border)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem' }}>CI</th>
                  <th style={{ padding: '1rem' }}>Nombre Completo</th>
                  <th style={{ padding: '1rem' }}>Correo</th>
                  <th style={{ padding: '1rem' }}>Teléfono</th>
                  <th style={{ padding: '1rem' }}>Grado</th>
                  <th style={{ padding: '1rem' }}>Departamento</th>
                </tr>
              </thead>
              <tbody>
                {filteredEstudiantes.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{e.ci || '-'}</td>
                    <td style={{ padding: '1rem' }}>{e.nombre}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{e.correo}</td>
                    <td style={{ padding: '1rem' }}>{e.telefono || '-'}</td>
                    <td style={{ padding: '1rem' }}>{e.grado || '-'}</td>
                    <td style={{ padding: '1rem' }}>{e.departamento || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredEstudiantes.length === 0 && (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No se encontraron registros.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GestorEstudiantes;
