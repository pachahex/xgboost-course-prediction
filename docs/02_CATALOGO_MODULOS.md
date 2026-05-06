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
*Próximo módulo a documentar: Inscripciones y Seguimiento de Ventas.*
