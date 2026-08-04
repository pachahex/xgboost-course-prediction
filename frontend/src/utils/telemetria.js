/**
 * Módulo de Telemetría Propia — Autopoiesis Certum
 * Captura visitas y clics de forma asíncrona y no bloqueante.
 * Reemplaza Google Analytics 4 con datos propios almacenados en la BD.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const ENDPOINT = `${API_BASE.endsWith('/api') ? API_BASE : API_BASE + '/api'}/telemetria/evento`;

// Genera o recupera un session_id único para esta sesión del navegador
const getSessionId = () => {
  let sid = sessionStorage.getItem('_tel_sid');
  if (!sid) {
    sid = 'sess-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
    sessionStorage.setItem('_tel_sid', sid);
  }
  return sid;
};

/**
 * Registra un evento de telemetría de forma asíncrona (fire-and-forget).
 * No bloquea el hilo principal ni el renderizado.
 *
 * @param {string} tipo - 'pageview' | 'click' | 'cta'
 * @param {Object} opciones - { elemento, programa_id, duracion_segundos }
 */
export const telemetryEvent = (tipo = 'pageview', opciones = {}) => {
  try {
    const payload = {
      session_id: getSessionId(),
      ruta: window.location.pathname,
      tipo_evento: tipo,
      elemento: opciones.elemento || null,
      programa_id: opciones.programa_id || null,
      referrer: document.referrer || null,
      duracion_segundos: opciones.duracion_segundos || 0
    };

    // Usar sendBeacon si está disponible (más confiable al cerrar página)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(ENDPOINT, blob);
    } else {
      // Fallback: fetch con keepalive
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {}); // Silenciar errores — no crítico
    }
  } catch (e) {
    // Nunca debe romper la aplicación
    console.debug('[telemetría] error no crítico:', e);
  }
};

/**
 * Hook React para registrar pageviews automáticamente.
 * Úsalo en cada página con: useTelemetryPageview();
 */
export const useTelemetryPageview = (opciones = {}) => {
  // Importar useEffect dinámicamente para no crear dependencia circular
  const { useEffect } = require('react');
  
  useEffect(() => {
    const startTime = Date.now();
    telemetryEvent('pageview', opciones);
    
    return () => {
      // Al desmontar: registrar duración
      const duracion = Math.round((Date.now() - startTime) / 1000);
      if (duracion > 2) {
        telemetryEvent('pageview_exit', { ...opciones, duracion_segundos: duracion });
      }
    };
  }, []);
};

/**
 * Registra un clic en un elemento específico.
 * @param {string} elementoId - Identificador del elemento clicado
 * @param {Object} opciones - { programa_id }
 */
export const telemetryClick = (elementoId, opciones = {}) => {
  telemetryEvent('click', { ...opciones, elemento: elementoId });
};

export default { telemetryEvent, useTelemetryPageview, telemetryClick };
