# Contexto de Desarrollo: Base de Datos (PostgreSQL)

## 🎯 Propósito del Módulo
Este módulo define la estructura de persistencia transaccional (OLTP) y analítica (OLAP) del sistema de la Academia Autopoiesis. Se maneja exclusivamente mediante scripts de inicialización de PostgreSQL.
No olvidar que el objetivo final es que la mayoria de los datos alimentaran el entrenamiento xgboost para predecir las inscripciones a los cursos y diplomados, obviamente, sin descuidar el lado administrativo del negocio.

## 🛠️ Stack Tecnológico y Versiones
*   **Motor:** PostgreSQL 15 (Alpine)
*   **Zona Horaria:** America/La_Paz (Configurado vía variables de entorno)

## 📐 Estructura Actual del Esquema (MVP)
La base de datos sigue un modelo fuertemente normalizado para evitar redundancia. 
*   **Entidades Catálogo:** `categorias`, `tipos_servicio`, `departamentos`, `roles`, `estados_inscripcion`, `origenes_captacion`.
*   **Entidades Transaccionales y Pivote:** `programas`, `usuarios`, `inscripciones`, `programa_facilitadores` (N:M), `programa_beneficios` (N:M), `certificados`, `pagos` (Financiero), `boletin_informativo`.
*   **Entidades de ML:** `caracteristicas_demanda_semanal` y `predicciones` (Concesiones analíticas, congeladas durante fase transaccional).

## ⚠️ Reglas Estrictas para la Inteligencia Artificial
Al asistir en el código o crear consultas SQL para este directorio, la IA debe adherirse a las siguientes directrices:
1.  **Convención de Nombres:** Todas las tablas, columnas y constraints deben usar `snake_case` y estar en español.
2.  **Integridad Relacional:** Siempre definir explícitamente las claves foráneas (Foreign Keys).
3.  **Seguridad de Borrado:** NUNCA utilizar `ON DELETE CASCADE` en tablas transaccionales críticas (como `inscripciones` o `usuarios`). Utilizar soft-deletes o restringir el borrado.
4.  **Estructura Consolidada:** La tabla `usuarios` ahora es la dueña de la información demográfica (`fecha_nacimiento`, `telefono`, `ocupacion`, `departamento_id`, `suscrito_boletin`). La tabla `inscripciones` registra la transacción, el `origen_id` y congela el precio con `costo_pagado`.
5.  **Regla de Normalización (3NF):** Las relaciones N:M siempre deben resolverse con tablas pivote (ej. `programa_facilitadores`). Los campos categóricos deben ser tablas catálogo (ej. `origenes_captacion`, `modalidades`) para asegurar compatibilidad con One-Hot Encoding en el futuro pipeline de XGBoost.
6.  **Programas Enriquecidos:** La entidad `programas` ahora soporta `modalidad_id`, fechas de vigencia, duración en horas, descripciones extendidas e imágenes. Esto permite que el sistema de predicción use la estacionalidad (fechas) y el tipo de entrega (modalidad) como variables de entrada.
7.  **Diferenciación de Estados:**
    - `activo`: Controla la visibilidad en la Landing Pública. (Mostrar/Ocultar).
    - `eliminado`: Borrado lógico definitivo para limpieza del Dashboard. Si es `true`, el programa desaparece de la UI pero persiste en BD para no corromper el histórico de la IA.
