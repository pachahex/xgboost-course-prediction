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
*Próximo módulo a documentar: Inscripciones y Perfiles de Usuario.*
