# Academia Autopoiesis - Sistema de Gestión y Predicción Estudiantil

## 🎯 Descripción del Proyecto
Este ecosistema busca proporcionar a la Academia Autopoiesis una plataforma integral que une un **Front-End interactivo de captura de prospectos y oferta académica**, un **Back-End de administración seguro**, y un **Motor de Inteligencia Artificial (XGBoost)** diseñado para pronosticar la demanda de los diplomados y cursos ofrecidos por la institución.

---

## 🏗️ Arquitectura de la Infraestructura (Docker)
El proyecto ha sido diseñado bajo una estructura de microservicios, orquestados en contenedores mediante `docker-compose`. Actualmente, el sistema integra cuatro servicios distribuidos:

1. **`frontend` (Puerto 3000)**: Servidor Node que expone la vista de React configurada vía Vite. Responsable de la fluidez en el ecosistema (Landing y Dashboard Admin).
2. **`backend` (Puerto 5000)**: Motor lógico basado en **Python y Flask** que interconecta todo el sistema. Expone las interfaces públicas, valida la sesión del administrador y carga las métricas desde la BD para ser visualizadas.
3. **`db` (Puerto 5432 / localhost: 5433)**: Base de datos **PostgreSQL 18** normalizada y estructurada para OLTP y OLAP simultáneo.
4. **`pgadmin` (Puerto 5051)**: Herramienta de Interfaz Gráfica para gestión y administración visual directa sobre las tablas.

---

## 💾 Arquitectura de la Base de Datos

El diseño sigue directrices rigurosas de Normalización (1NF a 3NF) para evitar inconsistencias y duplicidad de registros. 

### Tablas Principales y de Catálogo
*   **`categorias`**, **`tipos_servicio`** y **`departamentos`**: Previenen errores tipográficos aislando la estructura a referencias `id`. 
*   **`estados_inscripcion`**: Determina si un registro resultó en estado "Pendiente", "Completado" o "Cancelado".
*   **`roles`**: Contiene la gobernanza RBAC del proyecto. Por defecto cuenta con:
    *   **Administrador**: Único usuario con privilegios transaccionales sobre la UI. 
    *   **Estudiante**: El cursante validado real.
    *   **Suscriptor**: Usuario prospecto, cuyo registro se adquiere de la Landing Page por medio de formularios de interés (Newsletters o Consultas) que se expandirá para recolectar el nombre.
*   **`programas`**: Abstrae la oferta académica concreta, englobando a su categoría y costo oficial.
*   **`usuarios`**: Entidad única regida por llaves foráneas para estandarizar accesos y metadatos individuales (Contraseñas con Hashing por Bcrypt).
*   **`inscripciones`**: Entidad transaccional transitoria (Muchos a Muchos), vincula un usuario específico a un curso particular registrando la `fecha_inscripcion` y el `costo_real_bs`.

**Arquitectura de Datos Demográficos:**
La base de datos sigue el principio de **Normalización Estricta**. Toda la información demográfica (Fecha de Nacimiento, Departamento, Teléfono, Ocupación) pertenece exclusivamente a la tabla `usuarios`. Las transacciones en `inscripciones` simplemente heredan esta información relacionalmente, garantizando que no haya redundancia de datos y preparando el terreno para un análisis de Machine Learning profesional.

---

## 🧠 Flujo Analítico y Predictivo (Por Implementarse)

### Feature Engineering y Demanda
Existen las tablas **`caracteristicas_demanda_semanal`** y **`predicciones`**. Estas existen explícitamente para desacoplar las pesadas consultas SUM/COUNT requeridas antes del preprocesamiento. La IA extraerá transformaciones geométricas (senos, cosenos) por fechas para determinar la estacionariedad y guardar predicciones puntillosas por "Semana Objetivo".

### XGBoost + SHAP (Inteligencia Artificial Explicable)
1. **Entrenamiento (Batch)**: El servidor ajustará un `XGBoostRegressor` utilizando un enfoque sistemático de *Train-Test Split* y *Hyperparameter Tuning*.
2. **Explicabilidad**: El Front-End no solo consultará al Back-End **cuánta** demanda prevee la IA para un curso particular, sino **por qué** (a través de los Valores Shapley persistidos en la columna `JSONb`). Estos dictan el peso matemático y lógico detrás de cada inferencia para un entendimiento natural por parte del personal humano que deba planificar el diplomado.

---

## 🔒 API y Autenticación (Fase 2 Completada)

El Backend de la academia está construido de forma sólida usando **Flask**. Ha sido diseñado bajo un modelo de API REST seguro con dependencias formales en PyJWT, SQLAlchemy y abstracciones directas de la Base de Datos.

### Endpoints Disponibles
*   **Públicos:**
    *   `GET /api/public-stats`: Carga las estadísticas macro integradas de la Base de Datos.
    *   `POST /api/suscribir`: Captura iterativa de correos de leads y prospects a través de roles asignados.
*   **Privados (Protegidos por `@admin_required`):**
    *   `POST /api/login`: Emite autenticación mediante desencriptado de hash asíncrono con `bcrypt`. 
    *   `GET /api/admin/inscripciones`: Devuelve CRUD de registros de históricos paginados.
    *   `POST /api/logout`: Destruye inmediatamente el rastro de la sesión.

### Protección XSS y CSRF
Todo el módulo de control de acceso está sellado por **JSON Web Tokens (JWT)**. Para prevenir que ataques de Scripts inyectados entre dominios (XSS) roben el token del `localStorage` en Javascript, el token es emitido incrustado en una cookie especial marcada como **HTTP-Only**.

---

## 🎨 Frontend y Experiencia de Usuario (Fase 3 Completada)

La interfaz de usuario ha sido desarrollada con **React 19** y **Vite**, priorizando una estética moderna, fluida y coherente con la identidad visual de la Academia Autopoiesis.

### Estética y Diseño
*   **Paleta de Colores:** Uso estricto de Púrpura (`#7f2b80`) y Cian (`#038fba`).
*   **Glassmorphism:** Implementación de paneles translúcidos con desenfoque de fondo (*backdrop-filter*) en la sección de login y tarjetas de información, creando una sensación de profundidad y modernidad.
*   **Diseño Mobile-First:** Sistema responsivo integral con clases utilitarias centralizadas, menús adaptativos (Hamburguesa en móvil) y optimización de visualización de imágenes (Pop-out Preview) para garantizar la mejor UX en cualquier dispositivo.

### 📋 Consistencia y Desarrollo
Para mantener la integridad visual y lógica del proyecto, se ha establecido un archivo de gobernanza:
*   **`frontend/CONTEXT.md`**: Contiene los estándares oficiales de branding, tipografía, iconografía y las reglas inquebrantables de layout responsivo para futuros desarrollos.

### Funcionalidades Implementadas
*   **Navegación Dinámica:** Uso de `react-router-dom` para una experiencia Single Page Application (SPA) sin recargas de página.
*   **Landing Page:** Secciones de Hero (identidad), Estadísticas en tiempo real (conectadas al backend) y catálogo de oferta académica.
*   **Captura de Leads:** Formulario en el footer integrado con el endpoint de suscripción.
*   **Panel Administrativo (Dashboard):** Área privada protegida que permite visualizar el historial de inscripciones mediante tablas con paginación.

### 🔑 Credenciales de Prueba (Sistema de Seguridad RBAC)
Para probar los distintos niveles de privilegios (RBAC) y flujos del sistema en la ruta `/login`:

*   **Administrador Principal (Dashboard Completo + IA Predictiva):**
    *   **Correo:** `juuuuands@gmail.com`
    *   **Contraseña:** `admin123`
*   **Estudiante de Prueba (Vista de Cursos + Módulo de Inscripciones):**
    *   **Correo:** `mcj2027302@est.univalle.edu`
    *   **Contraseña:** `1234567` (o su CI `7654322`)

> **Nota de Seguridad:** El sistema utiliza **Cookies HTTP-Only** para transferir tokens JWT de manera segura, impidiendo ataques XSS.

---

## 🧪 Manual de Flujo de Pruebas Completo

Sigue esta secuencia de pasos verificada para validar y testear cada uno de los componentes de la plataforma (RBAC, Ingesta, e Inteligencia Artificial):

### Paso 1: Levantar el Ecosistema
Asegúrate de que los contenedores estén activos y saludables:
```bash
docker compose up -d --build
```
*El servicio `db` ejecutará automáticamente el archivo `01_schema.sql` y creará los usuarios semilla básicos sin necesidad de ingesta.*

### Paso 2: Probar el Control de Acceso (RBAC)
1. Ve a [http://localhost:3000/login](http://localhost:3000/login) e inicia sesión con el rol de **Estudiante**:
   * **Usuario:** `mcj2027302@est.univalle.edu` | **Contraseña:** `1234567`
2. Una vez dentro, intenta forzar el acceso directo a la URL del administrador escribiendo: [http://localhost:3000/dashboard/inscripciones](http://localhost:3000/dashboard/inscripciones).
3. **Resultado Esperado:** El sistema denegará la navegación mostrando de forma segura el mensaje *"No tienes privilegios de Administrador"* y bloqueando el acceso al dashboard sensible.
4. Cierra sesión.

### Paso 3: Acceder como Administrador
1. Inicia sesión en [http://localhost:3000/login](http://localhost:3000/login) con la cuenta de **Administrador**:
   * **Usuario:** `juuuuands@gmail.com` | **Contraseña:** `admin123`
2. **Resultado Esperado:** Acceso exitoso al panel completo del administrador, donde podrás visualizar la barra de navegación lateral y las estadísticas iniciales en tiempo real.

### Paso 4: Ejecutar la Ingesta de Datos (ETL)
Para poblar el sistema con programas reales de la academia (`seed_programas.json`) y generar ~3000 inscripciones históricas realistas con factores lógicos y temporales adaptados al entrenamiento del modelo predictivo, ejecuta:
```bash
docker exec -it xgboost-course-prediction-backend-1 python import_data.py
```
*   **Qué hace:**
    *   Carga la base de datos de programas reales desde `backend/data/seed_programas.json`.
    *   Genera 2,000 estudiantes simulados distribuidos lógicamente según su grado académico y edad.
    *   Inserta ~3,000 inscripciones lógicas con temporalidad y estados realistas (Activo, Retirado, Finalizado).
    *   Genera un archivo consolidado `backend/data/dataset.csv` para inspección rápida de datos.

### Paso 5: Entrenar el Modelo de Inteligencia Artificial (XGBoost + SHAP)
Con el dataset consolidado en la base de datos PostgreSQL, entrena el modelo de machine learning para predecir la demanda de estudiantes por programa y calcular los valores de explicabilidad SHAP para el Administrador:
```bash
docker exec -it xgboost-course-prediction-backend-1 python ml/train_model.py
```
*   **Qué hace:**
    *   Realiza el procesamiento y Feature Engineering (cálculo de senos y cosenos cíclicos para temporalidad).
    *   Entrena un `XGBoostRegressor` para pronosticar el volumen de inscripciones.
    *   Calcula el impacto explicable de cada variable de entrada (semana del año, edad promedio) mediante la biblioteca `shap`.
    *   Sube las predicciones y los coeficientes de explicabilidad (`JSONB`) directamente a la base de datos.

### Paso 6: Validar la IA Predictiva en el Dashboard de Recharts
1. Con la sesión del administrador abierta, ve a la sección **IA Predictiva** o consulta la ruta de la API: [http://localhost:5000/api/admin/predicciones](http://localhost:5000/api/admin/predicciones).
2. **Resultado Esperado:** Gráficos dinámicos con barras y líneas interactivas que comparan la demanda real de los programas históricos frente a la demanda predicha por XGBoost, detallando los factores SHAP que explican cada predicción en lenguaje natural.

---

---

## ⏸️ ¿Cómo Detener y Reanudar el Trabajo?

Ya que este ecosistema está 100% contenerizado, la portabilidad está garantizada universalmente.

### Inicio Rápido (Recomendado)
```bash
docker compose up -d --build
```

### Modo Desarrollo (Hot Reload)
Si planeas editar el código y ver los cambios en tiempo real:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

### Detener el Sistema
Para liberar puertos y detener los servicios limpiamente:
```bash
docker compose down
```
*(La data persistirá en el volumen `postgres_data` aunque detengas los contenedores).*
