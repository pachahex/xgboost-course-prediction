import React from 'react';

const Cursos = () => {
  return (
    <div style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
      <h1>Cursos Cortos y Especializados</h1>
      <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '3rem' }}>
        Actualiza tus habilidades en pocas semanas con nuestra oferta de cursos.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ color: 'var(--color-primary-dark)' }}>Dependencia Emocional</h3>
          <p>Profundización en técnicas terapéuticas modernas.</p>
          <span style={{ display: 'inline-block', marginTop: '1rem', color: 'var(--color-accent)', fontWeight: 'bold' }}>100 Bs.</span>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ color: 'var(--color-primary-dark)' }}>Técnicas de Litigación</h3>
          <p>Preparación intensiva para abogados y futuros juristas.</p>
          <span style={{ display: 'inline-block', marginTop: '1rem', color: 'var(--color-accent)', fontWeight: 'bold' }}>150 Bs.</span>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ color: 'var(--color-primary-dark)' }}>Tecnologías Web</h3>
          <p>Desarrollo front-end y back-end básico.</p>
          <span style={{ display: 'inline-block', marginTop: '1rem', color: 'var(--color-accent)', fontWeight: 'bold' }}>200 Bs.</span>
        </div>
      </div>
    </div>
  );
};

export default Cursos;
