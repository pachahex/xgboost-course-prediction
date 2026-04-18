import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

const IAPredictiva = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPoint, setSelectedPoint] = useState(null);

  useEffect(() => {
    const loadPredictions = async () => {
      setLoading(true);
      setError('');
      try {
        // En una app real, aquí podríamos filtrar por programa con un select dropdown
        // Petición al endpoint creado recien
        const res = await fetchApi('/admin/predicciones');
        setData(res);
        if (res.length > 0) {
          setSelectedPoint(res[res.length - 1]); // Cargar el ultimo punto por defecto para SHAP
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadPredictions();
  }, []);

  const handleChartClick = (state) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      setSelectedPoint(state.activePayload[0].payload);
    }
  };

  // Transformar el diccionario SHAP para Recharts
  const formatShapData = (shapDict) => {
    if (!shapDict) return [];
    
    // Convertimos las llaves del json a un arreglo amable
    const items = Object.entries(shapDict)
      .filter(([key]) => key !== 'base_value')
      .map(([key, value]) => ({
        caracteristica: key.replace('_impact', '').replace(/_/g, ' '),
        impacto: parseFloat(value.toFixed(2))
      }));
      
    // Sort por magnitud abs
    return items.sort((a,b) => Math.abs(b.impacto) - Math.abs(a.impacto));
  };

  if (loading) return <p>Entrenando e infiriendo predicciones... 🤖</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!data || data.length === 0) return <p>No hay data transaccional agrupada disponible.</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: 'var(--color-primary-dark)' }}>📊 Predicción Analítica con XGBoost</h2>
        <span style={{ backgroundColor: 'var(--color-accent-light)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', color: 'white' }}>
          Modelo Global Actualizado
        </span>
      </div>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Visualiza el performance del modelo vs demanda real a través del tiempo, e inspecciona la explicación paramétrica (SHAP values) clickeando en cualquier punto de la gráfica.
      </p>

      {/* Gráfico 1: Predicción vs Realidad con Recharts */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', height: '400px', backgroundColor: 'white' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--color-primary)' }}>Curva de Demanda Semanal</h3>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={data} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="periodo" tick={{fontSize: 12}} />
            <YAxis />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}/>
            <Legend verticalAlign="top" height={36}/>
            <Line type="monotone" name="Demanda Real" dataKey="demanda_real" stroke="#82ca9d" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            <Line type="monotone" name="Proyección XGBoost" dataKey="demanda_predicha" stroke="var(--color-accent)" strokeDasharray="5 5" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico 2: Explicabilidad SHAP (Tornado) */}
      {selectedPoint && selectedPoint.shap && (
        <div style={{ padding: '2rem', backgroundColor: '#f9f9fa', border: '1px solid #ebeeef', borderRadius: '12px' }}>
          <h3 style={{ marginTop: 0, color: 'var(--color-primary-dark)' }}>
            Explicabilidad del Modelo (SHAP)
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
            ¿Por qué la predicción para <strong>{selectedPoint.periodo}</strong> ({selectedPoint.programa}) es de <strong>{selectedPoint.demanda_predicha} estudiantes</strong>? 
            <br />
            <em>Valor Base Matemático: {selectedPoint.shap.base_value?.toFixed(2)}</em>
          </p>

          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={formatShapData(selectedPoint.shap)}
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="caracteristica" type="category" width={120} tick={{fontSize: 12}} />
                <Tooltip formatter={(value) => [`${value > 0 ? '+' : ''}${value}`, 'Magnitud de Impacto']} />
                <ReferenceLine x={0} stroke="#000" />
                <Bar dataKey="impacto" radius={[0, 4, 4, 0]}>
                  {
                    formatShapData(selectedPoint.shap).map((entry, index) => (
                      <cell key={`cell-${index}`} fill={entry.impacto > 0 ? '#ff6b6b' : '#339af0'} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: '1rem', color: '#999' }}>
            Rojo: Incrementa la demanda esperada. Azul: Disminuye la demanda esperada respecto de la media.
          </p>
        </div>
      )}
    </div>
  );
};

export default IAPredictiva;
