# CONTEXT.md - Registro de Consistencia y Branding

Este documento sirve como la fuente de verdad para la identidad visual y lógica del proyecto `xgboost-course-prediction`. Su objetivo es asegurar que cualquier cambio futuro mantenga la coherencia con la marca y la arquitectura establecida.

---

## 🎨 Identidad Visual (Branding)

### Tipografía
- **Fuente Principal**: Inter / Roboto (Sugerido para un look moderno).
- **Títulos**: Peso 800 para el logo y 700 para encabezados de sección.

### Paleta de Colores
*Actualmente gestionada por variables CSS en `index.css`:*
- `--color-primary`: Color principal de la marca.
- `--color-primary-dark`: Variante oscura para degradados y footers.
- `--color-accent`: Color de énfasis para botones de acción (CTAs).
- `--bg-page`: Fondo de la página (dinámico según el tema).
- `--panel-bg`: Fondo de los paneles tipo "glass-panel".

### Iconografía
- **Librería**: `lucide-react`.
- **Regla**: Evitar el uso de emojis en la interfaz principal. Usar iconos de Lucide con pesos y tamaños consistentes.
- **Estilo**: Líneas limpias, sin rellenos pesados, adaptables al color del texto actual.

---

## 📂 Gestión de Assets

### Ubicación de Imágenes y Logos
- **`frontend/src/assets/`**: Logos en formato PNG (para compatibilidad) y SVG (para nitidez máxima en web).
- **`frontend/public/`**: Favicon del navegador (`favicon.svg`) y otros assets que deben servirse directamente.

### Convenciones
- El logo principal debe tener una versión en SVG para el Navbar.
- Las imágenes de los cursos deben estar optimizadas antes de subirse.

---

## ⚙️ Implementaciones Lógicas

### Estándares de Código
- Uso de **React 19** con hooks.
- Navegación gestionada por **React Router v7**.
- Comunicación con el backend centralizada en `frontend/src/api.js`.

### Seguridad y Acceso
- **2FA**: Implementado para administradores mediante TOTP.
- **RBAC**: Roles de Administrador, Estudiante y Suscriptor definidos.

---

## 📱 Guía de Responsividad y Estructura Base

Para mantener un proyecto escalable y adaptable a todos los dispositivos, nos regimos por el principio **Mobile-First**.

### Breakpoints Oficiales (en `index.css`)
- **Móvil (Por defecto)**: Base del diseño. Todo debe apilarse verticalmente a menos que se indique lo contrario.
- **Tablet (`md`)**: `@media (min-width: 768px)`
- **Desktop (`lg`)**: `@media (min-width: 1024px)`

### Regla de Oro del Layout
> [!WARNING]  
> **Cero Estilos en Línea para Estructura**: Está estrictamente prohibido usar el atributo `style={{ display: 'flex', padding: '...', ... }}` para construir layouts en los componentes de React, ya que no soportan Media Queries. 

Para la estructura, se DEBEN utilizar las **Clases Utilitarias Globales** definidas en `index.css`:
- `.container`: Contenedor centralizado con ancho máximo adaptativo.
- `.section-padding`: Paddings verticales estandarizados para separar secciones.
- `.grid-responsive`: Cuadrícula auto-adaptable (ideal para tarjetas).
- `.flex-stack`: Flexbox que es columna en móvil y fila en tablet/desktop.

---

## 📝 Registro de Cambios Significativos (Log)

| Fecha | Tipo | Descripción del Cambio | Razón |
| :--- | :--- | :--- | :--- |
| 2026-05-01 | Branding | Propuesta de reemplazo de emojis por `lucide-react`. | Profesionalización de la UI. |
| 2026-05-01 | Doc | Creación de `CONTEXT.md`. | Mantener consistencia a largo plazo. |
| 2026-05-01 | UI | Implementación de iconos en Navbar, Footer, Home, Cursos y Diplomados. | Branding potente y profesional. |
| 2026-05-01 | Assets | Integración de nuevos logos (SVG/PNG). | Consistencia visual. |
| 2026-05-02 | UI | Ajuste de ancho de inputs en formularios de Login y Registro al 100%. | Consistencia visual con botones. |
| 2026-05-02 | UI | Reducción de padding superior en sección de Áreas de Estudio en Home. | Mejora de proporciones y flujo visual. |
| 2026-05-02 | UI | Implementación de Pop-out Preview (imagen grande flotante) en hover. | Visualización de imágenes reales sin recortes. |

---

*Nota: Actualiza este documento con cada decisión importante de diseño o arquitectura.*
