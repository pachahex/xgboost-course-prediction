import React, { useState, useEffect, useMemo } from 'react';
import { fetchApi } from '../../api';
import { 
  PlusCircle, Pencil, Save, XCircle, Trash2, CheckCircle, Eye, EyeOff, 
  LayoutGrid, List, Search, Filter, ArrowLeft, BarChart2, Users, Calendar, 
  TrendingUp, DollarSign, Map, Award, Check, Star
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend
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

const GestorProgramas = () => {
  const [programas, setProgramas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [beneficios, setBeneficios] = useState([]);
  const [facilitadores, setFacilitadores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stats Dashboard State
  const [statsTab, setStatsTab] = useState('catalogo'); // 'catalogo' or 'dashboard'
  const [statsYear, setStatsYear] = useState('all');
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');
  const [hoveredDept, setHoveredDept] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);

  // Predictive IA State
  const [markedProgramId, setMarkedProgramId] = useState(() => {
    return localStorage.getItem('marked_predictive_program_id') || null;
  });

  const toggleMarkProgram = (id, nombre) => {
    if (markedProgramId === String(id)) {
      setMarkedProgramId(null);
      localStorage.removeItem('marked_predictive_program_id');
      localStorage.removeItem('marked_predictive_program_name');
    } else {
      setMarkedProgramId(String(id));
      localStorage.setItem('marked_predictive_program_id', String(id));
      localStorage.setItem('marked_predictive_program_name', nombre);
    }
  };

  // Cohort History (for paginated list under Stats)
  const [cohortHistory, setCohortHistory] = useState([]);
  const [cohortSearch, setCohortSearch] = useState('');
  const [cohortPage, setCohortPage] = useState(1);
  const cohortItemsPerPage = 8;

  // UI & Filter State
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('gestor_programas_viewMode') || 'grid';
  });
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [filters, setFilters] = useState({
    search: '',
    categoria: '',
    tipo: '',
    modalidad: '',
    activo: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 18 : 25;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, programas, viewMode]);

  // Form State
  const [formData, setFormData] = useState({
    nombre: '',
    costo: '',
    categoria_id: '',
    tipo_servicio_id: '',
    modalidad_id: '',
    duracion_horas: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    activo: false,
    'beneficios[]': [], // Array para IDs de beneficios
    'facilitadores[]': [] // Array para IDs de facilitadores
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

      const fRes = await fetchApi('/admin/facilitadores');
      setFacilitadores(fRes);

      const cohHistoryRes = await fetchApi('/admin/cohortes/all');
      setCohortHistory(cohHistoryRes || []);
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
      const res = await fetchApi(`/admin/programas/stats${query}`);
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

  // Reset cohort page when filters change
  useEffect(() => {
    setCohortPage(1);
  }, [cohortSearch, statsYear]);

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones de fecha
    if (formData.fecha_inicio) {
      const inicio = new Date(formData.fecha_inicio + 'T00:00:00');
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (inicio < hoy) {
        setStatus('Error: La fecha de inicio no puede ser anterior al día de hoy.');
        return;
      }
    }
    if (formData.fecha_inicio && formData.fecha_fin) {
      const inicio = new Date(formData.fecha_inicio + 'T00:00:00');
      const fin = new Date(formData.fecha_fin + 'T00:00:00');
      if (fin < inicio) {
        setStatus('Error: La fecha de fin no puede ser anterior a la fecha de inicio.');
        return;
      }
    }

    setStatus(editId ? 'Actualizando programa...' : 'Publicando programa...');

    const data = new FormData();
    for (const key in formData) {
      if (key === 'beneficios[]' || key === 'facilitadores[]') {
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
    setView('form'); // Cambiar a la vista de formulario al editar
    const cat = categorias.find(c => c.nombre === p.categoria)?.id || '';
    const tip = tipos.find(t => t.nombre === p.tipo)?.id || '';
    const mod = modalidades.find(m => m.nombre === p.modalidad)?.id || '';

    setFormData({
      nombre: p.nombre,
      costo: p.costo,
      categoria_id: cat,
      tipo_servicio_id: tip,
      modalidad_id: mod,
      duracion_horas: p.duracion_horas || '',
      descripcion: p.descripcion || '',
      fecha_inicio: p.fecha_inicio || '',
      fecha_fin: p.fecha_fin || '',
      activo: p.activo,
      'beneficios[]': p.beneficios_ids || [],
      'facilitadores[]': p.facilitadores_ids || []
    });
    setImagen(null);
    setStatus('Modo edición activado.');
  };

  const cancelEdit = () => {
    setEditId(null);
    setFormData({
      nombre: '', costo: '', categoria_id: '', tipo_servicio_id: '', modalidad_id: '',
      duracion_horas: '',
      descripcion: '', 
      fecha_inicio: '',
      fecha_fin: '',
      activo: false, 
      'beneficios[]': [],
      'facilitadores[]': []
    });
    setImagen(null);
    setStatus('');
    setView('list'); // Regresar a la vista de lista
  };

  /*
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
  */

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

  const handleCerrarPrograma = async (p) => {
    if (!window.confirm(`¿Estás seguro de cerrar la cohorte "${p.nombre}"? Esto pasará a todos los inscritos 'Activos' a 'Finalizado' y a los 'Pendientes' a 'Retirado'. Esta acción ocultará el programa del catálogo público.`)) return;

    try {
      await fetchApi(`/admin/programas/${p.id}/cerrar`, {
        method: 'POST'
      });
      loadData();
      setStatus(`Programa "${p.nombre}" cerrado exitosamente.`);
      setTimeout(() => setStatus(''), 4000);
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

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('gestor_programas_viewMode', mode);
  };

  // Map Helpers
  const cleanName = (name) => {
    return name ? name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : '';
  };

  const getDeptValue = (deptName) => {
    if (!statsData || !statsData.charts || !statsData.charts.departamentos) return 0;
    const match = statsData.charts.departamentos.find(
      d => cleanName(d.name) === cleanName(deptName)
    );
    return match ? match.value : 0;
  };

  const departmentsList = [
    {
      id: 'BE',
      name: 'Beni',
      points: '94.3,173.9 84.3,165.0 80.0,155.8 75.6,154.3 75.4,148.2 71.7,143.3 71.2,136.0 73.1,121.5 77.5,115.9 76.0,111.7 86.4,101.2 89.8,90.3 90.0,83.6 91.9,74.7 90.9,65.8 94.9,64.6 97.4,58.1 108.1,55.6 115.3,45.1 127.9,34.2 135.7,29.5 134.4,35.6 138.4,45.6 135.5,50.6 138.2,59.4 145.6,66.5 147.9,73.5 153.1,74.0 155.2,77.3 161.8,79.8 166.1,85.9 179.3,88.1 187.0,86.0 199.6,92.4 205.0,91.2 207.1,96.0 213.8,100.6 225.3,104.4 233.3,104.6 234.2,107.8 242.4,115.4 248.8,114.2 189.5,144.8 178.1,147.6 178.5,156.9 186.8,170.6 192.5,173.9 195.0,179.8 162.3,178.6 156.9,177.9 141.9,179.6 136.9,190.8 123.5,194.8 114.9,193.3 104.7,185.0 101.5,180.0 94.3,173.9',
      textX: 151,
      textY: 124
    },
    {
      id: 'CB',
      name: 'Cochabamba',
      points: '99.1,236.3 93.8,228.2 88.2,224.3 92.9,222.2 91.1,214.1 87.2,208.9 89.5,204.9 94.3,204.2 96.1,197.9 94.3,190.3 90.5,184.6 90.4,177.5 94.3,173.9 101.5,180.0 104.7,185.0 114.9,193.3 123.5,194.8 136.9,190.8 141.9,179.6 156.9,177.9 158.2,192.2 153.8,201.3 156.5,208.4 167.1,214.7 167.0,220.8 156.3,233.2 168.2,250.2 167.0,254.7 160.7,254.9 156.6,251.2 149.7,250.6 145.7,253.5 140.2,252.4 137.1,248.1 123.4,236.8 117.1,233.1 112.2,233.0 107.5,236.2 99.1,236.3',
      textX: 124,
      textY: 216
    },
    {
      id: 'CH',
      name: 'Chuquisaca',
      points: '140.4,332.9 134.1,327.8 134.7,314.1 138.6,305.5 136.4,296.7 137.9,292.2 150.5,288.0 155.3,283.3 151.6,274.9 138.5,272.2 132.0,265.9 132.3,258.7 129.4,254.5 127.7,246.3 137.1,248.1 140.2,252.4 145.7,253.5 149.7,250.6 156.6,251.2 160.7,254.9 167.0,254.7 168.8,259.1 179.0,268.5 184.1,270.7 186.9,302.9 198.3,303.9 230.8,303.8 228.7,306.3 228.9,318.3 177.9,318.2 172.0,315.3 171.3,321.2 166.4,321.9 156.0,316.4 152.4,320.7 142.2,317.5 140.4,332.9',
      textX: 164,
      textY: 284
    },
    {
      id: 'LP',
      name: 'La Paz',
      points: '94.3,173.9 90.4,177.5 90.5,184.6 94.3,190.3 96.1,197.9 94.3,204.2 89.5,204.9 87.2,208.9 91.1,214.1 92.9,222.2 88.2,224.3 83.8,220.2 78.9,221.5 65.5,229.2 63.8,232.7 52.4,226.9 44.5,227.2 33.8,235.0 26.2,237.6 19.8,236.0 17.8,229.6 13.9,226.6 13.5,219.6 10.0,215.2 16.3,211.3 22.7,203.3 28.0,200.0 29.4,187.8 22.1,186.4 15.9,171.8 20.4,163.8 24.3,161.1 17.1,153.9 17.6,149.4 21.4,143.7 28.9,137.9 32.6,133.1 26.5,119.7 29.6,114.2 29.2,96.8 33.9,93.1 38.1,86.8 44.0,84.6 51.7,73.4 58.7,70.5 90.0,83.6 89.8,90.3 86.4,101.2 76.0,111.7 77.5,115.9 73.1,121.5 71.2,136.0 71.7,143.3 75.4,148.2 75.6,154.3 80.0,155.8 84.3,165.0 94.3,173.9',
      textX: 40,
      textY: 179
    },
    {
      id: 'PD',
      name: 'Pando',
      points: '38.1,86.8 30.6,73.1 11.5,44.6 26.2,45.1 32.9,46.4 35.4,49.7 49.8,45.4 57.7,36.7 65.8,38.1 70.6,32.5 85.6,26.1 98.9,16.2 115.4,12.6 125.3,12.5 130.5,14.2 134.3,10.0 138.5,14.4 138.8,24.7 135.7,29.5 127.9,34.2 115.3,45.1 108.1,55.6 97.4,58.1 94.9,64.6 90.9,65.8 91.9,74.7 90.0,83.6 58.7,70.5 51.7,73.4 44.0,84.6 38.1,86.8',
      textX: 82,
      textY: 47
    },
    {
      id: 'OR',
      name: 'Oruro',
      points: '26.2,237.6 33.8,235.0 44.5,227.2 52.4,226.9 63.8,232.7 65.5,229.2 78.9,221.5 83.8,220.2 88.2,224.3 93.8,228.2 99.1,236.3 95.6,238.3 97.1,249.9 102.0,255.3 109.5,257.5 115.2,269.5 104.7,270.2 97.0,275.4 66.3,286.8 41.1,279.2 45.0,275.6 31.4,265.5 27.7,254.5 27.7,249.7 24.3,240.0 26.2,237.6',
      textX: 67,
      textY: 247
    },
    {
      id: 'PT',
      name: 'Potosí',
      points: '140.4,332.9 137.7,339.9 141.8,348.0 125.1,348.5 115.4,340.9 110.7,339.9 107.4,348.6 95.8,351.7 94.6,357.1 87.3,359.7 87.6,362.7 82.5,367.8 70.7,370.0 61.9,368.0 62.6,360.6 59.8,348.3 55.6,344.4 52.6,334.8 52.6,326.3 41.4,311.0 44.3,308.2 37.6,304.8 35.0,293.4 41.0,292.5 42.6,288.7 37.7,284.0 41.1,279.2 66.3,286.8 97.0,275.4 104.7,270.2 115.2,269.5 109.5,257.5 102.0,255.3 97.1,249.9 95.6,238.3 99.1,236.3 107.5,236.2 112.2,233.0 117.1,233.1 123.4,236.8 137.1,248.1 127.7,246.3 129.4,254.5 132.3,258.7 132.0,265.9 138.5,272.2 151.6,274.9 155.3,283.3 150.5,288.0 137.9,292.2 136.4,296.7 138.6,305.5 134.7,314.1 134.1,327.8 140.4,332.9',
      textX: 90,
      textY: 301
    },
    {
      id: 'SC',
      name: 'Santa Cruz',
      points: '230.8,303.8 198.3,303.9 186.9,302.9 184.1,270.7 179.0,268.5 168.8,259.1 167.0,254.7 168.2,250.2 156.3,233.2 167.0,220.8 167.1,214.7 156.5,208.4 153.8,201.3 158.2,192.2 156.9,177.9 162.3,178.6 195.0,179.8 192.5,173.9 186.8,170.6 178.5,156.9 178.1,147.6 189.5,144.8 248.8,114.2 251.8,115.5 265.3,113.8 276.1,120.5 282.0,122.3 284.8,127.3 281.9,132.2 287.9,144.6 288.5,157.4 279.2,157.5 289.5,167.9 291.5,189.3 342.7,191.1 345.4,195.9 341.6,200.5 343.6,214.5 356.2,223.0 363.3,225.5 364.1,232.3 370.0,242.1 362.6,261.2 362.4,265.1 352.1,284.0 360.2,290.3 352.5,295.1 351.3,286.4 323.1,273.3 296.8,271.9 278.0,276.3 244.4,281.3 239.3,293.2 230.8,303.8',
      textX: 275,
      textY: 205
    },
    {
      id: 'TJ',
      name: 'Tarija',
      points: '141.8,348.0 137.7,339.9 140.4,332.9 142.2,317.5 152.4,320.7 156.0,316.4 166.4,321.9 171.3,321.2 172.0,315.3 177.9,318.2 228.9,318.3 229.0,319.8 217.6,352.0 212.4,345.4 179.0,345.5 173.4,356.6 168.9,363.0 163.5,359.5 159.6,351.3 148.4,348.4 141.8,348.0',
      textX: 170,
      textY: 336
    }
  ];

  // Filter Logic memoized with useMemo
  const filteredProgramas = useMemo(() => {
    return programas.filter(p => {
      const matchesSearch = p.nombre.toLowerCase().includes(filters.search.toLowerCase());
      const matchesCat = filters.categoria === '' || p.categoria === filters.categoria;
      const matchesTipo = filters.tipo === '' || p.tipo === filters.tipo;
      const matchesMod = filters.modalidad === '' || p.modalidad === filters.modalidad;
      const matchesStatus = filters.activo === 'all' || (filters.activo === 'active' ? p.activo : !p.activo);

      return matchesSearch && matchesCat && matchesTipo && matchesMod && matchesStatus;
    });
  }, [programas, filters]);

  // Sliced portion of filteredProgramas for the current page
  const paginatedProgramas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProgramas.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProgramas, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProgramas.length / itemsPerPage);

  // Memoized filtered cohort history for stats tab
  const filteredCohorts = useMemo(() => {
    return cohortHistory.filter(c => {
      const startYear = c.fecha_inicio && c.fecha_inicio !== 'None' ? new Date(c.fecha_inicio).getFullYear() : null;
      const matchesYear = statsYear === 'all' || String(startYear) === String(statsYear);
      
      const matchesSearch = c.programa_nombre?.toLowerCase().includes(cohortSearch.toLowerCase()) || 
                            c.cohorte_nombre?.toLowerCase().includes(cohortSearch.toLowerCase()) ||
                            c.nombre?.toLowerCase().includes(cohortSearch.toLowerCase()) ||
                            c.programa?.toLowerCase().includes(cohortSearch.toLowerCase());
      return matchesYear && matchesSearch;
    });
  }, [cohortHistory, cohortSearch, statsYear]);

  // Paginated Cohorts
  const paginatedCohorts = useMemo(() => {
    const startIndex = (cohortPage - 1) * cohortItemsPerPage;
    return filteredCohorts.slice(startIndex, startIndex + cohortItemsPerPage);
  }, [filteredCohorts, cohortPage, cohortItemsPerPage]);

  const cohortTotalPages = Math.ceil(filteredCohorts.length / cohortItemsPerPage);

  const renderStatsDashboard = () => {
    if (statsLoading || !statsData) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner" style={{ border: '4px solid rgba(0,0,0,0.1)', width: '36px', height: '36px', borderRadius: '50%', borderLeftColor: 'var(--color-accent)', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ color: 'var(--text-muted)' }}>Cargando estadísticas históricas de la academia...</p>
        </div>
      );
    }

    if (statsError) {
      return (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: '#e74c3c', backgroundColor: 'rgba(231,76,60,0.05)', border: '1px solid rgba(231,76,60,0.2)' }}>
          <p>{statsError}</p>
          <button onClick={() => loadStats(statsYear)} style={{ backgroundColor: 'var(--color-primary)', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Reintentar</button>
        </div>
      );
    }

    const kpis = statsData?.kpis || { total_cohortes: 0, total_inscritos: 0, total_ingresos: 0, avg_alumnos_cohorte: 0 };
    const chartDeptData = statsData?.charts?.departamentos || [];
    
    // Map coloring configuration
    const deptValues = departmentsList.map(d => getDeptValue(d.name));
    const maxDeptValue = Math.max(...deptValues, 1);
    
    const getFillColor = (value, isSelected, isHovered) => {
      if (value === 0) return 'var(--bg-page)';
      const pct = value / maxDeptValue;
      if (isSelected) return 'var(--color-accent)';
      return `hsla(192, 85%, ${isHovered ? 40 : 50}%, ${0.15 + pct * 0.85})`;
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
        
        {/* KPI Grid */}
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <KpiCard title="Cohortes Lanzadas" value={kpis.total_cohortes} icon={Calendar} color="#038fba" />
          <KpiCard title="Estudiantes Matriculados" value={`${kpis.total_inscritos} alumnos`} icon={Users} color="#2ecc71" />
          <KpiCard title="Ingresos Generados" value={`${kpis.total_ingresos.toLocaleString()} Bs.`} icon={DollarSign} color="#e67e22" />
          <KpiCard title="Promedio por Cohorte" value={`${kpis.avg_alumnos_cohorte} alumnos`} icon={Award} color="#9b59b6" />
        </div>

        {/* Dos columnas: Mapa y Tendencia Mensual */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
          
          {/* Mapa Geográfico de Bolivia */}
          <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'var(--panel-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Map size={18} color="var(--color-accent)" /> Distribución Geográfica (Estudiantes por Departamento)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Pasa el cursor sobre los departamentos para ver matriculados. Haz clic para seleccionarlo.
            </p>
            
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap-reverse', alignItems: 'center' }}>
              
              {/* SVG Map */}
              <div style={{ flex: '1 1 200px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                <svg viewBox="0 0 380 380" style={{ width: '100%', maxHeight: '280px', height: 'auto' }}>
                  {departmentsList.map(dept => {
                    const val = getDeptValue(dept.name);
                    const isSelected = selectedDept === dept.name;
                    const isHovered = hoveredDept === dept.name;
                    return (
                      <g 
                        key={dept.id}
                        onMouseEnter={() => setHoveredDept(dept.name)}
                        onMouseLeave={() => setHoveredDept(null)}
                        onClick={() => setSelectedDept(isSelected ? null : dept.name)}
                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        <polygon
                          points={dept.points}
                          fill={getFillColor(val, isSelected, isHovered)}
                          stroke={isSelected ? 'var(--color-accent)' : (isHovered ? 'var(--text-main)' : 'var(--glass-border)')}
                          strokeWidth={isSelected ? 2.5 : 1}
                          style={{ transition: 'all 0.2s' }}
                        />
                        <text
                          x={dept.textX}
                          y={dept.textY}
                          fill={val > 0 ? '#1a252f' : 'var(--text-muted)'}
                          fontSize={10}
                          fontWeight="bold"
                          textAnchor="middle"
                          style={{ pointerEvents: 'none', userSelect: 'none' }}
                        >
                          {dept.id}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                
                {/* Tooltip flotante */}
                {hoveredDept && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'var(--panel-bg)',
                    border: '1px solid var(--color-accent)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    fontSize: '0.8rem',
                    color: 'var(--text-main)',
                    pointerEvents: 'none',
                    zIndex: 10,
                    fontWeight: '600'
                  }}>
                    {hoveredDept}: <strong>{getDeptValue(hoveredDept)} inscritos</strong>
                  </div>
                )}
              </div>

              {/* Informacion de Departamentos Lateral */}
              <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedDept ? (
                  <div style={{
                    padding: '0.8rem',
                    border: '1px solid var(--color-accent)',
                    backgroundColor: 'rgba(3, 143, 186, 0.03)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{selectedDept}</strong>
                      <button 
                        onClick={() => setSelectedDept(null)}
                        style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                      >
                        Limpiar
                      </button>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div>Matriculados: <strong>{getDeptValue(selectedDept)}</strong></div>
                      <div>Aporte: <strong>{kpis.total_inscritos > 0 ? Math.round((getDeptValue(selectedDept) / kpis.total_inscritos) * 100) : 0}%</strong> del total.</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '0.8rem', border: '1px solid var(--glass-border)', borderRadius: '8px', backgroundColor: 'var(--bg-page)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Haz clic en un departamento para ver detalles específicos.</span>
                  </div>
                )}

                {/* Tabla de Ranking de Departamentos */}
                <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: '6px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-page)', borderBottom: '1px solid var(--glass-border)' }}>
                        <th style={{ padding: '0.4rem', color: 'var(--text-main)' }}>Departamento</th>
                        <th style={{ padding: '0.4rem', color: 'var(--text-main)', textAlign: 'right' }}>Inscritos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartDeptData.map((d, idx) => (
                        <tr 
                          key={idx} 
                          onClick={() => setSelectedDept(selectedDept === d.name ? null : d.name)}
                          style={{ 
                            borderBottom: '1px solid var(--glass-border)', 
                            backgroundColor: selectedDept === d.name ? 'rgba(3, 143, 186, 0.05)' : 'transparent',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <td style={{ padding: '0.4rem', color: 'var(--text-main)' }}>{d.name}</td>
                          <td style={{ padding: '0.4rem', color: 'var(--text-main)', textAlign: 'right', fontWeight: 'bold' }}>{d.value}</td>
                        </tr>
                      ))}
                      {chartDeptData.length === 0 && (
                        <tr>
                          <td colSpan={2} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Sin registros geográficos.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>

          {/* Comparativa Mensual de Inscritos */}
          <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'var(--panel-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--color-accent)" /> Comparativa Mensual de Inscritos
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Cantidad de estudiantes inscritos por mes para evaluar el comportamiento estacional.
            </p>
            {(statsData?.charts?.mensual || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={statsData?.charts?.mensual || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-main)' }} />
                  <Bar dataKey="value" fill="var(--color-accent)" radius={[4, 4, 0, 0]} name="Inscritos" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sin datos disponibles en este periodo.</div>
            )}
          </div>

        </div>

        {/* Dos columnas abajo: Programas Populares y Categorías/Modalidades */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
          
          {/* Programas Populares */}
          <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'var(--panel-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={18} color="var(--color-accent)" /> Top Programas (Más Demandados)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Los 6 programas con mayor cantidad histórica de matriculados en la academia.
            </p>
            {(statsData?.charts?.populares || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={statsData?.charts?.populares || []} layout="vertical" margin={{ top: 10, right: 10, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={9} width={120} tickFormatter={(name) => name.length > 20 ? name.substring(0, 18) + '...' : name} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-main)' }} />
                  <Bar dataKey="value" fill="var(--color-primary-dark)" radius={[0, 4, 4, 0]} name="Inscritos">
                    {(statsData?.charts?.populares || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--color-accent)' : 'var(--color-primary-dark)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sin datos disponibles.</div>
            )}
          </div>

          {/* Categorías y Modalidades */}
          <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'var(--panel-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} color="var(--color-accent)" /> Categorías Temáticas & Modalidades
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Participación porcentual por especialidad académica y canal de aprendizaje.
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {/* Categorías (Pie) */}
                <div style={{ flex: '1 1 200px', height: '220px' }}>
                  {(statsData?.charts?.categorias || []).length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statsData?.charts?.categorias || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {(statsData?.charts?.categorias || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-main)' }} />
                        <Legend iconSize={8} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '10px', color: 'var(--text-main)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin datos.</div>
                  )}
                </div>

                {/* Modalidades (Progreso Stack) */}
                <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {(() => {
                    const mods = statsData?.charts?.modalidades || [];
                    const totalModalidad = mods.reduce((acc, curr) => acc + curr.value, 0) || 1;
                    return mods.length > 0 ? (
                      mods.map((m, idx) => {
                        const pct = Math.round((m.value / totalModalidad) * 100);
                        return (
                          <div key={idx} style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                              <span style={{ fontWeight: '500' }}>{m.name}</span>
                              <strong style={{ color: 'var(--color-primary-dark)' }}>{m.value} ({pct}%)</strong>
                            </div>
                            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-page)', borderRadius: '4px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', backgroundColor: COLORS[idx % COLORS.length], borderRadius: '4px' }} />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin datos de modalidades.</div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Tabla Detallada e Histórica de Cohortes Paginada */}
        <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'var(--panel-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="var(--color-accent)" /> Historial General de Cohortes
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                Lista completa y auditable de todos los lanzamientos ejecutados en la academia.
              </p>
            </div>
            
            {/* Search Input for Cohorts */}
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Filtrar cohorte o programa..."
                value={cohortSearch}
                onChange={(e) => setCohortSearch(e.target.value)}
                style={{ ...inputStyle, padding: '0.5rem 0.5rem 0.5rem 2rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-page)', borderBottom: '2px solid var(--glass-border)' }}>
                  <th style={{ padding: '0.8rem', color: 'var(--text-main)' }}>ID</th>
                  <th style={{ padding: '0.8rem', color: 'var(--text-main)' }}>Programa</th>
                  <th style={{ padding: '0.8rem', color: 'var(--text-main)' }}>Edición / Cohorte</th>
                  <th style={{ padding: '0.8rem', color: 'var(--text-main)' }}>Inicio</th>
                  <th style={{ padding: '0.8rem', color: 'var(--text-main)' }}>Fin</th>
                  <th style={{ padding: '0.8rem', color: 'var(--text-main)', textAlign: 'right' }}>Total Inscritos</th>
                  <th style={{ padding: '0.8rem', color: 'var(--text-main)' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCohorts.map((c, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)', opacity: c.activo ? 1 : 0.8 }}>
                    <td style={{ padding: '0.8rem', color: 'var(--text-muted)' }}>#{c.id}</td>
                    <td style={{ padding: '0.8rem', color: 'var(--text-main)', fontWeight: '600' }}>{c.programa_nombre || c.programa}</td>
                    <td style={{ padding: '0.8rem', color: 'var(--color-primary-dark)' }}>{c.cohorte_nombre || c.nombre}</td>
                    <td style={{ padding: '0.8rem', color: 'var(--text-main)' }}>{c.fecha_inicio && c.fecha_inicio !== 'None' ? new Date(c.fecha_inicio).toLocaleDateString('es-ES') : 'S/N'}</td>
                    <td style={{ padding: '0.8rem', color: 'var(--text-main)' }}>{c.fecha_fin && c.fecha_fin !== 'None' ? new Date(c.fecha_fin).toLocaleDateString('es-ES') : 'S/N'}</td>
                    <td style={{ padding: '0.8rem', color: 'var(--text-main)', textAlign: 'right', fontWeight: 'bold' }}>{c.total_inscritos}</td>
                    <td style={{ padding: '0.8rem' }}>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontSize: '0.65rem',
                        backgroundColor: c.activo ? 'rgba(46, 204, 113, 0.1)' : 'rgba(149, 165, 166, 0.1)',
                        color: c.activo ? '#2ecc71' : '#95a5a6',
                        fontWeight: 'bold'
                      }}>
                        {c.activo ? 'DICTANDO' : 'CONCLUIDO'}
                      </span>
                    </td>
                  </tr>
                ))}
                {paginatedCohorts.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron cohortes.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination for Cohorts Table */}
          {cohortTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem 0 0 0', borderTop: '1px solid var(--glass-border)' }}>
              <button
                disabled={cohortPage === 1}
                onClick={() => setCohortPage(prev => Math.max(prev - 1, 1))}
                style={{ padding: '0.4rem 1rem', borderRadius: '4px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-page)', color: cohortPage === 1 ? 'var(--text-muted)' : 'var(--text-main)', cursor: cohortPage === 1 ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
              >
                Anterior
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 'bold' }}>Página {cohortPage} de {cohortTotalPages}</span>
              <button
                disabled={cohortPage === cohortTotalPages}
                onClick={() => setCohortPage(prev => Math.min(prev + 1, cohortTotalPages))}
                style={{ padding: '0.4rem 1rem', borderRadius: '4px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-page)', color: cohortPage === cohortTotalPages ? 'var(--text-muted)' : 'var(--text-main)', cursor: cohortPage === cohortTotalPages ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

      </div>
    );
  };

  return (
    <div>
      {/* Cabecera dinámica */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ color: 'var(--color-primary-dark)', margin: 0 }}>
            {view === 'form' 
              ? (editId ? 'Editar Programa Académico' : 'Crear Nuevo Programa Académico') 
              : (statsTab === 'dashboard' ? 'Estadísticas e Históricos' : 'Gestión de Programas Académicos')}
          </h2>
          {view === 'list' && (
            <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
              {statsTab === 'dashboard' 
                ? 'Visualiza el histórico acumulado, distribución de matrícula por regiones y KPIs institucionales.'
                : 'Añade Cursos y Diplomados. Serán expuestos instantáneamente en la Landing Pública y servirán de nodo para inferencias futuras del modelo.'}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {view === 'list' && statsTab === 'dashboard' && statsData?.anios && (
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
          {view === 'form' ? (
            <button
              onClick={cancelEdit}
              style={{
                backgroundColor: 'var(--bg-page)',
                color: 'var(--text-main)',
                padding: '0.6rem 1.2rem',
                borderRadius: '6px',
                border: '1px solid var(--glass-border)',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={e => e.target.style.backgroundColor = 'var(--panel-bg)'}
              onMouseLeave={e => e.target.style.backgroundColor = 'var(--bg-page)'}
            >
              <ArrowLeft size={18} /> Volver al Catálogo
            </button>
          ) : (
            <button
              onClick={() => {
                cancelEdit();
                setView('form');
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
          paddingBottom: '0.5rem'
        }}>
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
            Catálogo de Programas
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
            Estadísticas Históricas
          </button>
        </div>
      )}

      {view === 'form' ? (
        /* VISTA FORMULARIO COMPLETA */
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '2rem' }}>
          {/* Alerta Informativa sobre Cohortes Históricas */}
          <div className="glass-panel" style={{
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            borderLeft: '4px solid #3498db',
            padding: '1.2rem',
            borderRadius: '6px',
            color: 'var(--text-main)',
            fontSize: '0.9rem',
            lineHeight: '1.5',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#2980b9', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
              <CheckCircle size={18} /> Consistencia de Cohortes e Historial ML
            </h4>
            <p style={{ margin: 0 }}>
              Modificar la información general de este programa o asignar nuevas fechas de dictación <strong>no sobrescribe ni altera el registro de inscripciones de cohortes pasadas</strong>.
              El sistema maneja cada periodo activo como un cohorte nuevo de manera transparente (según el esquema <code>cohortes</code>). Las modificaciones en este formulario aplicarán a las futuras cohortes que se inicien a partir de ahora, preservando intacta la consistencia histórica para los análisis predictivos de la IA.
            </p>
          </div>

          <div className="glass-panel" style={{
            padding: '2rem',
            backgroundColor: editId ? 'rgba(52, 152, 219, 0.04)' : 'var(--panel-bg)',
            border: editId ? '2px solid var(--color-accent)' : '1px solid var(--glass-border)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
            borderRadius: '12px',
          }}>
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
                  <label style={labelStyle}>Fecha de Inicio</label>
                  <input
                    type="date"
                    min={getTodayString()}
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Fecha de Fin</label>
                  <input
                    type="date"
                    min={formData.fecha_inicio || getTodayString()}
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                    style={inputStyle}
                  />
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

              <div style={{ border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '6px', backgroundColor: 'var(--bg-page)' }}>
                <label style={{ ...labelStyle, marginBottom: '0.8rem' }}>Facilitadores Asignados</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {facilitadores.map(f => (
                    <label key={f.id} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-main)' }}>
                      <input
                        type="checkbox"
                        checked={formData['facilitadores[]'].includes(String(f.id)) || formData['facilitadores[]'].includes(f.id)}
                        onChange={(e) => {
                          const current = formData['facilitadores[]'];
                          const next = e.target.checked
                            ? [...current, f.id]
                            : current.filter(id => id !== f.id);
                          setFormData({ ...formData, 'facilitadores[]': next });
                        }}
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                      />
                      <div>
                        <div style={{ fontWeight: '500' }}>{f.nombre}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.correo}</div>
                      </div>
                    </label>
                  ))}
                  {facilitadores.length === 0 && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No hay facilitadores registrados en el sistema.</span>
                  )}
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
              </div>
              {status && <div style={{ padding: '0.8rem', borderRadius: '6px', backgroundColor: status.includes('Error') ? 'rgba(231, 76, 60, 0.1)' : 'rgba(46, 204, 113, 0.1)', color: status.includes('Error') ? '#e74c3c' : '#2ecc71', fontSize: '0.9rem', textAlign: 'center', fontWeight: '500' }}>{status}</div>}
            </form>
          </div>
        </div>
      ) : statsTab === 'dashboard' ? (
        renderStatsDashboard()
      ) : (
        /* VISTA DE CATÁLOGO / LISTADO GENERAL */
        <>
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
                value={filters.tipo}
                onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
                style={{ ...inputStyle, width: 'auto', minWidth: '150px' }}
              >
                <option value="">Todos los Tipos</option>
                {tipos.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
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
                onClick={() => handleSetViewMode('grid')}
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
                onClick={() => handleSetViewMode('list')}
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

          {/* Grilla / Listado de Programas */}
          <div>
            {loading ? <p>Cargando programas...</p> : (
              <>
                {viewMode === 'grid' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
                    {paginatedProgramas.map((p, idx) => (
                      <div key={idx} style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--panel-bg)', position: 'relative', opacity: p.activo ? 1 : 0.65, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          display: 'flex',
                          gap: '6px',
                          zIndex: 2
                        }}>
                          <button 
                            title="Marcar para Detalle Predictivo"
                            onClick={() => toggleMarkProgram(p.id, p.nombre)}
                            style={{
                              padding: '4px',
                              borderRadius: '50%',
                              backgroundColor: markedProgramId === String(p.id) ? '#f1c40f' : 'var(--panel-bg)',
                              border: '1px solid ' + (markedProgramId === String(p.id) ? '#f39c12' : 'var(--glass-border)'),
                              color: markedProgramId === String(p.id) ? 'white' : 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Star size={14} fill={markedProgramId === String(p.id) ? "white" : "none"} />
                          </button>
                          <div style={{
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
                        </div>
                        <div style={{ height: '140px', backgroundColor: '#f4f6f8', position: 'relative', overflow: 'hidden' }}>
                          {p.imagen_url ? (
                            <img
                              src={`http://localhost:5000${p.imagen_url}`}
                              alt={p.nombre}
                              loading="lazy"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.8rem' }}>Sin Imagen</div>
                          )}
                        </div>
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                            {p.tipo} • {p.modalidad}
                          </div>
                          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', flexGrow: 1 }}>{p.nombre}</h4>
                          <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '1rem' }}>{p.costo} Bs.</div>
                          
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                            <button
                              onClick={() => {
                                startEdit(p);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.75rem',
                                backgroundColor: 'var(--color-primary-dark)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                flex: 1,
                                justifyContent: 'center'
                              }}
                            >
                              <Pencil size={12} /> Editar
                            </button>
                            {p.activo && (
                              <button
                                onClick={() => handleCerrarPrograma(p)}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.75rem',
                                  backgroundColor: '#e67e22',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  justifyContent: 'center'
                                }}
                                title="Finalizar Cohorte"
                              >
                                <XCircle size={12} /> Cerrar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-panel" style={{ overflowX: 'auto', padding: '0', backgroundColor: 'var(--panel-bg)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--bg-page)', borderBottom: '2px solid var(--glass-border)' }}>
                          <th style={{ padding: '1rem', color: 'var(--text-main)' }}>ID</th>
                          <th style={{ padding: '1rem', color: 'var(--text-main)' }}>Programa</th>
                          <th style={{ padding: '1rem', color: 'var(--text-main)' }}>Categoría</th>
                          <th style={{ padding: '1rem', color: 'var(--text-main)' }}>Tipo</th>
                          <th style={{ padding: '1rem', color: 'var(--text-main)' }}>Modalidad</th>
                          <th style={{ padding: '1rem', color: 'var(--text-main)' }}>Costo</th>
                          <th style={{ padding: '1rem', color: 'var(--text-main)' }}>Estado</th>
                          <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-main)' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedProgramas.map((p, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)', opacity: p.activo ? 1 : 0.6 }}>
                            <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>#{p.id}</td>
                            <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-main)' }}>{p.nombre}</td>
                            <td style={{ padding: '1rem', color: 'var(--text-main)' }}>{p.categoria}</td>
                            <td style={{ padding: '1rem', color: 'var(--text-main)' }}>{p.tipo}</td>
                            <td style={{ padding: '1rem', color: 'var(--text-main)' }}>{p.modalidad}</td>
                            <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{p.costo} Bs.</td>
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
                                  onClick={() => toggleMarkProgram(p.id, p.nombre)}
                                  style={{ padding: '0.5rem', borderRadius: '6px', border: 'none', backgroundColor: markedProgramId === String(p.id) ? '#f1c40f' : 'var(--bg-page)', cursor: 'pointer', color: markedProgramId === String(p.id) ? 'white' : 'var(--color-primary-dark)' }}
                                  title="Marcar para IA"
                                >
                                  <Star size={16} fill={markedProgramId === String(p.id) ? "white" : "none"} />
                                </button>
                                <button
                                  onClick={() => startEdit(p)}
                                  style={{ padding: '0.5rem', borderRadius: '6px', border: 'none', backgroundColor: 'var(--bg-page)', cursor: 'pointer', color: 'var(--color-primary-dark)' }}
                                  title="Editar"
                                >
                                  <Pencil size={16} />
                                </button>
                                {p.activo && (
                                  <button
                                    onClick={() => handleCerrarPrograma(p)}
                                    style={{ padding: '0.5rem', borderRadius: '6px', border: 'none', backgroundColor: 'rgba(230, 126, 34, 0.1)', cursor: 'pointer', color: '#e67e22' }}
                                    title="Finalizar Cohorte"
                                  >
                                    <XCircle size={16} />
                                  </button>
                                )}
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

                {/* Paginación */}
                {totalPages > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '1rem',
                    marginTop: '2rem',
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

                {filteredProgramas.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <Search size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                    <p>No se encontraron programas que coincidan con los filtros.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GestorProgramas;
