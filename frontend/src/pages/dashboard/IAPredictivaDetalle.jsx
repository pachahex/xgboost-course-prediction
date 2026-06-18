import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../api';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { Brain, Star, ArrowLeft, Printer, AlertTriangle, CheckCircle, Info, ShieldCheck, Download, TrendingUp } from 'lucide-react';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Multiplicadores base para proyectar los 12 meses matemáticamente si el backend no lo provee como serie
const MULTIPLICADORES_MES = {
  1: 0.70, 2: 1.15, 3: 1.35, 4: 1.05, 5: 0.95, 6: 0.85,
  7: 1.10, 8: 1.30, 9: 1.00, 10: 0.90, 11: 0.85, 12: 0.60
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '12px', border: '1px solid #ebeeef', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>{label}</p>
        <p style={{ margin: 0, color: payload[0].payload.color || 'var(--color-accent)', fontSize: '1rem', fontWeight: 'bold' }}>
          Valor: {Number(payload[0].value).toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

const IAPredictivaDetalle = () => {
  const [programId] = useState(() => localStorage.getItem('marked_predictive_program_id'));
  const [programName] = useState(() => localStorage.getItem('marked_predictive_program_name') || '');
  const [targetMonth] = useState(() => {
    const stored = localStorage.getItem('marked_predictive_month');
    return stored ? parseInt(stored) : new Date().getMonth() + 1;
  });
  const [loading, setLoading] = useState(() => !!localStorage.getItem('marked_predictive_program_id'));
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [shapData, setShapData] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  const fetchRealPredictiveData = async (id) => {
    try {
      setLoading(true);
      
      // Consultamos los 12 meses en paralelo para construir la serie de tiempo real
      const monthsToFetch = Array.from({ length: 12 }, (_, i) => i + 1);
      const results = await Promise.all(
        monthsToFetch.map(mes => fetchApi(`/admin/predecir-demanda?mes=${mes}`))
      );
      
      // Obtenemos los datos predictivos reales del programa para el mes objetivo
      const targetMonthRes = results[targetMonth - 1];
      const progData = targetMonthRes.predicciones.find(p => p.programa_id == id);
      
      if (!progData) {
        throw new Error("El programa no se encontró en las predicciones (puede que no esté activo).");
      }

      // Llenamos la serie de tiempo con las predicciones reales del backend para cada uno de los 12 meses
      const generatedSeries = [];
      
      for (let i = 1; i <= 12; i++) {
        const resForMonth = results[i - 1];
        const monthProgData = resForMonth.predicciones.find(p => p.programa_id == id);
        const predicted = monthProgData ? Math.round(monthProgData.demanda_predicha) : 0;
        
        generatedSeries.push({
          mes: MESES[i - 1],
          demanda: predicted
        });
      }
      
      setTimeSeriesData(generatedSeries);
      
      // Extraemos y ordenamos los valores SHAP reales devueltos por XGBoost para el mes objetivo
      const shapEntries = Object.entries(progData.shap_values)
        .map(([key, value]) => ({
          name: key.replace('Categoria_', 'Cat: ').replace('Tipo_Programa_', 'Tipo: '),
          value: value,
          color: value >= 0 ? '#51cf66' : '#ff6b6b'
        }))
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
        .slice(0, 6);
        
      setShapData(shapEntries);
      
      // Asignamos las métricas
      setMetrics({
        confiabilidad: 85.4, // Este R2 viene del entrenamiento base
        mae: 3.49,
        rmse: 4.82,
        promedioMensual: Math.round(progData.demanda_predicha) // Demanda real para el mes objetivo
      });
      
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (programId) {
      fetchRealPredictiveData(programId);
    }
  }, [programId]);

  const handlePrint = () => {
    window.print();
  };

  if (!programId && !loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'var(--panel-bg)', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginTop: '2rem' }}>
        <Star size={64} color="#f1c40f" style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>No hay ningún programa seleccionado</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem auto' }}>
          Para ver el reporte predictivo detallado, primero debes ir al Gestor de Programas y marcar un programa con la estrella amarilla.
        </p>
        <Link to="/dashboard" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.8rem 1.5rem', backgroundColor: 'var(--color-primary)', color: 'white',
          textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold'
        }}>
          <ArrowLeft size={18} /> Ir al Gestor de Programas
        </Link>
      </div>
    );
  }

  if (error) {
    return <p style={{ color: 'red', textAlign: 'center', marginTop: '2rem' }}>Error: {error}</p>;
  }

  return (
    <div className="detalle-predictivo-container" style={{ paddingBottom: '4rem' }}>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        @media print {
          body * { visibility: hidden; }
          .detalle-predictivo-container, .detalle-predictivo-container * {
            visibility: visible;
          }
          .detalle-predictivo-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 0 !important;
          }
          .no-print { display: none !important; }
          .glass-panel { box-shadow: none !important; border: 1px solid #ddd !important; break-inside: avoid; }
          h2, h3, h4 { color: #000 !important; }
        }
      `}</style>

      {/* Cabecera y Botón Imprimir */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
            <Link to="/dashboard/ia-demanda" style={{ color: 'var(--color-accent)', display: 'flex', alignItems: 'center', textDecoration: 'none', fontWeight: 'bold' }}>
              <ArrowLeft size={18} style={{ marginRight: '4px' }}/> Ver Ranking de Programas
            </Link>
          </div>
          <h2 style={{ color: 'var(--text-title)', margin: 0, fontSize: '2.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Brain size={32} color="var(--color-accent)" /> Detalle Predictivo
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
            Análisis profundo de inferencia y explicabilidad (SHAP)
          </p>
        </div>
        
        <button 
          onClick={handlePrint}
          className="no-print"
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', 
            backgroundColor: 'var(--color-accent)', color: 'white', border: 'none', 
            borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(3, 143, 186, 0.3)', transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Download size={20} /> Exportar Reporte PDF
        </button>
      </div>

      {loading ? (
         <div style={{ 
          height: '50vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' 
        }}>
          <div className="spinner" style={{ width: '50px', height: '50px', border: '4px solid var(--color-accent-light)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-main)', fontWeight: 'bold' }}>Generando Inferencia Matemática para <span style={{ color: 'var(--color-accent)' }}>{programName}</span>...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Header del Reporte */}
          <div className="glass-panel" style={{ padding: '2rem', backgroundColor: 'var(--color-primary-dark)', color: 'white', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-5%', top: '-50%', opacity: 0.1 }}>
              <Star size={300} fill="white" />
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.85rem', color: 'var(--color-accent-light)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Programa Seleccionado
              </div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '2.2rem', fontWeight: '800', lineHeight: 1.2, color: '#ffffff' }}>
                {programName}
              </h3>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Demanda Proyectada en {MESES[targetMonth - 1]}</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--color-accent-light)' }}>{metrics?.promedioMensual} inscritos</div>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico SHAP Explicativo (Nueva sección agregada) */}
          <div className="glass-panel" style={{ padding: '2rem', backgroundColor: 'var(--panel-bg)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Brain size={24} color="var(--color-accent)" /> 
              Análisis de Explicabilidad (SHAP Values)
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Este gráfico explica matemáticamente por qué la IA predice este número de inscritos. Las barras verdes indican factores que <strong>aumentan</strong> la demanda, y las rojas indican factores que la <strong>disminuyen</strong>.
            </p>
            
            <div style={{ height: '250px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shapData} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                  <XAxis type="number" tick={{fill: 'var(--text-muted)'}} />
                  <YAxis dataKey="name" type="category" width={100} tick={{fill: 'var(--text-main)', fontSize: 12, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    {shapData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fila de Métricas de Confiabilidad */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {/* Confiabilidad (R2 modificado) */}
            <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71' }}>
                <ShieldCheck size={32} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Índice de Confiabilidad (R²)</h4>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--text-main)' }}>{metrics?.confiabilidad}%</span>
                </div>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Porcentaje de seguridad que tenemos en esta predicción basada en el comportamiento histórico del catálogo.
                </p>
              </div>
            </div>

            {/* Incertidumbre / Margen de Error (MAE) */}
            <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c' }}>
                <AlertTriangle size={32} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Margen de Incertidumbre</h4>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--text-main)' }}>±{metrics?.mae}</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>inscritos</span>
                </div>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Margen de variación absoluto estimado del modelo XGBoost.
                </p>
              </div>
            </div>
            
            {/* Penalización de errores grandes (RMSE) */}
            <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(52, 152, 219, 0.1)', color: '#3498db' }}>
                <Info size={32} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Volatilidad Esperada (RMSE)</h4>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--text-main)' }}>{metrics?.rmse}</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>inscritos</span>
                </div>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Penalización de grandes desviaciones en los datos históricos.
                </p>
              </div>
            </div>
          </div>

          {/* Gráfico de Proyección a 12 Meses */}
          <div className="glass-panel" style={{ padding: '2rem', backgroundColor: 'var(--panel-bg)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp size={24} color="var(--color-accent)" /> 
              Proyección de Demanda Estacional a 12 Meses
            </h3>
            
            <div style={{ height: '350px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDemanda" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="mes" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="demanda" 
                    stroke="var(--color-accent)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorDemanda)" 
                    activeDot={{ r: 6, fill: "var(--color-primary)", stroke: "white", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              *La proyección incorpora patrones de estacionalidad académica y sensibilidad histórica a precios/categorías basada en Random Forest y XGBoost.
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default IAPredictivaDetalle;

