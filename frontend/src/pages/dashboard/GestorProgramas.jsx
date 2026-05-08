import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../api';
import { PlusCircle, Pencil, Save, XCircle, Trash2, CheckCircle, Eye, EyeOff, LayoutGrid, List, Search, Filter } from 'lucide-react';

const GestorProgramas = () => {
  const [programas, setProgramas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [beneficios, setBeneficios] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI & Filter State
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showForm, setShowForm] = useState(true); // Toggle for side panel
  const [filters, setFilters] = useState({
    search: '',
    categoria: '',
    modalidad: '',
    activo: 'all'
  });

  // Form State
  const [formData, setFormData] = useState({
    nombre: '',
    costo: '',
    categoria_id: '',
    tipo_servicio_id: '',
    modalidad_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    duracion_horas: '',
    descripcion: '',
    activo: false,
    'beneficios[]': [] // Array para IDs de beneficios
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
      setModalidades(cRes.modalidades);
      setBeneficios(cRes.beneficios);
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
    setStatus(editId ? 'Actualizando programa...' : 'Publicando programa...');

    const data = new FormData();
    for (const key in formData) {
      if (key === 'beneficios[]') {
        formData[key].forEach(val => data.append(key, val));
      } else {
        data.append(key, formData[key]);
      }
    }
    if (imagen) {
      data.append('imagen', imagen);
    }

    try {
      const endpoint = editId ? `/admin/programas/${editId}` : `/admin/programas`;
      const method = editId ? 'PUT' : 'POST';

      await fetchApi(endpoint, {
        method: method,
        body: data
      });

      setStatus(editId ? '¡Actualizado con éxito!' : '¡Programa guardado! Actualizando catálogo...');
      cancelEdit();
      loadData();
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
  };

  const startEdit = (p) => {
    setEditId(p.id);
    setShowForm(true); // Mostrar el formulario automáticamente al editar
    const cat = categorias.find(c => c.nombre === p.categoria)?.id || '';
    const tip = tipos.find(t => t.nombre === p.tipo)?.id || '';
    const mod = modalidades.find(m => m.nombre === p.modalidad)?.id || '';

    setFormData({
      nombre: p.nombre,
      costo: p.costo,
      categoria_id: cat,
      tipo_servicio_id: tip,
      modalidad_id: mod,
      fecha_inicio: p.fecha_inicio || '',
      fecha_fin: p.fecha_fin || '',
      duracion_horas: p.duracion_horas || '',
      descripcion: p.descripcion || '',
      activo: p.activo,
      'beneficios[]': p.beneficios_ids || []
    });
    setImagen(null);
    setStatus('Modo edición activado.');
  };

  const cancelEdit = () => {
    setEditId(null);
    setFormData({
      nombre: '', costo: '', categoria_id: '', tipo_servicio_id: '', modalidad_id: '',
      fecha_inicio: '', fecha_fin: '', duracion_horas: '',
      descripcion: '', activo: false, 'beneficios[]': []
    });
    setImagen(null);
    setStatus('');
  };

  const handleToggleActive = async (p) => {
    const confirmMsg = p.activo
      ? `¿Estás seguro de ocultar "${p.nombre}"? No aparecerá en la web pero los datos se conservarán para la IA.`
      : `¿Activar "${p.nombre}"? Volverá a ser visible al público.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await fetchApi(`/admin/programas/${p.id}/toggle-status`, {
        method: 'PATCH'
      });
      loadData();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`¿Quieres eliminar "${p.nombre}" del sistema? Ya no aparecerá en este panel ni en la web.`)) return;

    try {
      await fetchApi(`/admin/programas/${p.id}`, {
        method: 'DELETE'
      });
      
      loadData();
      setStatus(`Programa "${p.nombre}" eliminado.`);
      setTimeout(() => setStatus(''), 3000);
    } catch(err) {
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
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
    marginBottom: '0.4rem',
  };

  // Filter Logic
  const filteredProgramas = programas.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCat = filters.categoria === '' || p.categoria === filters.categoria;
    const matchesMod = filters.modalidad === '' || p.modalidad === filters.modalidad;
    const matchesStatus = filters.activo === 'all' || (filters.activo === 'active' ? p.activo : !p.activo);

    return matchesSearch && matchesCat && matchesMod && matchesStatus;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ color: 'var(--color-primary-dark)', margin: 0 }}>Gestión de Programas Académicos</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              backgroundColor: 'var(--bg-page)',
              color: 'var(--color-primary-dark)',
              padding: '0.6rem 1.2rem',
              borderRadius: '6px',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {showForm ? <EyeOff size={18} /> : <Eye size={18} />}
            {showForm ? 'Esconder Formulario' : 'Mostrar Formulario'}
          </button>
          <button
            onClick={() => {
              cancelEdit();
              setShowForm(true);
            }}
            style={{
              backgroundColor: 'var(--color-primary)',
              padding: '0.6rem 1.2rem',
              borderRadius: '6px',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <PlusCircle size={18} /> Añadir Nuevo Programa
          </button>
        </div>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Añade Cursos y Diplomados. Serán expuestos instantáneamente en la Landing Pública y servirán de nodo para inferencias futuras de la IA.</p>

      {/* Control Bar: Search & View Toggle */}
      <div className="glass-panel" style={{
        padding: '1rem 1.5rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        flexWrap: 'wrap',
        backgroundColor: 'var(--panel-bg)',
        border: '1px solid var(--glass-border)'
      }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre del programa..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ ...inputStyle, paddingLeft: '2.5rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', flex: '1 1 auto' }}>
          <select
            value={filters.categoria}
            onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}
            style={{ ...inputStyle, width: 'auto', minWidth: '150px' }}
          >
            <option value="">Todas las Categorías</option>
            {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
          </select>

          <select
            value={filters.modalidad}
            onChange={(e) => setFilters({ ...filters, modalidad: e.target.value })}
            style={{ ...inputStyle, width: 'auto', minWidth: '150px' }}
          >
            <option value="">Todas las Modalidades</option>
            {modalidades.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
          </select>

          <select
            value={filters.activo}
            onChange={(e) => setFilters({ ...filters, activo: e.target.value })}
            style={{ ...inputStyle, width: 'auto' }}
          >
            <option value="all">Todos los Estados</option>
            <option value="active">Solo Activos</option>
            <option value="inactive">Solo Ocultos</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', borderLeft: '1px solid var(--glass-border)', paddingLeft: '1.5rem' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '0.6rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: viewMode === 'grid' ? 'var(--color-accent)' : 'transparent',
              color: viewMode === 'grid' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex'
            }}
            title="Vista de Cuadrícula"
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '0.6rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: viewMode === 'list' ? 'var(--color-accent)' : 'transparent',
              color: viewMode === 'list' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex'
            }}
            title="Vista de Lista"
          >
            <List size={20} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {/* Formulario Lateral */}
        {showForm && (
          <div className="glass-panel" style={{
            flex: '1 1 350px',
            padding: '1.5rem',
            backgroundColor: editId ? 'rgba(52, 152, 219, 0.08)' : 'var(--panel-bg)',
            border: editId ? '2px solid var(--color-accent)' : '1px solid var(--glass-border)',
            transition: '0.3s',
            position: 'sticky',
            top: '20px',
            alignSelf: 'flex-start',
            zIndex: 10,
            boxShadow: editId ? '0 8px 32px rgba(52, 152, 219, 0.2)' : 'none',
            maxHeight: 'calc(100vh - 40px)',
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--color-accent) transparent'
          }}>
            <h3 style={{
              marginTop: 0,
              marginBottom: '1rem',
              color: editId ? 'var(--color-primary)' : 'var(--text-main)',
              borderBottom: '2px solid var(--glass-border)',
              paddingBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1.1rem'
            }}>
              {editId ? <><Pencil size={18} /> Editar Programa</> : <><PlusCircle size={18} /> Nuevo Programa</>}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={labelStyle}>Nombre del Programa</label>
                <input
                  required
                  placeholder="Ej. Diplomado en Psicometría"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Categoría</label>
                  <select required value={formData.categoria_id} onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })} style={inputStyle}>
                    <option value="">Selecciona...</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Tipo</label>
                  <select required value={formData.tipo_servicio_id} onChange={(e) => setFormData({ ...formData, tipo_servicio_id: e.target.value })} style={inputStyle}>
                    <option value="">Selecciona...</option>
                    {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Modalidad</label>
                <select required value={formData.modalidad_id} onChange={(e) => setFormData({ ...formData, modalidad_id: e.target.value })} style={inputStyle}>
                  <option value="">Selecciona modalidad...</option>
                  {modalidades.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Costo (Bs.)</label>
                  <input
                    required
                    type="number"
                    placeholder="Ej. 1500"
                    value={formData.costo}
                    onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Duración (Horas)</label>
                  <input 
                    type="number" 
                    placeholder="Ej. 40" 
                    value={formData.duracion_horas} 
                    onChange={(e) => setFormData({ ...formData, duracion_horas: e.target.value })} 
                    style={inputStyle} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Fecha Inicio</label>
                  <input type="date" value={formData.fecha_inicio} onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Fecha Fin</label>
                  <input type="date" value={formData.fecha_fin} onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Descripción Breve</label>
                <textarea
                  placeholder="Escribe una descripción atractiva para la Landing Page..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                />
              </div>

              <div style={{ border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '6px', backgroundColor: 'var(--bg-page)' }}>
                <label style={{ ...labelStyle, marginBottom: '0.8rem' }}>Beneficios Incluidos</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  {beneficios.map(b => (
                    <label key={b.id} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-main)' }}>
                      <input
                        type="checkbox"
                        checked={formData['beneficios[]'].includes(String(b.id)) || formData['beneficios[]'].includes(b.id)}
                        onChange={(e) => {
                          const current = formData['beneficios[]'];
                          const next = e.target.checked
                            ? [...current, b.id]
                            : current.filter(id => id !== b.id);
                          setFormData({ ...formData, 'beneficios[]': next });
                        }}
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                      />
                      {b.nombre}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Imagen de Referencia Opcional</label>
                <input type="file" accept="image/*" onChange={(e) => setImagen(e.target.files[0])} style={{ ...inputStyle, padding: '0.6rem' }} />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '0.5rem', fontWeight: '500' }}>
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                />
                Programa Visible al Público
              </label>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" style={{ backgroundColor: 'var(--color-primary)', color: 'white', padding: '1rem', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', flex: 2, transition: 'opacity 0.2s', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  {editId ? <><Save size={18} /> Guardar Cambios</> : <><Save size={18} /> Publicar Programa</>}
                </button>
                {editId && (
                  <button type="button" onClick={cancelEdit} style={{ backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', flex: 1, transition: 'background-color 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onMouseEnter={e => e.target.style.backgroundColor = 'var(--bg-page)'} onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}>
                    <XCircle size={18} /> Cancelar
                  </button>
                )}
              </div>
              {status && <div style={{ padding: '0.8rem', borderRadius: '6px', backgroundColor: status.includes('Error') ? 'rgba(231, 76, 60, 0.1)' : 'rgba(46, 204, 113, 0.1)', color: status.includes('Error') ? '#e74c3c' : '#2ecc71', fontSize: '0.9rem', textAlign: 'center', fontWeight: '500' }}>{status}</div>}
            </form>
          </div>
        )}

        {/* Grilla de Programas */}
        <div style={{ flex: '2 1 500px' }}>
          {loading ? <p>Cargando programas...</p> : (
            <>
              {viewMode === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {filteredProgramas.map((p, idx) => (
                    <div key={idx} style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'white', position: 'relative', opacity: p.activo ? 1 : 0.65 }}>
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        padding: '4px 8px',
                        borderRadius: '20px',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        color: 'white',
                        backgroundColor: p.activo ? 'var(--color-accent)' : '#95a5a6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        {p.activo ? <><CheckCircle size={10} /> ACTIVO</> : <><EyeOff size={10} /> OCULTO</>}
                      </div>
                      <div style={{ height: '120px', backgroundColor: '#f4f6f8', backgroundImage: p.imagen_url ? `url('http://localhost:5000${p.imagen_url}')` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                        {!p.imagen_url && <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.8rem' }}>Sin Imagen</div>}
                      </div>
                      <div style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{p.tipo} • {p.modalidad}</span>
                          <button
                            onClick={() => {
                              startEdit(p);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.7rem',
                              backgroundColor: 'var(--color-primary-dark)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Pencil size={12} /> Editar
                          </button>
                        </div>
                        <h4 style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>{p.nombre}</h4>
                        <span style={{ fontSize: '0.9rem', color: '#555' }}>{p.costo} Bs.</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-panel" style={{ overflowX: 'auto', padding: '0', backgroundColor: 'white' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid var(--glass-border)' }}>
                        <th style={{ padding: '1rem' }}>ID</th>
                        <th style={{ padding: '1rem' }}>Programa</th>
                        <th style={{ padding: '1rem' }}>Categoría</th>
                        <th style={{ padding: '1rem' }}>Tipo</th>
                        <th style={{ padding: '1rem' }}>Modalidad</th>
                        <th style={{ padding: '1rem' }}>Costo</th>
                        <th style={{ padding: '1rem' }}>Estado</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProgramas.map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #eee', opacity: p.activo ? 1 : 0.6 }}>
                          <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>#{p.id}</td>
                          <td style={{ padding: '1rem', fontWeight: '600' }}>{p.nombre}</td>
                          <td style={{ padding: '1rem' }}>{p.categoria}</td>
                          <td style={{ padding: '1rem' }}>{p.tipo}</td>
                          <td style={{ padding: '1rem' }}>{p.modalidad}</td>
                          <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.costo} Bs.</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '0.7rem',
                              backgroundColor: p.activo ? 'rgba(46, 204, 113, 0.1)' : 'rgba(149, 165, 166, 0.1)',
                              color: p.activo ? '#2ecc71' : '#95a5a6',
                              fontWeight: 'bold'
                            }}>
                              {p.activo ? 'ACTIVO' : 'OCULTO'}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => startEdit(p)}
                                style={{ padding: '0.5rem', borderRadius: '6px', border: 'none', backgroundColor: 'var(--bg-page)', cursor: 'pointer', color: 'var(--color-primary-dark)' }}
                                title="Editar"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(p)}
                                style={{
                                  padding: '0.5rem',
                                  borderRadius: '6px',
                                  border: 'none',
                                  backgroundColor: 'rgba(231, 76, 60, 0.05)',
                                  cursor: 'pointer',
                                  color: '#e74c3c',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Borrar del Sistema (Borrado Lógico)"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {filteredProgramas.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  <Search size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                  <p>No se encontraron programas que coincidan con los filtros.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GestorProgramas;
