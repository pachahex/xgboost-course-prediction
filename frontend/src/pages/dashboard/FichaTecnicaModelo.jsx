import React from 'react';
import { Brain, Calendar, Database, Activity, Target, Layers } from 'lucide-react';

const FichaTecnicaModelo = () => {
  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--color-primary-dark)', margin: 0, fontSize: '2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Brain size={32} color="var(--color-accent)" /> Ficha Técnica del Modelo (XGBoost)
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
          Toda la información sobre el último entrenamiento ejecutado, variables utilizadas y métricas de confiabilidad.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Fecha de Entrenamiento */}
        <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(52, 152, 219, 0.1)', color: '#3498db' }}>
            <Calendar size={32} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Último Entrenamiento</h4>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>5 de Junio de 2026</div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Modelo entrenado y serializado en formato PKL.</p>
          </div>
        </div>

        {/* Datos Procesados */}
        <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71' }}>
            <Database size={32} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Volumen de Datos</h4>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)' }}>309 Cohortes</div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Registros históricos consolidados por programa y período académico (cohortes_dataset.csv).</p>
          </div>
        </div>

        {/* Variables Utilizadas */}
        <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(155, 89, 182, 0.1)', color: '#9b59b6' }}>
            <Layers size={32} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Características (Features)</h4>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1.4 }}>
              Mes, Costo, Modalidad,<br/>Tipo de Programa, Categoría
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>One-Hot Encoding aplicado a variables categóricas.</p>
          </div>
        </div>
      </div>

      {/* Métricas de Evaluación */}
      <h3 style={{ color: 'var(--color-primary-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Target size={24} color="var(--color-accent)" /> Rendimiento y Confiabilidad (Testing Set)
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Confiabilidad (R²)</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#2ecc71' }}>85.4%</div>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Porcentaje de exactitud general del modelo XGBoost.</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Error Absoluto (MAE)</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#e74c3c' }}>±3.49</div>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Desviación promedio en cantidad de inscritos.</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', backgroundColor: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Volatilidad (RMSE)</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#f39c12' }}>4.82</div>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Penalización de errores grandes.</p>
        </div>
      </div>

      {/* Explicabilidad Técnica (Imágenes Estáticas) */}
      <h3 style={{ color: 'var(--color-primary-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Activity size={24} color="var(--color-accent)" /> Explicabilidad y Relaciones
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', backgroundColor: 'var(--panel-bg)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--color-primary-dark)', fontSize: '1.2rem' }}>
            Impacto de Variables (SHAP Values)
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Este gráfico de explicabilidad (SHAP) muestra qué variables influyen más al momento de predecir la demanda. El color rojo indica un valor alto en esa variable, y el azul un valor bajo.
          </p>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'center' }}>
            <img 
              src="/images/ia/shap_summary.png" 
              alt="SHAP Summary Plot" 
              style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
            />
            <div style={{ display: 'none', padding: '2rem', textAlign: 'center', color: '#999', backgroundColor: '#f9f9f9', width: '100%', borderRadius: '4px' }}>
              [Imagen SHAP no encontrada en public/]
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', backgroundColor: 'var(--panel-bg)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--color-primary-dark)', fontSize: '1.2rem' }}>
            Matriz de Correlación
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            La matriz de correlación nos permite visualizar las relaciones lineales e interacciones entre las distintas métricas de los programas académicos previo al entrenamiento.
          </p>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'center' }}>
            <img 
              src="/images/ia/G5_Correlaciones.png" 
              alt="Matriz de Correlación" 
              style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
            />
            <div style={{ display: 'none', padding: '2rem', textAlign: 'center', color: '#999', backgroundColor: '#f9f9f9', width: '100%', borderRadius: '4px' }}>
              [Imagen Correlaciones no encontrada en public/]
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FichaTecnicaModelo;
