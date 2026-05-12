import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchApi } from '../api';
import {
  User, Mail, Lock, Phone, Calendar, Briefcase, MapPin,
  UserPlus, ArrowRight, Quote, Eye, EyeOff
} from 'lucide-react';
import logo from '../assets/logo.jpg';

const quotes = [
  "La investigación es la llave del futuro.",
  "El conocimiento es poder, pero la acción es progreso.",
  "Potencia tu mente, transforma tu entorno.",
  "Cada dato es una oportunidad de aprendizaje.",
  "La excelencia académica es el camino a la innovación."
];

const Registro = () => {
  const [formData, setFormData] = useState({
    nombre_completo: '', correo: '', password: '',
    telefono: '', fecha_nacimiento: '', grado_academico_id: '', departamento_id: ''
  });
  const [departamentos, setDepartamentos] = useState([]);
  const [gradosAcademicos, setGradosAcademicos] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Ciclo de frases motivadoras
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % quotes.length);
        setFade(true);
      }, 500);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchApi('/departamentos')
      .then(res => setDepartamentos(res))
      .catch(err => console.error("Error al cargar departamentos:", err));

    fetchApi('/grados-academicos')
      .then(res => setGradosAcademicos(res))
      .catch(err => console.error("Error al cargar grados académicos:", err));
  }, []);

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 1. Validar Nombre Completo (al menos 2 palabras)
    const nombreLimpio = formData.nombre_completo.trim();
    if (nombreLimpio.split(' ').length < 2) {
      setError('Por favor, ingresa tu nombre y apellido reales para los certificados.');
      return;
    }

    // 2. Validar Fecha de Nacimiento (Mínimo 16 años)
    const fnac = new Date(formData.fecha_nacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fnac.getFullYear();
    const m = hoy.getMonth() - fnac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fnac.getDate())) {
      edad--;
    }
    if (edad < 16) {
      setError('Debes tener al menos 16 años para registrarte en la academia.');
      return;
    }

    // 3. Validar Correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.correo)) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    // 4. Validar Contraseña (Más flexible y explicativa)
    const pass = formData.password;
    if (pass.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (!/[A-Z]/.test(pass)) {
      setError('La contraseña debe incluir al menos una letra mayúscula.');
      return;
    }
    if (!/[a-z]/.test(pass)) {
      setError('La contraseña debe incluir al menos una letra minúscula.');
      return;
    }
    if (!/\d/.test(pass)) {
      setError('La contraseña debe incluir al menos un número.');
      return;
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pass)) {
      setError('La contraseña debe incluir al menos un carácter especial (ej: !@#$...).');
      return;
    }

    setLoading(true);

    try {
      const res = await fetchApi('/registro', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      setSuccess(res.message || '¡Cuenta creada! Revisa tu correo para verificar tu cuenta.');
      setTimeout(() => navigate('/login'), 3500);
    } catch (err) {
      setError(err.message || 'Error al registrar. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const inputGroupStyle = {
    position: 'relative',
    marginBottom: '1.25rem',
  };

  const iconStyle = {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--color-primary)',
    opacity: 0.7,
    pointerEvents: 'none'
  };

  const modernInputStyle = {
    width: '100%',
    padding: '0.8rem 1rem 0.8rem 2.5rem',
    borderRadius: '10px',
    border: '1px solid var(--glass-border)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'inherit',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-page)',
      padding: '1.5rem',
      position: 'relative'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '1100px',
        display: 'flex',
        flexDirection: window.innerWidth < 850 ? 'column' : 'row',
        overflow: 'hidden',
        minHeight: '650px',
        zIndex: 10
      }}>

        {/* Lado Izquierdo: Visual & Frases */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(225deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
          padding: '4rem 2rem',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <img
            src={logo}
            alt="Autopoiesis Logo"
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '20px',
              marginBottom: '2rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              objectFit: 'cover'
            }}
          />

          <div style={{ minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              transition: 'opacity 0.5s ease, transform 0.5s ease',
              opacity: fade ? 1 : 0,
              transform: fade ? 'translateY(0)' : 'translateY(10px)',
              maxWidth: '350px'
            }}>
              <Quote size={24} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1.3rem', fontWeight: '500', fontStyle: 'italic', lineHeight: '1.4' }}>
                "{quotes[quoteIndex]}"
              </p>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Formulario */}
        <div style={{
          flex: 1.3,
          padding: window.innerWidth < 480 ? '2.5rem 1.5rem' : '3rem',
          backgroundColor: 'var(--panel-bg)',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
            <UserPlus size={28} color="var(--color-primary)" />
            <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Únete a la Academia</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Empieza tu viaje hacia el conocimiento hoy mismo.</p>

          {error && <div style={{ backgroundColor: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid rgba(231, 76, 60, 0.2)' }}>{error}</div>}
          {success && <div style={{ backgroundColor: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid rgba(46, 204, 113, 0.2)' }}>{success}</div>}

          <form onSubmit={handleRegistro}>
            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 600 ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={iconStyle} />
                  <input type="text" name="nombre_completo" placeholder="Nombre completo" value={formData.nombre_completo} onChange={handleChange} required style={modernInputStyle} />
                </div>
                <small style={{ display: 'block', marginTop: '0.4rem', color: 'var(--text-muted)', fontSize: '0.72rem', lineHeight: '1.2' }}>
                  * Usa tu nombre real para los certificados.
                </small>
              </div>
              <div>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={iconStyle} />
                  <input type="email" name="correo" placeholder="Correo electrónico" value={formData.correo} onChange={handleChange} required style={modernInputStyle} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 600 ? '1fr' : '1fr 1fr', gap: '1rem' }}>
              <div style={inputGroupStyle}>
                <Lock size={18} style={iconStyle} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  placeholder="Contraseña" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  autoComplete="new-password" 
                  style={modernInputStyle} 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    zIndex: 5
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div style={inputGroupStyle}>
                <Phone size={18} style={iconStyle} />
                <input type="tel" name="telefono" placeholder="Teléfono" value={formData.telefono} onChange={handleChange} style={modernInputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 600 ? '1fr' : '1fr 1fr', gap: '1rem' }}>
              <div style={inputGroupStyle}>
                <Calendar size={18} style={iconStyle} />
                <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} required style={modernInputStyle} />
              </div>
              <div style={inputGroupStyle}>
                <MapPin size={18} style={iconStyle} />
                <select name="departamento_id" value={formData.departamento_id} onChange={handleChange} required style={modernInputStyle}>
                  <option value="">Departamento...</option>
                  {departamentos.map(dep => <option key={dep.id} value={dep.id}>{dep.nombre}</option>)}
                </select>
              </div>
            </div>

            <div style={inputGroupStyle}>
              <Briefcase size={18} style={iconStyle} />
              <select 
                name="grado_academico_id" 
                value={formData.grado_academico_id} 
                onChange={handleChange} 
                required 
                style={modernInputStyle}
              >
                <option value="">Nivel académico / Ocupación...</option>
                {gradosAcademicos.map(grado => (
                  <option key={grado.id} value={grado.id}>{grado.nombre}</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              padding: '1rem',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.8rem',
              marginTop: '1rem',
              transition: 'all 0.3s ease'
            }}>
              {loading ? 'Procesando...' : (
                <>
                  Crear mi cuenta <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>Inicia sesión aquí</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Registro;
