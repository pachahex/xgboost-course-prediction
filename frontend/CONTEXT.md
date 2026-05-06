# Contexto de Desarrollo: Frontend (React)

## 🎨 Principios de Diseño y UX
- **Estética Académica**: Look premium, limpio y profesional. Uso de fuentes modernas (Inter/Outfit) y efectos de cristal (Glassmorphism).
- **Consistencia Visual**: Todas las herramientas administrativas deben seguir el mismo lenguaje de diseño basado en paneles translúcidos y micro-interacciones.

## 🛠️ Tecnologías y Reglas
- **Core**: React 19 + Vite.
- **Estilos**: Vanilla CSS centralizado en `index.css`. Prohibido usar estilos inline extensos o Tailwind a menos que se solicite explícitamente.
- **Iconografía**: `lucide-react`. Usar iconos consistentes:
    - **Editar**: `Pencil`. Siempre visible en listas.
    - **Borrar**: `Trash2`. Elimina el programa de la gestión administrativa y web.
    - **Visibilidad**: `Eye`/`EyeOff` solo para controles de toggle, no para eliminación.

## 🚀 Comunicación con la API
- **Helper Central**: Usar siempre `fetchApi` de `src/api.js`.
- **Reglas de Fetch**:
    - Usar rutas relativas (ej: `/admin/programas/all`). El proxy de Vite se encarga de dirigirlo al puerto 5000.
    - `fetchApi` maneja automáticamente `credentials: 'include'` para las cookies HTTP-Only de sesión.
    - **Soporte de Archivos**: `fetchApi` detecta automáticamente si el `body` es `FormData` y elimina el header `Content-Type: application/json` para permitir que el navegador gestione los límites del archivo (multipart/form-data).

## 📊 Gestión de Programas
- **Diferenciación de Estados**:
    - **Visibilidad Web**: Se controla mediante el campo `activo` (Checkbox en el formulario).
    - **Borrado Lógico**: Se ejecuta mediante el botón de basura (`DELETE`). El programa desaparece de la vista del usuario pero persiste en la DB para entrenamiento de XGBoost.
- **Optimización de UI**: La vista de lista prioriza la densidad de datos sobre la estética de tarjetas, permitiendo búsquedas y filtrados rápidos.

## 🔐 Autenticación y Registro
- **Restricciones de Negocio**:
    - **Edad**: Los estudiantes deben tener mínimo 16 años.
    - **Nombres**: Deben incluir al menos dos palabras reales para asegurar la calidad de los certificados de culminación.
- **Seguridad**:
    - **Contraseñas**: Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo. Formularios compatibles con gestores de contraseñas (`autoComplete="new-password"`).
    - **Verificación de Correo**: Todo registro desencadena el envío de un email. Los usuarios sin verificar verán un "Banner Constante" en el DashboardLayout.
    - **Recuperación**: Proceso "Forgot Password" integrado fluidamente en la vista de Login (Step 4).

## 📱 Responsividad y Dashboard
- **Enfoque Mobile-First**: Dado que la mayoría de los estudiantes acceden desde móviles, todos los componentes del Dashboard deben ser responsivos.
- **Sistema de Layout**:
    - Usar las clases `.dashboard-container`, `.dashboard-sidebar` y `.dashboard-main` de `index.css`.
    - En móviles, la barra lateral se oculta y se activa mediante un botón de menú (hamburguesa) gestionado por el estado `isSidebarOpen`.
    - **Aislamiento de Navegación**: El Navbar público debe ocultarse automáticamente en rutas `/dashboard` para evitar conflictos visuales y duplicidad de cabeceras en móviles. El DashboardLayout debe proveer su propia navegación e integración de salida (Logout / Volver a la Web).
- **Utilidades**: Utilizar la clase `.flex-stack` para elementos que deban estar en fila en escritorio pero apilarse verticalmente en móviles (Break point: 768px).

## 📧 Email Marketing y Suscripciones
- **Rol Estudiante**: Los estudiantes gestionan sus preferencias de suscripción al boletín a través de la pestaña de `Perfil y Preferencias` (`/dashboard/preferencias`). Esta vista actualiza dinámicamente la base de datos para incluirlos o sacarlos de las campañas.
- **Rol Administrador**: El administrador cuenta con la vista `Mailing.jsx`, que permite:
    - Enviar correos masivos y personalizados en HTML.
    - Adjuntar imágenes opcionales para campañas promocionales.
    - Acceder directamente a la Página de Facebook para complementar la estrategia de marketing digital.
