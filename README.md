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

## 🚀 Tutorial: Pruebas Backend usando Postman

A continuación se describen los pasos para validar localmente que tu arquitectura está operando sin contratiempos usando la herramienta de Postman.

### 1. Iniciar Sesión (Obtener Acceso)
1. Abre Postman y crea una nueva pestaña. Configura el verbo HTTP a **POST**.
2. Escribe la URL de tu contenedor montado: `http://localhost:5000/api/login`
3. En la sección principal, ve a la pestaña **`Body`**, elige **`raw`** y en el tipo desplegable a la derecha selecciona **`JSON`**.
4. Pega el siguiente payload (Correspondiente al usuario Semilla administrador insertado vía el script ETL):
   ```json
   {
       "correo": "admin@autopoiesis.com",
       "password": "admin123"
   }
   ```
5. Haz clic en **Send**.
6. **Verificación:** Deberías ver un "Login exitoso" con estado `200 OK`. 
   > Si vas a la pestaña **`Cookies`** en la ventana de respuesta de Postman, verás que el servidor te ha otorgado un `access_token` incrustado como *HttpOnly*.

### 2. Probando una Ruta Privada
1. En una nueva pestaña, configura una petición para consultar los datos estudiantiles usando el verbo **GET**.
2. URL: `http://localhost:5000/api/admin/inscripciones`
3. Dale a **Send**. Postman automáticamente inyectará por debajo la Cookie que recibiste en el paso anterior y la verificación JWT te permitirá entrar, devolviendo el histórico masivo extraído en la importación.

### 3. Simulando el Alta de un Prospecto (Público)
1. Nuevo Request de tipo **POST** apuntando hacia `http://localhost:5000/api/suscribir`.
2. Estructura de nuevo el Body como **JSON**:
   ```json
   {
       "correo": "analisis.futuro@autopoiesis.com"
   }
   ```
3. Verifica que la consola te retorne `201 Created` y ve a tu explorador PgAdmin (puerto `5051`) para certificar que el contacto ha sido indexado orgánicamente.

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

---

## ⏸️ ¿Cómo Detener y Reanudar el Trabajo en Cualquier PC?

Ya que este ecosistema está 100% contenerizado (Dockerizado), la portabilidad está garantizada universalmente sin importar si usas Windows, Mac o Linux.

### Para Detener el Sistema (Al finalizar tu jornada)
No basta con cerrar la terminal. Para liberar los puertos y detener limpiamente las bases de datos y servidores, ejecuta en la raíz del proyecto:
```bash
docker-compose down
```
*(Toda la data transaccional e histórica persistirá a salvo en el volumen inmutable de PostgreSQL `postgres_data`)*.

### Para Reanudar o Desplegar en una Computadora Nueva
1. Tienes que clonar o descargar este repositorio (y asegurarte de que Docker Desktop esté corriendo).
2. Dirígete en tu terminal hasta la carpeta principal del proyecto.
3. Ejecuta el comando maestro de reconstrucción abstracta:
```bash
docker-compose up -d --build
```
> **¿Qué hace esto?** `-d` libera tu terminal de los logs dejándolos en el entorno de fondo (Detached mode), y `--build` obliga a Docker a escanear `package.json` y `requirements.txt` instalando cualquier dependencia de Python o Node.js que haya sido añadida remotamente, logrando el despliegue automático.
