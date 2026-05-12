# 📚 Catálogo de Módulos del Proyecto: Autopoiesis Predictor

Este documento detalla los módulos funcionales del sistema, analizando cómo cada uno alimenta el pipeline de datos para el modelo de Inteligencia Artificial (XGBoost) y su posterior interpretación (SHAP).

---

## 1. Módulo: Gestión de Programas Académicos
**Ubicación:** `frontend/src/pages/dashboard/GestorProgramas.jsx`

Este módulo es la fuente principal de **características estáticas (Static Features)** para el modelo predictivo. Cada programa registrado actúa como un "nodo" de información que la IA utiliza para comparar con datos históricos de demanda.

### 📊 Relación con XGBoost (Ingeniería de Características)

Los datos capturados en este formulario se transforman en variables de entrada para el modelo:

| Dato de Gestión | Transformación para la IA | Impacto en la Predicción |
| :--- | :--- | :--- |
| **Categoría** | One-Hot Encoding | Identifica nichos de mercado con mayor tendencia (ej. "Psicología" vs "Derecho"). |
| **Tipo de Servicio** | Ordinal/One-Hot | Diferencia la intención de compra entre un producto corto (Curso) y uno largo (Diplomado). |
| **Modalidad** | One-Hot Encoding | Evalúa la preferencia post-pandemia (Virtual vs Presencial). Crucial para el alcance geográfico. |
| **Costo (Bs.)** | Variable Numérica | Mide la **elasticidad del precio**. Ayuda a predecir si un costo elevado reducirá la demanda esperada. |
| **Fechas (Inicio/Fin)** | Extracción de Estacionalidad | Se convierte en "Mes del año", "Trimestre" y "Semana del año". Captura picos académicos (ej. inscripciones masivas en Febrero). |
| **Duración (Horas)** | Variable Numérica | Indica la intensidad del programa, correlacionada a veces con el compromiso del estudiante. |
| **Beneficios** | Multi-Hot Encoding | Permite a la IA entender si beneficios como "Sesiones Grabadas" aumentan la probabilidad de éxito de un curso. |

### 💡 Explicabilidad con SHAP (Shapley Additive Explanations)

El módulo de gestión no solo alimenta la predicción, sino que permite que el sistema devuelva **por qué** un curso tiene una proyección específica:

- **Impacto de la Modalidad:** SHAP puede indicarnos que "Ser Virtual" aumentó la demanda predicha en +15 inscritos para un curso específico.
- **Sensibilidad al Precio:** Si la predicción es baja, SHAP podría mostrar que el "Costo" está restando puntos a la demanda, sugiriendo un ajuste de precio o una promoción.
- **Peso de la Categoría:** El administrador puede ver si la categoría "Investigación" está siendo un motor positivo de demanda en la temporada actual.

### 🛠️ Flujo de Datos para ML
1. **Admin** crea un programa con `activo=false` (Oculto).
2. El sistema guarda los metadatos en la tabla `programas`.
3. El script de entrenamiento (`ml/train_model.py`) consume estos metadatos mediante un `JOIN`.
4. El modelo genera la `demanda_predicha` y los coeficientes `SHAP`.
5. El **Dashboard de Predicciones** visualiza estos datos para la toma de decisiones estratégicas.

---

> [!TIP]
> **Dato de Oro para XGBoost**: Las descripciones de los programas (aunque actualmente son texto plano) pueden ser procesadas en el futuro mediante **NLP (TF-IDF o Embeddings)** para encontrar palabras clave que "venden" más.

---
*Próximo módulo a documentar: Inscripciones y Seguimiento de Ventas.*

## 2. Módulo: Gestión de Usuarios y Accesos (Auth & Verification)
**Ubicación:** `frontend/src/pages/` (`Registro.jsx`, `Login.jsx`, `VerificarEmail.jsx`, `ResetPassword.jsx`)

Este módulo gestiona la entrada de **características demográficas (User Features)** y asegura la integridad del acceso. La calidad de estos datos es crítica para que el modelo XGBoost segmente la demanda basándose en perfiles de usuarios reales y verificados.

### 📊 Relación con XGBoost (Calidad de Datos y Segmentación)

La verificación de identidad y la validación estricta aseguran que la IA aprenda de comportamientos reales, eliminando el ruido de registros falsos o incompletos:

| Funcionalidad | Impacto en Calidad de Datos | Valor para el Modelo Predictivo |
| :--- | :--- | :--- |
| **Validación de Edad** | Filtro de audiencia (16+) | Asegura que el modelo no se sesgue por usuarios fuera del target académico legal. |
| **Email Verificado** | Flag Binario (0/1) | **Filtro de Entrenamiento**. El pipeline de ML ignora usuarios no verificados para evitar inflar la demanda con "bots" o correos basura. |
| **Ocupación/Perfil** | Categorización Profesional | Variable de entrada (One-Hot) que permite predecir qué programas atraen a "Profesionales Senior" vs "Egresados". |
| **Seguridad 2FA** | Persistencia de Usuario | Reduce la rotación de cuentas (churn) y asegura que los datos históricos de un usuario pertenecen a la misma persona. |

### 💡 Explicabilidad con SHAP

El modelo utiliza estas variables para explicar las proyecciones de demanda:

- **Impacto de la Edad:** SHAP puede revelar que la demanda de un curso de "Tecnología" sube un 20% cuando el segmento de edad predominante es 18-25 años.
- **Segmentación por Ocupación:** Si un diplomado tiene baja demanda, SHAP podría indicar que la variable "Estudiante" tiene un peso negativo, sugiriendo que el contenido es demasiado avanzado para ese perfil.

### 🛠️ Flujo de Seguridad y Verificación
1.  **Registro**: El usuario ingresa datos demográficos validados (Regex de nombre, edad mínima, contraseña fuerte).
2.  **Verificación**: Se envía un token JWT vía **Flask-Mail** (SMTP). El usuario debe confirmar su cuenta para ser considerado "Válido" en el pipeline analítico.
3.  **Recuperación**: Flujo seguro de "Olvide mi contraseña" con tokens temporales de 1 hora para mantener la continuidad del acceso.
4.  **2FA (TOTP)**: Capa opcional de seguridad que protege el perfil del usuario, garantizando que su historial de navegación y compras sea fidedigno para el re-entrenamiento del modelo.

### 🔐 Arquitectura de Despliegue
El sistema utiliza variables de entorno (`FRONTEND_URL`, `MAIL_PASSWORD`) para que los enlaces de correo funcionen tanto en desarrollo local como en producción (Nube), manteniendo la escalabilidad del proyecto.

---
---
*Próximo módulo a documentar: Inscripciones y Seguimiento de Ventas.*

## 3. Módulo: Email Marketing y Gestión de Campañas (Mailing)
**Ubicación:** `frontend/src/pages/dashboard/Mailing.jsx`

Este módulo permite al Administrador interactuar proactivamente con la base de datos de usuarios interesados. Actúa como el **disparador de demanda (Demand Driver)**, convirtiendo las predicciones de la IA en acciones de ventas reales.

### 📊 Relación con XGBoost (Control de Sesgo y Estímulo de Demanda)

El envío de correos masivos genera una variable externa que el modelo debe considerar para no sesgar sus futuras predicciones:

| Funcionalidad | Uso en Marketing | Valor para el Ciclo de IA |
| :--- | :--- | :--- |
| **Envío de Boletín** | Notifica lanzamientos de cursos. | Genera picos de inscripción que deben ser etiquetados como "Impulsados por Campaña" para no confundirlos con demanda orgánica. |
| **Adjunto de Imagen** | Flyers y material visual (AIDA). | El uso de material gráfico aumenta la tasa de conversión (CTR), impactando directamente en la velocidad de llenado de un programa. |
| **Gestión de Preferencias** | Respeto a la privacidad (Opt-in). | Asegura que el modelo aprenda de usuarios que tienen una **intención de compra activa** (quieren recibir noticias). |

### 💡 Estrategia de Marketing Digital
El módulo integra una sección de **Estrategia** que vincula el correo electrónico con la presencia en Redes Sociales (Facebook). Esto permite al administrador:
1.  **Omnicanalidad**: Reforzar el mensaje enviado por correo con publicaciones en la página oficial de la Academia.
2.  **Conversión Directa**: Incluir enlaces a los programas que la IA identificó con alta probabilidad de éxito, maximizando el Retorno de Inversión (ROI).

### 🛠️ Flujo de Operación
1.  **Admin** revisa el módulo de **IA Predictiva** para ver qué curso tiene mayor potencial de demanda la próxima semana.
2.  **Admin** redacta una campaña en el módulo de **Mailing**, adjunta el flyer promocional y lo envía.
3.  **Backend** procesa el envío de forma asíncrona a todos los suscriptores activos en la base de datos.
4.  **Usuario** recibe el correo y se inscribe, generando un dato de "Venta Real" que cerrará el círculo de entrenamiento para la IA.

---
## 4. Módulo: Diagnóstico y Telemetría Técnica (Developer Mode)
**Ubicación:** `frontend/src/pages/dashboard/Telemetria.jsx` | `backend/app.py` (Hooks de telemetría)

Este módulo es la **infraestructura de observabilidad** del sistema. Permite al desarrollador monitorear la salud técnica de la plataforma, detectar errores en tiempo real y asegurar que el flujo de datos hacia la IA sea íntegro y sin fallos ocultos.

### 📊 Relación con XGBoost (Monitoreo de Calidad e Inferencia)

La telemetría es el "escudo" que protege la calidad del pipeline de datos que alimenta al modelo:

| Funcionalidad | Propósito Técnico | Beneficio para la IA |
| :--- | :--- | :--- |
| **Log de Errores (404/500)** | Detecta fallos en la recolección de datos. | Evita que el modelo aprenda de periodos con "datos perdidos" debido a caídas del sistema. |
| **Telemetría de Endpoints** | Mide tiempos de respuesta. | Monitorea la latencia de la inferencia de XGBoost, asegurando que la IA responda en menos de 200ms. |
| **Audit Log de Usuarios** | Registra acciones significativas. | Permite trazar el "camino del usuario" (User Journey) para entender por qué ciertos perfiles convierten más que otros. |
| **Overlay de Diagnóstico** | Identifica componentes FE/BE. | Facilita la corrección inmediata de errores en el pipeline de ingeniería de características. |

### 💡 Explicabilidad y Depuración (SHAP Support)

El modo desarrollador facilita la depuración de la "caja negra" de la IA:

- **Detección de Data Drift**: Al loguear las entradas de los usuarios, el desarrollador puede detectar si los datos del mundo real se están alejando de los datos de entrenamiento (Drift), lo que indica que el modelo XGBoost necesita un re-entrenamiento urgente.
- **Auditoría de Inferencia**: Si una predicción de SHAP parece incoherente, el desarrollador puede consultar los logs de telemetría para ver exactamente qué parámetros se le pasaron al modelo en ese milisegundo exacto.

### 🛠️ Flujo de Diagnóstico
1.  **Backend** captura automáticamente cada error HTTP y lo persiste en la tabla `telemetria_eventos` con detalles del contexto (IP, User Agent, Endpoint).
2.  **Desarrollador** activa el "Modo Dev" desde el Dashboard para visualizar la estructura del código mientras navega (Overlays).
3.  **Sistema** reporta errores de JS en el navegador al backend para que el desarrollador sepa si un usuario tuvo un fallo visual sin necesidad de reportarlo manualmente.
4.  **Panel de Telemetría** visualiza en tiempo real el flujo de eventos, permitiendo filtrar por criticidad (ERROR, CRITICAL, WARNING).

---
## 5. Módulo: Gestión de Facilitadores y Personal Docente
**Ubicación:** `frontend/src/pages/dashboard/GestorFacilitadores.jsx`

Este módulo gestiona el capital humano de la academia. Los facilitadores son una **variable de influencia indirecta** en la demanda; el prestigio o la especialidad de un docente puede ser un factor determinante para el éxito de un programa.

### 📊 Relación con XGBoost (Atributos de Calidad)
| Dato de Facilitador | Valor para el Modelo Predictivo |
| :--- | :--- |
| **Especialidad/Perfil** | Identifica si programas liderados por perfiles técnicos tienen más demanda que los de perfiles teóricos. |
| **Carga Académica** | Permite predecir el agotamiento de recursos o la necesidad de contratar más personal ante picos de demanda predicha. |

---

## 6. Módulo: Inscripciones y Seguimiento de Ventas (Conversión)
**Ubicación:** `frontend/src/pages/dashboard/Inscripciones.jsx` | `NuevaInscripcion.jsx`

Este es el módulo de **etiquetado (Labeling)**. Aquí es donde se registran las conversiones reales que el modelo XGBoost intenta predecir.

### 📊 Relación con XGBoost (Variable Objetivo / Target)
| Funcionalidad | Propósito en el pipeline de ML |
| :--- | :--- |
| **Nuevo Ingreso** | Genera el punto de dato más reciente para el entrenamiento. Permite capturar la demanda en tiempo real. |
| **Origen de Captación** | Variable crucial (Facebook, Boletín, Recomendación). Permite a la IA entender qué canal es más eficiente por tipo de programa. |
| **Estado de Inscripción** | Permite filtrar solo las ventas "Completadas" para entrenar el modelo, descartando leads fríos o cancelados que distorsionarían la predicción de ingresos. |
| **Costo Pagado** | Valida si el precio oficial del programa se mantuvo o si hubo descuentos, midiendo la sensibilidad real del mercado. |

### 💡 Explicabilidad con SHAP
- **Peso del Origen:** SHAP puede mostrar que el origen "Facebook" es el principal motor de demanda para Cursos Cortos, mientras que el "Boletín" funciona mejor para Diplomados Senior.
- **Análisis de Conversión:** Si las inscripciones son bajas, SHAP puede revelar si el factor limitante es el canal de captación o el precio pagado.

### 🛠️ Flujo de Conversión
1. **Admin/Vendedor** utiliza `NuevaInscripcion.jsx` para registrar un estudiante (nuevo o existente).
2. Los datos se guardan en la tabla `inscripciones`, vinculando usuario, programa y metadatos de venta.
3. El historial se visualiza en el **Registro Histórico** para auditoría.
4. El proceso de Re-entrenamiento toma estos datos para ajustar el modelo XGBoost, mejorando la precisión de la demanda proyectada para el siguiente ciclo.

---
