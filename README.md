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
*   **`inscripciones`**: Entidad transaccional transitoria (Muchos a Muchos), vincula un usuario específico a un curso particular aportando atributos dinámicos como 'fecha_inscripcion' y 'edad_estudiante'. 

**Nota sobre los Datos Históricos:**
Para conservar la consistencia de Base de Datos y cumplir la restricción relacional `usuario_id`, las más de 3000 inscripciones transaccionales recopiladas en los últimos años han sido pivotadas genéricamente al perfil de **Usuario Administrador Seed**. La plataforma futura exigirá formalmente nombres y apellidos completos.

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

La interfaz de usuario ha sido desarrollada con **React 18** y **Vite**, priorizando una estética moderna, fluida y coherente con la identidad visual de la Academia Autopoiesis.

### Estética y Diseño
*   **Paleta de Colores:** Uso estricto de Púrpura (`#7f2b80`) y Cian (`#038fba`).
*   **Glassmorphism:** Implementación de paneles translúcidos con desenfoque de fondo (*backdrop-filter*) en la sección de login y tarjetas de información, creando una sensación de profundidad y modernidad.
*   **Diseño Responsivo:** Layout adaptativo para garantizar la legibilidad en diferentes dispositivos.

### Funcionalidades Implementadas
*   **Navegación Dinámica:** Uso de `react-router-dom` para una experiencia Single Page Application (SPA) sin recargas de página.
*   **Landing Page:** Secciones de Hero (identidad), Estadísticas en tiempo real (conectadas al backend) y catálogo de oferta académica.
*   **Captura de Leads:** Formulario en el footer integrado con el endpoint de suscripción.
*   **Panel Administrativo (Dashboard):** Área privada protegida que permite visualizar el historial de inscripciones mediante tablas con paginación.

### 🔑 Credenciales de Prueba (Sistema de Administración)
Para acceder al sistema privado y visualizar el dashboard, utiliza los siguientes datos en la ruta `/login`:

*   **URL de acceso:** [http://localhost:3000/login](http://localhost:3000/login)
*   **Usuario:** `admin@autopoiesis.com`
*   **Contraseña:** `admin123`

> **Nota:** El sistema utiliza cookies **HTTP-Only** para la sesión. Si el inicio de sesión es exitoso, serás redirigido automáticamente al panel de control.

## 🚀 Primeros Pasos: Inicialización de Datos y IA

Una vez que los contenedores estén corriendo por primera vez, la base de datos estará estructurada pero vacía. Debes ejecutar los siguientes comandos para poblar el sistema y activar las predicciones:

### 1. Importar Datos Históricos (ETL)
Puebla el sistema con roles, usuarios y más de 3,000 inscripciones reales para pruebas:
```bash
docker exec -it xgboost-course-prediction-backend-1 python import_data.py
```
*   **Credenciales resultantes:** `admin@autopoiesis.com` / `admin123`

### 2. Entrenar el Modelo de IA (XGBoost + SHAP)
Este script procesa los datos históricos, entrena el modelo predictivo y genera los valores de explicabilidad para el Dashboard:
```bash
docker exec -it xgboost-course-prediction-backend-1 python ml/train_model.py
```

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
