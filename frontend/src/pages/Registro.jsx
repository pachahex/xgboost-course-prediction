import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchApi } from '../api';

const Registro = () => {
  const [formData, setFormData] = useState({ 
    nombre_completo: '', correo: '', password: '', 
    telefono: '', fecha_nacimiento: '', ocupacion: '', departamento_id: '' 
  });
  const [departamentos, setDepartamentos] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchApi('/departamentos')
      .then(res => setDepartamentos(res))
      .catch(err => console.error("Error al cargar departamentos:", err));
  }, []);

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const res = await fetchApi('/registro', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      setSuccess(res.message);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.message || 'Error al registrar.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const containerStyle = {
    minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
    position: 'relative', overflow: 'hidden', padding: '2rem'
  };

  const formStyle = { display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' };
  const inputStyle = { padding: '1rem', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.9)', fontSize: '1rem', outline: 'none', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={containerStyle}>
      <div className="glass-panel-dark" style={{ padding: '3rem', width: '100%', maxWidth: '400px', zIndex: 10 }}>
        <h2 style={{ textAlign: 'center', color: 'white', marginBottom: '1rem', fontSize: '2rem' }}>Crear Cuenta</h2>
        <p style={{ textAlign: 'center', color: '#ccc', marginBottom: '2rem' }}>Únete como estudiante</p>
        
        {error && <div style={{ backgroundColor: 'rgba(231, 76, 60, 0.2)', color: '#ffb8b8', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        {success && <div style={{ backgroundColor: 'rgba(46, 204, 113, 0.2)', color: '#a8ffc4', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>{success}</div>}
        
        <form onSubmit={handleRegistro} style={formStyle}>
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color: '#ddd'}}>Nombre Completo</label>
            <input type="text" name="nombre_completo" value={formData.nombre_completo} onChange={handleChange} required style={inputStyle} placeholder="Ej. Juan Pérez" />
          </div>
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color: '#ddd'}}>Correo Electrónico</label>
            <input type="email" name="correo" value={formData.correo} onChange={handleChange} required style={inputStyle} placeholder="tu@correo.com" />
          </div>
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color: '#ddd'}}>Contraseña</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required style={inputStyle} placeholder="••••••••" />
          </div>
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color: '#ddd'}}>Teléfono</label>
            <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} style={inputStyle} placeholder="Ej. 70012345" />
          </div>
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color: '#ddd'}}>Fecha de Nacimiento</label>
            <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color: '#ddd'}}>Ocupación</label>
            <select name="ocupacion" value={formData.ocupacion} onChange={handleChange} style={inputStyle}>
              <option value="">Seleccione su ocupación...</option>
              <option value="Estudiante Universitario">Estudiante Universitario</option>
              <option value="Egresado">Egresado</option>
              <option value="Profesional Junior">Profesional Junior</option>
              <option value="Profesional Senior">Profesional Senior</option>
              <option value="Independiente">Independiente</option>
            </select>
          </div>
          <div>
            <label style={{display:'block', marginBottom:'0.5rem', color: '#ddd'}}>Departamento</label>
            <select name="departamento_id" value={formData.departamento_id} onChange={handleChange} required style={inputStyle}>
              <option value="">Seleccione un departamento...</option>
              {departamentos.map(dep => (
                <option key={dep.id} value={dep.id}>{dep.nombre}</option>
              ))}
            </select>
          </div>
          
          <button type="submit" disabled={loading} style={{ backgroundColor: 'var(--color-accent)', color: 'white', fontWeight: 'bold', padding: '1rem', fontSize: '1.1rem', marginTop: '1rem', opacity: loading ? 0.7 : 1, border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#ccc' }}>
          ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--color-accent)' }}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
};

export default Registro;
