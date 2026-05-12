import React, { useState, useEffect } from 'react';
import { Terminal, Activity, RefreshCw, AlertCircle, Info, ShieldAlert } from 'lucide-react';

const Telemetria = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nivel, setNivel] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const query = nivel ? `?nivel=${nivel}` : '';
      const response = await fetch(`/api/dev/telemetria${query}`);
      const data = await response.json();
      if (response.ok) {
        setLogs(data);
      }
    } catch (error) {
      console.error("Error fetching telemetry:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 5000);
    }
    return () => clearInterval(interval);
  }, [nivel, autoRefresh]);

  const getNivelColor = (lvl) => {
    switch (lvl) {
      case 'ERROR': return '#ff7675';
      case 'WARNING': return '#fdcb6e';
      case 'CRITICAL': return '#d63031';
      default: return '#55efc4';
    }
  };

  const getNivelIcon = (lvl) => {
    switch (lvl) {
      case 'ERROR': return <AlertCircle size={16} />;
      case 'CRITICAL': return <ShieldAlert size={16} />;
      case 'WARNING': return <Info size={16} />;
      default: return <Activity size={16} />;
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Terminal size={24} color="var(--color-primary)" />
          <h2 style={{ margin: 0, color: 'var(--text-main)' }}>Telemetría Técnica</h2>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={() => setAutoRefresh(!autoRefresh)} 
            />
            Auto-refresh (5s)
          </label>
          <select 
            value={nivel} 
            onChange={(e) => setNivel(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--panel-bg)', color: 'var(--text-main)' }}
          >
            <option value="">Todos los niveles</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="ERROR">ERROR</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
          <button 
            onClick={fetchLogs} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', backgroundColor: 'var(--color-primary)', color: 'white', cursor: 'pointer' }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refrescar
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: '#1e272e', borderRadius: '8px', overflow: 'hidden', border: '1px solid #34495e' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #34495e', display: 'grid', gridTemplateColumns: '150px 100px 100px 200px 1fr 100px', fontWeight: 'bold', color: '#ecf0f1', fontSize: '0.85rem' }}>
          <div>FECHA</div>
          <div>NIVEL</div>
          <div>MÉTODO</div>
          <div>ENDPOINT</div>
          <div>EVENTO / DETALLES</div>
          <div>STATUS</div>
        </div>
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {logs.length > 0 ? logs.map(log => (
            <div key={log.id} style={{ padding: '0.8rem 1rem', borderBottom: '1px solid #2f3640', display: 'grid', gridTemplateColumns: '150px 100px 100px 200px 1fr 100px', fontSize: '0.8rem', fontFamily: 'monospace', color: '#dcdde1', alignItems: 'center' }}>
              <div style={{ opacity: 0.7 }}>{new Date(log.fecha).toLocaleTimeString()}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: getNivelColor(log.nivel) }}>
                {getNivelIcon(log.nivel)} {log.nivel}
              </div>
              <div style={{ fontWeight: 'bold' }}>{log.metodo}</div>
              <div style={{ color: '#3498db' }}>{log.endpoint}</div>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 'bold', color: '#ecf0f1' }}>{log.evento}</span>
                {log.detalles && <span style={{ opacity: 0.5, marginLeft: '0.5rem' }}>{JSON.stringify(log.detalles)}</span>}
              </div>
              <div style={{ fontWeight: 'bold', color: log.status_code >= 400 ? '#e74c3c' : '#2ecc71' }}>
                {log.status_code || '---'}
              </div>
            </div>
          )) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No se encontraron logs de telemetría.
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Telemetria;
