const base = import.meta.env.VITE_API_URL || '/api';
export const API_URL = base.endsWith('/api') ? base : `${base}/api`;

// Función genérica para fetch centralizado, maneja HTTP-Only auth passthrough
export const fetchApi = async (endpoint, options = {}) => {
  const mergedOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    // Necesario para enviar y recibir Cookies HTTP-Only con Flask
    credentials: 'include' 
  };

  const response = await fetch(`${API_URL}${endpoint}`, mergedOptions);
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || `Error HTTP: ${response.status}`);
  }

  return data;
};
