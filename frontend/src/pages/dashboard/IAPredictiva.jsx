import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

// Paleta de colores Premium
const COLORS = ['#ff6b6b', '#339af0', '#51cf66', '#fcc419', '#845ef7', '#20c997', '#ff922b', '#e64980', '#12b886'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '12px', border: '1px solid #ebeeef', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ margin: 0, color: entry.color, fontSize: '0.9rem' }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const IAPredictiva = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboardStats = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchApi('/admin/dashboard/stats');
        setData(res);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardStats();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
      <div className="spinner" style={{ width: '50px', height: '50px', border: '4px solid var(--color-accent-light)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <p style={{ marginTop: '1rem', color: 'var(--color-primary-dark)' }}>Cargando Panel de Inteligencia Artificial... 🤖</p>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
  
  if (error) return <p style={{ color: 'red', textAlign: 'center', marginTop: '2rem' }}>Error: {error}</p>;
  if (!data) return <p>No hay data disponible.</p>;

  // Estilos base para los contenedores de gráficos
  const chartContainerStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 10px 25px rgba(0,0,0,0.03)',
    border: '1px solid rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    height: '380px',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  };

  const titleStyle = { marginTop: 0, marginBottom: '1.5rem', color: 'var(--color-primary-dark)', fontSize: '1.1rem', fontWeight: '600' };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ color: 'var(--color-primary-dark)', margin: 0, fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.5px' }}>
          🧠 Command Center IA
        </h2>
        <span style={{ backgroundColor: 'var(--color-accent)', padding: '6px 16px', borderRadius: '30px', fontSize: '0.85rem', color: 'white', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(255, 107, 107, 0.3)' }}>
          XGBoost + SHAP Activo
        </span>
      </div>
      <p style={{ color: '#666', marginBottom: '2.5rem', fontSize: '1.05rem', maxWidth: '800px' }}>
        Panel de control predictivo. Analiza el comportamiento histórico, descubre patrones paramétricos y proyecta la demanda futura de todos los programas académicos mediante los 9 indicadores clave.
      </p>

      {/* Grid Layout Principal */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', 
        gap: '2rem' 
      }}>

        {/* 1. Serie de Tiempo General (Area Chart) */}
        <div style={{ ...chartContainerStyle, gridColumn: '1 / -1', height: '450px' }} className="glass-panel-hover">
          <h3 style={titleStyle}>📈 1. Evolución de Demanda: Histórica vs Proyección XGBoost</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.chart_serie_tiempo}>
              <defs>
                <linearGradient id="colorHistorico" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#339af0" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#339af0" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorEsperado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3}/>
              <XAxis dataKey="name" tick={{fontSize: 12, fill: '#888'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 12, fill: '#888'}} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36}/>
              <Area type="monotone" name="Demanda Real Histórica" dataKey="historico" stroke="#339af0" strokeWidth={3} fillOpacity={1} fill="url(#colorHistorico)" />
              <Area type="monotone" name="Proyección Esperada XGBoost" dataKey="esperado" stroke="#ff6b6b" strokeWidth={3} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorEsperado)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 2. Top Programas */}
        <div style={chartContainerStyle} className="glass-panel-hover">
          <h3 style={titleStyle}>🏆 2. Top 5 Programas Estrellas (Mayor Proyección)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.chart_top_programas} layout="vertical" margin={{ left: 50 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11, fill: '#555'}} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Demanda Predicha" fill="#51cf66" radius={[0, 4, 4, 0]}>
                {data.chart_top_programas.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Peores Programas */}
        <div style={chartContainerStyle} className="glass-panel-hover">
          <h3 style={titleStyle}>⚠️ 3. Programas en Riesgo (Menor Proyección)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.chart_peores_programas} layout="vertical" margin={{ left: 50 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11, fill: '#555'}} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Demanda Predicha" fill="#ff6b6b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 4. Categorías Pie */}
        <div style={chartContainerStyle} className="glass-panel-hover">
          <h3 style={titleStyle}>📁 4. Distribución Histórica por Categoría</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.chart_demanda_categoria} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5} dataKey="value" nameKey="name" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {data.chart_demanda_categoria.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 5. Impacto SHAP */}
        <div style={chartContainerStyle} className="glass-panel-hover">
          <h3 style={titleStyle}>🤖 5. Impacto SHAP (Importancia Predictiva)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.chart_impacto_shap} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: '#555', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="impact" name="Impacto Absoluto Medio" fill="#845ef7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 6. Edades */}
        <div style={chartContainerStyle} className="glass-panel-hover">
          <h3 style={titleStyle}>🧑‍🎓 6. Histograma de Edades del Estudiantado</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.chart_edades}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="name" tick={{fontSize: 12, fill: '#888'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 12, fill: '#888'}} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Estudiantes" fill="#20c997" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 7. Orígenes Pie */}
        <div style={chartContainerStyle} className="glass-panel-hover">
          <h3 style={titleStyle}>📢 7. Eficiencia de Canales de Captación</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.chart_origenes} cx="50%" cy="50%" outerRadius={110} dataKey="value" nameKey="name" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {data.chart_origenes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 8. Estados Pie */}
        <div style={chartContainerStyle} className="glass-panel-hover">
          <h3 style={titleStyle}>🎯 8. Tasa de Retención (Estado Actual)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.chart_estados} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" nameKey="name" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {data.chart_estados.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.name === 'Retirado' ? '#ff6b6b' : entry.name === 'Finalizado' ? '#51cf66' : '#339af0'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 9. Ingresos Estimados */}
        <div style={chartContainerStyle} className="glass-panel-hover">
          <h3 style={titleStyle}>💰 9. Top 5: Volumen de Ingresos Brutos (Bs)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.chart_ingresos} layout="vertical" margin={{ left: 50 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11, fill: '#555'}} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Ingresos (Bs)" fill="#fcc419" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      <style>{`
        .glass-panel-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.08) !important;
        }
      `}</style>
    </div>
  );
};

export default IAPredictiva;
