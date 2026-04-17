import React from 'react';

const Diplomados = () => {
  return (
    <div style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
      <h1>Nuestros Diplomados</h1>
      <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '3rem' }}>
        Programas de posgrado de excelencia avalados internacionalmente.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'left', borderTop: '4px solid var(--color-primary)' }}>
          <h2 style={{ color: 'var(--color-primary-dark)' }}>Terapia Cognitivo Conductual</h2>
          <p style={{ color: '#555', lineHeight: '1.6' }}>
            Explora las herramientas cognitivo-conductuales avanzadas aplicables a entornos clínicos con casos reales.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--color-accent)', fontWeight: 'bold', fontSize: '1.2rem' }}>2500 Bs.</span>
            <button style={{ backgroundColor: 'var(--color-primary)' }}>Solicitar info</button>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'left', borderTop: '4px solid var(--color-accent)' }}>
          <h2 style={{ color: 'var(--color-primary-dark)' }}>Derecho de Familia (Ley 348)</h2>
          <p style={{ color: '#555', lineHeight: '1.6' }}>
            Especialidad jurídica enfocada en la normativa vigente, defensa y procedimientos sobre la Ley 348.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--color-accent)', fontWeight: 'bold', fontSize: '1.2rem' }}>2200 Bs.</span>
            <button style={{ backgroundColor: 'var(--color-primary)' }}>Solicitar info</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Diplomados;
