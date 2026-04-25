import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../api';

const GestorProgramas = () => {
  const [programas, setProgramas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [formData, setFormData] = useState({
    nombre: '',
    costo: '',
    categoria_id: '',
    tipo_servicio_id: '',
    descripcion: '',
    activo: true
  });
  const [imagen, setImagen] = useState(null);
  const [status, setStatus] = useState('');
  const [editId, setEditId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const pRes = await fetchApi('/admin/programas/all');
      setProgramas(pRes);
      
      const cRes = await fetchApi('/admin/utils/catalogos');
      setCategorias(cRes.categorias);
      setTipos(cRes.tipos_servicio);
    } catch(e) {
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
    setStatus(editId ? 'Actualizando programa...' : 'Publicando programa...');
    
    const data = new FormData();
    for (const key in formData) {
      data.append(key, formData[key]);
    }
    if (imagen) {
      data.append('imagen', imagen);
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') + (import.meta.env.VITE_API_URL.endsWith('/api') ? '' : '/api') : 'http://localhost:5000/api';
      
      const endpoint = editId ? `/admin/programas/${editId}` : `/admin/programas`;
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: method,
        body: data,
        credentials: 'include'
      });
      
      if(!res.ok) throw new Error("Error en la operación del programa");
      
      setStatus(editId ? '¡Actualizado con éxito!' : '¡Programa guardado! Actualizando catálogo...');
      cancelEdit();
      loadData();
      setTimeout(() => setStatus(''), 3000);
    } catch(err) {
      setStatus('Error: ' + err.message);
    }
  };

  const startEdit = (p) => {
    setEditId(p.id);
    const cat = categorias.find(c => c.nombre === p.categoria)?.id || '';
    const tip = tipos.find(t => t.nombre === p.tipo)?.id || '';
    
    setFormData({
      nombre: p.nombre,
      costo: p.costo,
      categoria_id: cat,
      tipo_servicio_id: tip,
      descripcion: p.descripcion || '',
      activo: p.activo
    });
    setImagen(null);
    setStatus('Modo edición activado.');
  };

  const cancelEdit = () => {
    setEditId(null);
    setFormData({ nombre: '', costo: '', categoria_id: '', tipo_servicio_id: '', descripcion: '', activo: true });
    setImagen(null);
    setStatus('');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: 'var(--color-primary-dark)' }}>Gestión de Programas Académicos</h2>
        <button onClick={cancelEdit} style={{ backgroundColor: 'var(--color-primary)', padding: '0.5rem 1rem' }}>
          + Añadir Nuevo Programa
        </button>
      </div>
      <p style={{ color: '#666', marginBottom: '2rem' }}>Añade Cursos y Diplomados. Serán expuestos instantáneamente en la Landing Pública y servirán de nodo para inferencias futuras de la IA.</p>
      
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {/* Formulario Lateral */}
        <div className="glass-panel" style={{ flex: '1 1 300px', padding: '2rem', backgroundColor: editId ? '#f0f4ff' : 'white', transition: '0.3s' }}>
          <h3 style={{ marginTop: 0, color: editId ? 'var(--color-primary)' : 'inherit' }}>
            {editId ? `Editar Programa #${editId}` : 'Crear Nuevo'}
          </h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              required
              placeholder="Nombre del Programa (Ej. PSICOMETRÍA)"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <select required value={formData.categoria_id} onChange={(e) => setFormData({...formData, categoria_id: e.target.value})} style={{ padding: '0.8rem', flex: 1 }}>
                <option value="">-- Categoría --</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              
              <select required value={formData.tipo_servicio_id} onChange={(e) => setFormData({...formData, tipo_servicio_id: e.target.value})} style={{ padding: '0.8rem', flex: 1 }}>
                <option value="">-- Tipo --</option>
                {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            
            <input 
              required
              type="number"
              placeholder="Costo Oficial en Bs."
              value={formData.costo}
              onChange={(e) => setFormData({...formData, costo: e.target.value})}
              style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            
            <textarea 
              placeholder="Descripción breve para la Landing Page..."
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #ccc', minHeight: '80px', fontFamily: 'inherit' }}
            />

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#333' }}>
              <input 
                type="checkbox" 
                checked={formData.activo}
                onChange={(e) => setFormData({...formData, activo: e.target.checked})}
              />
              Visible al Público
            </label>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: '#555', marginBottom: '0.5rem' }}>Imagen de Referencia Opcional</label>
              <input type="file" accept="image/*" onChange={(e) => setImagen(e.target.files[0])} style={{ width: '100%' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ backgroundColor: 'var(--color-primary)', marginTop: '1rem', flex: 2 }}>{editId ? 'Guardar Cambios' : 'Publicar Programa'}</button>
              {editId && <button type="button" onClick={cancelEdit} style={{ backgroundColor: '#aaa', marginTop: '1rem', flex: 1 }}>Cancelar</button>}
            </div>
            {status && <p style={{ fontSize: '0.9rem', color: status.includes('Error') ? 'red' : 'green' }}>{status}</p>}
          </form>
        </div>

        {/* Grilla de Programas */}
        <div style={{ flex: '2 1 500px' }}>
          {loading ? <p>Cargando programas...</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {programas.map((p, idx) => (
                <div key={idx} style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'white', position: 'relative', opacity: p.activo ? 1 : 0.65 }}>
                  <div style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', color: 'white', backgroundColor: p.activo ? '#4caf50' : '#f44336' }}>
                    {p.activo ? 'ACTIVO' : 'OCULTO'}
                  </div>
                  <div style={{ height: '120px', backgroundColor: '#f4f6f8', backgroundImage: p.imagen_url ? `url('http://localhost:5000${p.imagen_url}')` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    {!p.imagen_url && <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.8rem' }}>Sin Imagen</div>}
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-accent)', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{p.tipo} • {p.categoria}</span>
                      <button onClick={() => startEdit(p)} style={{ padding: '2px 8px', fontSize: '0.7rem', backgroundColor: 'var(--color-primary-dark)' }}>Editar</button>
                    </div>
                    <h4 style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>{p.nombre}</h4>
                    <span style={{ fontSize: '0.9rem', color: '#555' }}>{p.costo} Bs.</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GestorProgramas;
