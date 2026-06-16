import React, { useState, useEffect, useMemo } from 'react';
import { fetchApi } from '../../api';
import { 
  Users, Search, PlusCircle, Save, CheckCircle, ArrowLeft,
  Calendar, Award, BookOpen, TrendingUp, Map, Filter
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#038fba', '#e74c3c', '#2ecc71', '#e67e22', '#9b59b6', '#34495e'];

const KpiCard = ({ title, value, icon, color }) => (
  <div className="glass-panel" style={{
    padding: '1.25rem',
    borderRadius: '10px',
    backgroundColor: 'var(--panel-bg)',
    border: '1px solid var(--glass-border)',
    boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flex: '1 1 200px',
    transition: 'transform 0.2s, box-shadow 0.2s'
  }}>
    <div style={{
      padding: '0.8rem',
      borderRadius: '8px',
      backgroundColor: `${color}15`,
      color: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {React.createElement(icon, { size: 24 })}
    </div>
    <div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
        {title}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
        {value}
      </div>
    </div>
  </div>
);

const GestorEstudiantes = () => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [grados, setGrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Stats Dashboard State
  const [statsTab, setStatsTab] = useState('catalogo'); // 'catalogo' or 'dashboard'
  const [statsYear, setStatsYear] = useState('all');
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');
  const [selectedDept, setSelectedDept] = useState(null);

  const [view, setView] = useState('list'); // 'list' or 'form'
  const [status, setStatus] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre_completo: '', correo: '', ci: '', telefono: '',
    fecha_nacimiento: '', departamento_id: '', grado_academico_id: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25; // Standard for lists according to CONTEXT.md

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

  const loadStats = async (year) => {
    setStatsLoading(true);
    setStatsError('');
    try {
      const query = year !== 'all' ? `?anio=${year}` : '';
      const res = await fetchApi(`/admin/estudiantes/stats${query}`);
      setStatsData(res);
    } catch (err) {
      console.error(err);
      setStatsError(err.message || 'Error al cargar estadísticas.');
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch Stats dynamically
  useEffect(() => {
    if (statsTab === 'dashboard') {
      loadStats(statsYear);
    }
  }, [statsTab, statsYear]);

  // Reset page when search or selectedDept filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedDept]);

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
        setView('list');
      }, 3000);
    } catch (err) {
      setStatus('Error: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Helpers
  const cleanName = (name) => {
    return name ? name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : '';
  };

  // Filter Logic memoized with useMemo
  const filteredEstudiantes = useMemo(() => {
    return estudiantes.filter(e => {
      const matchesSearch = e.nombre.toLowerCase().includes(search.toLowerCase()) || 
                            (e.ci && e.ci.includes(search)) ||
                            e.correo.toLowerCase().includes(search.toLowerCase());
      const matchesDept = !selectedDept || cleanName(e.departamento) === cleanName(selectedDept);
      return matchesSearch && matchesDept;
    });
  }, [estudiantes, search, selectedDept]);

  // Paginated students slice
  const paginatedEstudiantes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEstudiantes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEstudiantes, currentPage]);

  const totalPages = Math.ceil(filteredEstudiantes.length / itemsPerPage);

  const inputStyle = {
    padding: '0.8rem',
    borderRadius: '6px',
    border: '1px solid var(--glass-border)',
    backgroundColor: 'var(--bg-page)',
    color: 'var(--text-main)',
    width: '100%',
    boxSizing: 'border-box'
  };

  const renderStatsDashboard = () => {
    if (statsLoading || !statsData) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ border: '4px solid rgba(0,0,0,0.1)', width: '36px', height: '36px', borderRadius: '50%', borderLeftColor: 'var(--color-accent)', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ color: 'var(--text-muted)' }}>Cargando estadísticas de negocio...</p>
        </div>
      );
    }

    if (statsError) {
      return (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: '#e74c3c', backgroundColor: 'rgba(231,76,60,0.05)', border: '1px solid rgba(231,76,60,0.2)' }}>
          <p>{statsError}</p>
          <button onClick={() => loadStats()} style={{ backgroundColor: 'var(--color-primary)', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Reintentar</button>
        </div>
      );
    }

    const kpis = statsData?.kpis || { total_estudiantes: 0, avg_edad: 0, total_inscripciones: 0, top_canal: 'Ninguno', tasa_fidelidad: 0, tasa_finalizacion: 0 };
    const chartOrigenes = statsData?.charts?.origenes || [];
    const chartProgreso = statsData?.charts?.progreso || [];


    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
        
        {/* KPI Grid */}
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <KpiCard title="Alumnos Totales" value={kpis.total_estudiantes} icon={Users} color="#038fba" />
          <KpiCard title="Tasa de Graduación" value={`${kpis.tasa_finalizacion}%`} icon={CheckCircle} color="#2ecc71" />
          <KpiCard title="Canal Principal" value={kpis.top_canal} icon={Award} color="#9b59b6" />
        </div>

        {/* Fila de Gráficos: Canales de Captación y Estado de Cursado */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
          
          {/* Canales de Captación */}
          <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'var(--panel-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={18} color="var(--color-accent)" /> Canales de Captación (Efectividad de Marketing)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Medios por los cuales los estudiantes conocieron e ingresaron a la academia (Top Canal: <strong>{kpis.top_canal}</strong>).
            </p>
            {chartOrigenes.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={chartOrigenes}
                    cx="50%"
                    cy="47%"
                    outerRadius={80}
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    dataKey="value"
                  >
                    {chartOrigenes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-main)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sin registros de origen de captación.</div>
            )}
          </div>

          {/* Estado de Cursado e Inscripciones (Eficiencia Académica) */}
          <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'var(--panel-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--color-accent)" /> Estado de Cursado e Inscripciones (Eficiencia Académica)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Distribución actual del progreso de matrículas (Eficiencia general de graduación: <strong>{kpis.tasa_finalizacion}%</strong>).
            </p>
            {chartProgreso.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={chartProgreso}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} width={130} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-main)' }} />
                  <Bar dataKey="value" fill="var(--color-accent)" radius={[0, 4, 4, 0]} name="Inscripciones">
                    {chartProgreso.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sin datos disponibles.</div>
            )}
          </div>

        </div>

      </div>
    );
  };

  return (
    <div>
      {/* Cabecera Dinámica */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={24} /> {view === 'form' ? 'Registrar Nuevo Estudiante' : (statsTab === 'dashboard' ? 'Estadísticas de Estudiantes' : 'Registro de Estudiantes')}
          </h2>
          {view === 'list' && (
            <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
              {statsTab === 'dashboard'
                ? 'Visualiza el origen demográfico, efectividad de marketing y retención de alumnos para decisiones estratégicas.'
                : 'Administra la base histórica y registra nuevos alumnos en la academia.'}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {view === 'form' ? (
            <button
              onClick={() => {
                setStatus('');
                setView('list');
              }}
              style={{
                backgroundColor: 'var(--bg-page)',
                color: 'var(--text-main)',
                border: '1px solid var(--glass-border)',
                padding: '0.6rem 1.2rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 'bold',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={e => e.target.style.backgroundColor = 'var(--panel-bg)'}
              onMouseLeave={e => e.target.style.backgroundColor = 'var(--bg-page)'}
            >
              <ArrowLeft size={18} /> Volver a la Lista
            </button>
          ) : (
            <button
              onClick={() => setView('form')}
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
              <PlusCircle size={18} /> Registrar Estudiante
            </button>
          )}
        </div>
      </div>

      {/* TABS DE SUB-SECCIÓN EN VISTA DE LISTA */}
      {view === 'list' && (
        <div style={{
          display: 'flex',
          gap: '1rem',
          borderBottom: '1px solid var(--glass-border)',
          marginBottom: '2rem',
          paddingBottom: '0.5rem',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setStatsTab('catalogo')}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '6px 6px 0 0',
                border: 'none',
                borderBottom: statsTab === 'catalogo' ? '3px solid var(--color-accent)' : '3px solid transparent',
                backgroundColor: 'transparent',
                color: statsTab === 'catalogo' ? 'var(--color-primary-dark)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s',
                fontSize: '0.95rem'
              }}
            >
              Catálogo de Estudiantes
            </button>
            <button
              onClick={() => setStatsTab('dashboard')}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '6px 6px 0 0',
                border: 'none',
                borderBottom: statsTab === 'dashboard' ? '3px solid var(--color-accent)' : '3px solid transparent',
                backgroundColor: 'transparent',
                color: statsTab === 'dashboard' ? 'var(--color-primary-dark)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s',
                fontSize: '0.95rem'
              }}
            >
              Estadísticas Demográficas
            </button>
          </div>
          {statsTab === 'dashboard' && statsData?.anios && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={16} style={{ color: 'var(--text-muted)' }} />
              <select
                value={statsYear}
                onChange={(e) => setStatsYear(e.target.value)}
                style={{ ...inputStyle, width: 'auto', minWidth: '130px', padding: '0.5rem', fontSize: '0.85rem' }}
              >
                <option value="all">Todos los Años</option>
                {statsData.anios.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {view === 'form' ? (
        /* VISTA FORMULARIO */
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Información del Alumno</h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: '600', color: 'var(--text-muted)' }}>Nombre Completo *</label>
                <input type="text" value={formData.nombre_completo} onChange={e => setFormData({...formData, nombre_completo: e.target.value})} required style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: '600', color: 'var(--text-muted)' }}>Cédula de Identidad *</label>
                <input type="text" value={formData.ci} onChange={e => setFormData({...formData, ci: e.target.value})} required style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: '600', color: 'var(--text-muted)' }}>Correo Electrónico *</label>
                <input type="email" value={formData.correo} onChange={e => setFormData({...formData, correo: e.target.value})} required style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: '600', color: 'var(--text-muted)' }}>Teléfono</label>
                <input type="text" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: '600', color: 'var(--text-muted)' }}>Fecha de Nacimiento *</label>
                <input type="date" value={formData.fecha_nacimiento} onChange={e => setFormData({...formData, fecha_nacimiento: e.target.value})} required style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: '600', color: 'var(--text-muted)' }}>Departamento *</label>
                <select value={formData.departamento_id} onChange={e => setFormData({...formData, departamento_id: e.target.value})} required style={inputStyle}>
                  <option value="">Seleccionar...</option>
                  {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: '600', color: 'var(--text-muted)' }}>Grado Académico *</label>
                <select value={formData.grado_academico_id} onChange={e => setFormData({...formData, grado_academico_id: e.target.value})} required style={inputStyle}>
                  <option value="">Seleccionar...</option>
                  {grados.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" disabled={formLoading} style={{
                  backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '6px', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold', height: '42px'
                }}>
                  {formLoading ? 'Registrando...' : <><Save size={18} /> Registrar Alumno</>}
                </button>
              </div>
            </form>
            {status && (
              <div style={{ marginTop: '1.5rem', padding: '0.8rem', borderRadius: '6px', backgroundColor: status.includes('Error') ? 'rgba(231, 76, 60, 0.1)' : 'rgba(46, 204, 113, 0.1)', color: status.includes('Error') ? '#e74c3c' : '#2ecc71', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
                {!status.includes('Error') && <CheckCircle size={18} />} {status}
              </div>
            )}
          </div>
        </div>
      ) : statsTab === 'dashboard' ? (
        /* VISTA ESTADÍSTICAS */
        renderStatsDashboard()
      ) : (
        /* VISTA LISTA TABULAR */
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          {selectedDept && (
            <div style={{
              padding: '0.6rem 1rem',
              backgroundColor: 'rgba(3, 143, 186, 0.05)',
              border: '1px solid var(--glass-border)',
              borderRadius: '6px',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.85rem',
              color: 'var(--text-main)'
            }}>
              <span>Filtrado por departamento de procedencia: <strong>{selectedDept}</strong></span>
              <button 
                onClick={() => setSelectedDept(null)}
                style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Limpiar Filtro
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Buscar por nombre, CI o correo..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                style={{ ...inputStyle, paddingLeft: '2.5rem' }} 
              />
            </div>
            
            <div style={{ flex: '0 1 200px' }}>
              <select
                value={selectedDept || ''}
                onChange={(e) => setSelectedDept(e.target.value || null)}
                style={{ ...inputStyle, padding: '0.75rem' }}
              >
                <option value="">Todos los Departamentos</option>
                {departamentos.map(d => (
                  <option key={d.id} value={d.nombre}>{d.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? <p>Cargando estudiantes...</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-page)', borderBottom: '2px solid var(--glass-border)', textAlign: 'left' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-main)' }}>CI</th>
                    <th style={{ padding: '1rem', color: 'var(--text-main)' }}>Nombre Completo</th>
                    <th style={{ padding: '1rem', color: 'var(--text-main)' }}>Correo</th>
                    <th style={{ padding: '1rem', color: 'var(--text-main)' }}>Teléfono</th>
                    <th style={{ padding: '1rem', color: 'var(--text-main)' }}>Grado</th>
                    <th style={{ padding: '1rem', color: 'var(--text-main)' }}>Departamento</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEstudiantes.map(e => (
                    <tr key={e.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{e.ci || '-'}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-main)' }}>{e.nombre}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{e.correo}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-main)' }}>{e.telefono || '-'}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-main)' }}>{e.grado || '-'}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-main)' }}>{e.departamento || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredEstudiantes.length === 0 && (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No se encontraron registros.</p>
              )}

              {/* Paginación */}
              {totalPages > 1 && (
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GestorEstudiantes;
