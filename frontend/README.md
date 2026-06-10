# Frontend - Academia Autopoiesis

Este directorio contiene la aplicación cliente (interfaz de usuario) desarrollada con React y Vite.

## Tecnologías Principales
- **React 18**
- **Vite**
- **React Router DOM** (enrutamiento SPA)
- **Recharts** (gráficos y proyecciones visuales)
- **Lucide React** (iconografía)

## Cómo iniciar el proyecto (Docentes / Tribunal)

Para levantar **todo el ecosistema** (Frontend, Backend, Base de Datos y Jupyter) de forma automática sin necesidad de instalar NodeJS ni Python en tu computadora, solo necesitas Docker y ejecutar el siguiente comando desde la **raíz del proyecto** (una carpeta atrás):

```bash
docker-compose up -d --build
```

Una vez que los contenedores estén corriendo, el frontend estará disponible en:
👉 **http://localhost:3000**

### Comandos Adicionales del Sistema (se ejecutan desde la raíz)
Si es la primera vez que levantas el proyecto o la base de datos está vacía, necesitas importar los datos iniciales y entrenar el modelo de Inteligencia Artificial. Puedes hacerlo ejecutando estos comandos en la terminal:

1. **Importar datos a la base de datos PostgreSQL:**
```bash
docker exec -it xgboost-course-prediction-backend-1 python import_data.py
```

2. **Entrenar el modelo predictivo XGBoost (Genera métricas y archivo .pkl):**
```bash
docker exec -it xgboost-course-prediction-backend-1 python ml/train_model.py
```

---
*Para más detalles sobre la API y la inteligencia artificial, consulta el `README.md` ubicado en la carpeta `/backend`.*

## Principios de Diseño y Arquitectura
- **Estética Académica**: Diseño limpio y profesional usando fuentes modernas (Inter/Outfit) y efectos Glassmorphism.
- **Iconografía**: Se utiliza `lucide-react`.

## Comunicación con la API
- **Helper Central**: Utilizar `fetchApi` de `src/api.js`.
- Este helper maneja automáticamente `credentials: 'include'` para cookies HTTP-Only y detecta el envío de `FormData` para subida de archivos (imágenes).

## Gestión de Estado y UI
- **Borrado Lógico**: La eliminación de programas es lógica para preservar datos para la IA.
- **Responsividad**: Enfoque Mobile-First. El Dashboard oculta la barra lateral en dispositivos móviles.
- **Optimizaciones**: Uso de `localStorage` para persistir preferencias (ej. viewMode) y carga diferida (lazy loading) para imágenes.

## Autenticación
- Reglas de negocio estrictas: Mínimo 16 años, nombres completos reales.
- Las contraseñas requieren alta seguridad y se integran validaciones de correo electrónico obligatorias.
