# Contexto de Desarrollo: Backend (Python / Flask)

## 🎯 Propósito del Módulo
El Backend actúa como el núcleo lógico del sistema. Administra la API REST para el Frontend (React), maneja la autenticación segura, interactúa con la base de datos (PostgreSQL) y ejecuta los scripts de entrenamiento y predicción del modelo de Inteligencia Artificial (XGBoost).

## 🛠️ Stack Tecnológico
*   **Lenguaje:** Python 3
*   **Framework Web:** Flask (Modo API RESTful puro, sin renderizado de templates)
*   **ORM:** SQLAlchemy
*   **Machine Learning:** XGBoost, Scikit-Learn, SHAP
*   **Autenticación:** PyJWT (Cookies HTTP-Only) + Bcrypt (Hashing)

## 📁 Estructura del Código Actual
*   `app.py`: Archivo raíz. Contiene la inicialización de Flask, middlewares (CORS) y la definición directa de rutas.
*   `db.py`: Definición centralizada del ORM (Modelos de SQLAlchemy).
*   `import_data.py`: Script ETL asíncrono para cargar `dataset.csv` a PostgreSQL.
*   `ml/`: Directorio aislado para la lógica matemática. Contiene `train_model.py` (Entrenamiento Batch y SHAP).

## ⚠️ Reglas Estrictas para la Inteligencia Artificial
Al generar, refactorizar o debuggear código en este directorio, la IA debe cumplir lo siguiente:
1.  **Patrón de Respuesta:** Todas las respuestas de los endpoints deben ser JSON estructurados. Ejemplo: `{"success": True/False, "data": {...}, "message": "..."}`.
2.  **Autenticación y Seguridad:**
    *   No usar `localStorage` para tokens. Asumir siempre que el token JWT viene embebido de forma automática en una Cookie `HTTP-Only`.
    *   Proteger los endpoints administrativos usando exclusivamente el decorador `@admin_required`.
    *   **Verificación y Recuperación**: El backend implementa flujos de confirmación de correo electrónico y reseteo de contraseñas mediante tokens JWT temporales (1 a 24 horas de expiración) usando `Flask-Mail`.
3.  **Manejo de Base de Datos:** Usar SQLAlchemy (`Model.query...` o `db.session`). Nunca escribir consultas SQL en crudo a menos que sea estrictamente necesario por rendimiento analítico.
4. **Estructura Consolidada:** La tabla `usuarios` ahora es la dueña de la información demográfica (`fecha_nacimiento`, `telefono`, `ocupacion`, `departamento_id`, `suscrito_boletin`) y metadatos de seguridad (`email_verificado`, `totp_enabled`). La tabla `inscripciones` registra la transacción, el `origen_id` y congela el precio con `costo_pagado`.
5. **Regla de Normalización (3NF):** Las relaciones N:M siempre deben resolverse con tablas pivote (ej. `programa_facilitadores`). Los campos categóricos deben ser tablas catálogo (ej. `origenes_captacion`, `modalidades`) para asegurar compatibilidad con One-Hot Encoding en el futuro pipeline de XGBoost.
6. **Programas Enriquecidos:** La entidad `programas` ahora soporta `modalidad_id`, fechas de vigencia, duración en horas, descripciones extendidas e imágenes, permitiendo una gestión de contenidos profesional.
7. **Arquitectura de Gestión de Programas:**
    - **Visibilidad Web (`activo`)**: Controlada por el checkbox del formulario (Marketing).
    - **Borrado del Sistema (`eliminado`)**: Gestionado vía `DELETE`. Oculta el registro de TODAS las interfaces de usuario (Dashboard y Web) pero lo mantiene en la DB para preservar la integridad histórica del modelo XGBoost.
    - **Migraciones en Docker**: Cualquier cambio estructural en la DB debe ejecutarse mediante `docker exec` en el contenedor `db` para asegurar la persistencia correcta.
