import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../api';
import { PlusCircle, Trash2, List, ArrowLeft, CheckCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GestorBeneficios = () => {
  const [beneficios, setBeneficios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const loadBeneficios = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/admin/utils/catalogos');
      setBeneficios(res.beneficios);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBeneficios();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      await fetchApi('/admin/beneficios', {
        method: 'POST',
        body: JSON.stringify({ nombre: newName })
      });
      setNewName('');
      loadBeneficios();
      setStatus('Beneficio añadido con éxito');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Seguro que quieres quitar "${nombre}"? Ya no aparecerá en el formulario de programas.`)) return;

    try {
      await fetchApi(`/admin/beneficios/${id}`, {
        method: 'DELETE'
      });
      loadBeneficios();
      setStatus('Beneficio eliminado con éxito');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      alert("Error: " + err.message);
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
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => navigate('/dashboard')} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ color: 'var(--color-primary-dark)', margin: 0 }}>Gestión de Catálogo: Beneficios</h2>
      </div>

      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Administra los beneficios que pueden asignarse a los programas académicos. 
        Los cambios aquí afectan instantáneamente a los formularios de creación y edición.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Formulario de Adición */}
        <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            <PlusCircle size={20} color="var(--color-accent)" /> Nuevo Beneficio
          </h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Nombre del Beneficio
              </label>
              <input
                required
                placeholder="Ej. Sesiones de Coaching 1 a 1"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={inputStyle}
              />
            </div>
            <button
              type="submit"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                padding: '0.8rem',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
            >
              Añadir al Catálogo
            </button>
            {status && (
              <div style={{ 
                padding: '0.8rem', 
                borderRadius: '6px', 
                backgroundColor: 'rgba(46, 204, 113, 0.1)', 
                color: '#2ecc71', 
                fontSize: '0.9rem', 
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <CheckCircle size={16} /> {status}
              </div>
            )}
          </form>
        </div>

        {/* Lista de Beneficios */}
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <List size={20} color="var(--color-primary)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Beneficios Existentes</h3>
          </div>
          
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando beneficios...</div>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {beneficios.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay beneficios registrados en el catálogo.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {beneficios.map((b, idx) => (
                      <tr key={b.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background-color 0.2s' }}>
                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-main)', fontWeight: '500' }}>
                          {b.nombre}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                          <button
                            onClick={() => handleDelete(b.id, b.nombre)}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              cursor: 'pointer', 
                              color: '#e74c3c', 
                              opacity: 0.6,
                              transition: 'opacity 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                            title="Eliminar del catálogo"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
          
          <div style={{ padding: '1rem 1.5rem', backgroundColor: 'rgba(52, 152, 219, 0.05)', display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
            <Info size={16} color="var(--color-primary)" style={{ marginTop: '0.2rem' }} />
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              Nota: El borrado es físico. Al eliminar un beneficio del catálogo, este desaparecerá de todos los programas a los que esté asignado para mantener la integridad de la oferta actual.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestorBeneficios;
