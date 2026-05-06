import React, { useState, useRef } from 'react';
import { fetchApi } from '../../api';
import { Mail, Image as ImageIcon, ExternalLink, X, Send, Loader2 } from 'lucide-react';

const Mailing = () => {
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [imagen, setImagen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImagen(e.target.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setImagen(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    
    try {
      const formData = new FormData();
      formData.append('asunto', asunto);
      formData.append('mensaje', mensaje);
      if (imagen) {
        formData.append('imagen', imagen);
      }

      // Requerimos usar un fetch customizado o modificar fetchApi si no soporta FormData
      // Aquí asumo que si pasamos FormData a fetchApi sin headers manuales, el navegador seteará el content-type multipart
      // Depende de la implementación de fetchApi, pero lo usual es omitir el 'Content-Type' si body es FormData.
      const res = await fetchApi('/admin/mailing/send', {
        method: 'POST',
        body: formData,
        isFormData: true // Si tu fetchApi soporta esta bandera para no hacer JSON.stringify ni poner Content-Type: application/json
      });

      setFeedback({ type: 'success', text: `${res.message} Se ha enviado a ${res.destinatarios} suscriptor(es).` });
      setAsunto('');
      setMensaje('');
      handleRemoveImage();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Error al enviar la campaña.' });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { 
    width: '100%', 
    padding: '0.8rem', 
    borderRadius: '8px', 
    border: '1px solid var(--glass-border)', 
    backgroundColor: 'var(--bg-page)', 
    color: 'var(--text-main)', 
    marginBottom: '1.5rem', 
    outline: 'none',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', alignItems: 'start' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ backgroundColor: 'var(--color-primary)', padding: '0.8rem', borderRadius: '12px', color: 'white' }}>
            <Mail size={24} />
          </div>
          <div>
            <h2 style={{ color: 'var(--color-primary-dark)', margin: 0 }}>Módulo de Email Marketing</h2>
            <p style={{ color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>Envía boletines y actualizaciones a tu lista de suscriptores.</p>
          </div>
        </div>

        {feedback && (
          <div style={{ padding: '1rem', marginBottom: '2rem', borderRadius: '8px', backgroundColor: feedback.type === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)', color: feedback.type === 'success' ? '#2e7d32' : '#d32f2f', border: `1px solid ${feedback.type === 'success' ? '#4caf50' : '#f44336'}` }}>
            {feedback.text}
          </div>
        )}

        <form onSubmit={handleSend} style={{ backgroundColor: 'var(--panel-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 6px var(--glass-shadow)' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>Asunto de la Campaña</label>
          <input type="text" value={asunto} onChange={(e) => setAsunto(e.target.value)} required style={inputStyle} placeholder="Ej. ¡Lanzamos un nuevo Diplomado en IA!" />

          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>Mensaje del Boletín</label>
          <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} required style={{ ...inputStyle, minHeight: '200px', resize: 'vertical' }} placeholder="Escribe el contenido de tu boletín aquí..."></textarea>

          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>Imagen Adjunta (Opcional, para Marketing)</label>
          
          <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange} 
              ref={fileInputRef}
              style={{ display: 'none' }}
              id="image-upload"
            />
            <label htmlFor="image-upload" style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem',
              backgroundColor: 'rgba(255,255,255,0.05)', border: '1px dashed var(--color-primary)',
              borderRadius: '8px', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: '500', transition: 'all 0.2s'
            }}>
              <ImageIcon size={18} /> Seleccionar Imagen
            </label>
            
            {imagen && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(76, 175, 80, 0.1)', padding: '0.5rem 1rem', borderRadius: '20px', color: '#2e7d32', fontSize: '0.9rem' }}>
                <ImageIcon size={14} /> {imagen.name}
                <button type="button" onClick={handleRemoveImage} style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', backgroundColor: 'var(--color-accent)', color: 'white', fontWeight: 'bold', padding: '1rem', borderRadius: '8px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'background-color 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {loading ? (
              <><Loader2 size={18} style={{ animation: 'spin 2s linear infinite' }} /> Enviando Campaña...</>
            ) : (
              <><Send size={18} /> Enviar Boletín a Suscriptores</>
            )}
          </button>
        </form>
      </div>

      {/* Sidebar de Marketing */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ backgroundColor: 'var(--color-primary-dark)', color: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Estrategia de Marketing
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            Mantén a tus estudiantes actualizados sobre nuevos cursos, ofertas y noticias importantes. 
            El marketing efectivo combina correos electrónicos regulares con una fuerte presencia en redes sociales.
          </p>
          
          <a 
            href="https://www.facebook.com/profile.php?id=61558489603407" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              backgroundColor: '#1877F2', color: 'white', textDecoration: 'none',
              padding: '0.8rem', borderRadius: '8px', fontWeight: 'bold', transition: 'opacity 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            Página Oficial de Facebook <ExternalLink size={16} />
          </a>
        </div>

        <div style={{ backgroundColor: 'var(--panel-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <h4 style={{ color: 'var(--color-primary)', margin: '0 0 1rem 0' }}>Tips de Envío</h4>
          <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <li>No envíes correos masivos de noche. El mejor horario suele ser a media mañana.</li>
            <li>Usa imágenes llamativas (flyers) si estás promocionando un nuevo diplomado.</li>
            <li>Mantén el mensaje corto y directo. Si es largo, añade párrafos espaciados.</li>
            <li>El correo será enviado a todos los estudiantes que hayan activado su suscripción en su perfil.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Mailing;
