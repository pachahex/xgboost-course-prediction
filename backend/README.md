# Backend - Academia Autopoiesis

Este directorio contiene el servidor de la aplicación (API REST) y los módulos de Inteligencia Artificial (Machine Learning). Está construido en Python utilizando el micro-framework Flask y la biblioteca XGBoost.

## Tecnologías Principales
- **Python 3.11+**
- **Flask** (API REST y Rutas)
- **PostgreSQL** (Base de Datos a través de psycopg2)
- **XGBoost & SHAP** (Entrenamiento de Modelos y Explicabilidad)
- **Jupyter Lab** (Para exploración académica y análisis de datos)

## Cómo iniciar el proyecto (Docentes / Tribunal)

Este backend está "dockerizado" para que no tengas que preocuparte por instalar dependencias de Python o bases de datos locales. Desde la **raíz del proyecto** (la carpeta padre donde está el archivo `docker-compose.yml`), ejecuta:

```bash
docker-compose up -d --build
```

Con este comando, el backend levantará en:
👉 **http://localhost:5000**
Y el servidor de Jupyter Lab (para revisar la libreta interactiva de ML) estará en:
👉 **http://localhost:8888**

### Semillas de Datos y Entrenamiento del Modelo

Para garantizar el funcionamiento integral de la predicción y los reportes, una vez que el contenedor esté corriendo, debes poblar la base de datos y entrenar el modelo. Corre los siguientes comandos desde la raíz de tu proyecto:

1. **Poblar la Base de Datos:**
Carga todos los estudiantes, cohortes y programas desde los archivos `.json` base:
```bash
docker exec -it xgboost-course-prediction-backend-1 python import_data.py
```

2. **Entrenar el Modelo Predictivo (XGBoost):**
Genera el archivo del modelo `xgboost_model.pkl` y los gráficos de explicabilidad SHAP:
```bash
docker exec -it xgboost-course-prediction-backend-1 python ml/train_model.py
```

### Exploración del Código Fuente
- `/ml/`: Contiene el script de entrenamiento (`train_model.py`) y donde se guardan los modelos exportados.
- `/notebooks/`: Contiene libretas de Jupyter. Especialmente `Explicacion_Modelo_XGBoost.ipynb` que documenta el paso a paso científico de la IA utilizada en este proyecto.
- `app.py`: Archivo principal que define todos los *endpoints* de la API.

### Reglas de Arquitectura y Desarrollo
1.  **Patrón de Respuesta:** Todas las respuestas de los endpoints deben ser JSON estructurados: `{"success": True/False, "data": {...}, "message": "..."}`.
2.  **Autenticación y Seguridad:**
    *   Los tokens JWT vienen embebidos en Cookies `HTTP-Only`.
    *   Los endpoints administrativos están protegidos con el decorador `@admin_required`.
    *   El sistema implementa flujos de confirmación de correo y recuperación de contraseñas usando `Flask-Mail`.
3.  **Manejo de Base de Datos:** Se utiliza SQLAlchemy (`Model.query...` o `db.session`). 
4. **Estructura Consolidada:** La tabla `usuarios` almacena la información demográfica. La tabla `inscripciones` registra transacciones congelando el precio pagado.
5. **Normalización (3NF):** Las relaciones N:M se resuelven con tablas pivote (ej. `programa_facilitadores`). Los campos categóricos usan tablas catálogo para compatibilidad con el pipeline de XGBoost.
6. **Gestión de Programas:**
    - **Visibilidad Web (`activo`)**: Controlada por el dashboard.
    - **Borrado del Sistema (`eliminado`)**: Borrado lógico para ocultar en interfaces, manteniendo la integridad histórica para la IA.

### Módulo de Email Marketing
- **Envío Masivo Asíncrono**: Utiliza hilos (`threading.Thread`) para no bloquear el flujo principal.
- **Gestión de Suscriptores**: Administrado mediante la tabla `boletin_informativo`.
- **Soporte de Adjuntos**: Capacidad de enviar imágenes adjuntas procesadas en memoria.
