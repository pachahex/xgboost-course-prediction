import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../api';
import { UserPlus, Users, Mail, UserCheck, Search } from 'lucide-react';

const GestorFacilitadores = () => {
  const [facilitadores, setFacilitadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState('');
  
  const [formData, setFormData] = useState({
    nombre_completo: '',
    correo: '',
    password: ''
  });

  const loadFacilitadores = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/admin/facilitadores');
      setFacilitadores(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacilitadores();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/admin/facilitadores', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setFormData({ nombre_completo: '', correo: '', password: '' });
      setShowForm(false);
      loadFacilitadores();
      setStatus('Facilitador registrado con éxito');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const filtered = facilitadores.filter(f => 
    f.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.correo.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ color: 'var(--color-primary-dark)', margin: 0 }}>Gestión de Facilitadores</h2>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>Administra el personal docente y facilitadores del sistema.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            backgroundColor: showForm ? 'var(--bg-page)' : 'var(--color-primary)',
            color: showForm ? 'var(--text-main)' : 'white',
            padding: '0.8rem 1.5rem',
            borderRadius: '8px',
            border: showForm ? '1px solid var(--glass-border)' : 'none',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: showForm ? 'none' : '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          {showForm ? 'Cancelar' : <><UserPlus size={18} /> Nuevo Facilitador</>}
        </button>
      </div>

      {status && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: 'rgba(46, 204, 113, 0.1)', 
          color: '#2ecc71', 
          borderRadius: '8px', 
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <UserCheck size={20} /> {status}
        </div>
      )}

      {showForm && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Registrar Nuevo Facilitador</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Nombre Completo</label>
              <input
                required
                style={inputStyle}
                value={formData.nombre_completo}
                onChange={e => setFormData({...formData, nombre_completo: e.target.value})}
                placeholder="Ej. Juan Pérez"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Correo Electrónico</label>
              <input
                required
                type="email"
                style={inputStyle}
                value={formData.correo}
                onChange={e => setFormData({...formData, correo: e.target.value})}
                placeholder="juan@facilitador.com"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Contraseña (Opcional)</label>
              <input
                type="password"
                style={inputStyle}
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="Por defecto: facilitador123"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '1rem' }}>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  backgroundColor: 'var(--color-accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Guardar Facilitador
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} color="var(--color-primary)" />
            <h3 style={{ margin: 0 }}>Personal Registrado</h3>
          </div>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar facilitador..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ ...inputStyle, marginBottom: 0, paddingLeft: '2.5rem' }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando facilitadores...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid var(--glass-border)' }}>Nombre</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid var(--glass-border)' }}>Contacto</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid var(--glass-border)' }}>Fecha Registro</th>
                  <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid var(--glass-border)' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron facilitadores.</td>
                  </tr>
                ) : (
                  filtered.map(f => (
                    <tr key={f.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background-color 0.2s' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{f.nombre}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                          <Mail size={14} /> {f.correo}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        {new Date(f.creado).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                          Ver Perfil
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestorFacilitadores;
