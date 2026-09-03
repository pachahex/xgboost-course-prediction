# Guía Integral de Pruebas y Control de Calidad
## Pruebas Automatizadas (Unit / E2E / CI) y Manuales de API REST

**Academia Autopoiesis Certum Software**  
**Versión:** 2.0 — Estándar de Testing  
**Ámbito:** Backend (Flask/Pytest), Frontend (Vitest/Cypress), CI/CD (GitHub Actions) y Testing de Endpoints (Postman)  

---

## 📑 Tabla de Contenidos

1. [Estrategia Global de Testing](#1-estrategia-global-de-testing)
2. [Pruebas Automatizadas de Backend (Pytest)](#2-pruebas-automatizadas-de-backend-pytest)
3. [Pruebas Automatizadas de Frontend (Vitest & Cypress E2E)](#3-pruebas-automatizadas-de-frontend-vitest--cypress-e2e)
4. [Integración Continua (CI/CD con GitHub Actions)](#4-integración-continua-cicd-con-github-actions)
5. [Buenas Prácticas de Pruebas en el Ecosistema](#5-buenas-prácticas-de-pruebas-en-el-ecosistema)
6. [Guía de Pruebas Manuales de API REST (Postman / Curl)](#6-guía-de-pruebas-manuales-de-api-rest-postman--curl)
   - [6.1. Suscripción al Boletín (Público)](#61-suscripción-al-boletín-público)
   - [6.2. Registro de Usuario / Estudiante (Público)](#62-registro-de-usuario--estudiante-público)
   - [6.3. Autenticación con 2FA en Dos Pasos](#63-autenticación-con-2fa-en-dos-pasos)
   - [6.4. Configuración Inicial del 2FA (Código QR)](#64-configuración-inicial-del-2fa-código-qr)
   - [6.5. Email Marketing Masivo Asíncrono](#65-email-marketing-masivo-asíncrono)
   - [6.6. Seguridad: Verificación de Email y Reset de Password](#66-seguridad-verificación-de-email-y-reset-de-password)
   - [6.7. Gestión de Preferencias del Usuario](#67-gestión-de-preferencias-del-usuario)
   - [6.8. Catálogo de Beneficios (CRUD con Borrado Lógico)](#68-catálogo-de-beneficios-crud-con-borrado-lógico)
   - [6.9. Gestión de Facilitadores](#69-gestión-de-facilitadores)
   - [6.10. Inscripciones Manuales](#610-inscripciones-manuales)
   - [6.11. Verification Wall y Limpieza de Cuentas](#611-verification-wall-y-limpieza-de-cuentas)

---

## 1. Estrategia Global de Testing

La plataforma implementa una estrategia de pruebas multinivel para garantizar:
* La fiabilidad de las transacciones académicas y financieras.
* La protección de los mecanismos de seguridad y control de acceso (JWT en cookies HTTP-Only y 2FA TOTP).
* La integridad de los datasets que alimentan el pipeline de Machine Learning (XGBoost).

---

## 2. Pruebas Automatizadas de Backend (Pytest)

Para el backend en Python/Flask, se utiliza **Pytest** y **pytest-flask**.

### 2.1. Instalación de Dependencias
```bash
pip install pytest pytest-flask
```

### 2.2. Estructura del Directorio de Pruebas
```text
backend/
├── tests/
│   ├── conftest.py          # Configuración de fixtures (instancia Flask y sesión de DB temporal)
│   ├── test_auth.py         # Pruebas de login, emisión de JWT y flujo 2FA
│   ├── test_programas.py    # Pruebas de CRUD de programas, facilitadores y beneficios
│   └── test_stats.py        # Validación de cálculo de estadísticas del dashboard
```

### 2.3. Ejemplo de Prueba de Endpoint (`test_public.py`)
```python
def test_public_stats(client):
    """Verifica que el endpoint de estadísticas públicas retorne 200 y la estructura JSON esperada."""
    response = client.get('/api/public-stats')
    assert response.status_code == 200
    data = response.get_json()
    assert data.get('success') is True
    assert 'stats' in data
```

### 2.4. Ejecución de la Suite de Pruebas
```bash
# Ejecutar todas las pruebas del backend
pytest backend/tests

# Ejecutar con reporte de cobertura
pytest --cov=backend backend/tests
```

---

## 3. Pruebas Automatizadas de Frontend (Vitest & Cypress E2E)

### 3.1. Pruebas Unitarias y de Componentes (**Vitest** + **React Testing Library**)
Ideales para verificar el comportamiento de componentes atómicos y formateadores.

```bash
cd frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Ejemplo de prueba de componente (`Button.test.jsx`):**
```javascript
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import ActionButton from './ActionButton';

test('debe renderizar el botón con el texto correcto', () => {
  render(<ActionButton label="Inscribirme Ahora" />);
  expect(screen.getByText('Inscribirme Ahora')).toBeInTheDocument();
});
```

### 3.2. Pruebas de Extremo a Extremo (E2E) (**Cypress**)
Ideales para validar flujos completos de usuario (Registro $\rightarrow$ Verificación de Email $\rightarrow$ Login $\rightarrow$ Dashboard).

```bash
cd frontend
npm install cypress --save-dev
npx cypress open
```

---

## 4. Integración Continua (CI/CD con GitHub Actions)

Se automatiza la ejecución de linters y pruebas en cada `push` o `pull_request` a la rama principal.

**Archivo de configuración (`.github/workflows/ci.yml`):**
```yaml
name: CI Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.10'
      - name: Install dependencies
        run: |
          pip install -r backend/requirements.txt
          pip install pytest pytest-flask
      - name: Run Pytest
        run: pytest backend/tests

  frontend-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      - name: Install dependencies and Build
        run: |
          cd frontend
          npm ci
          npm run lint
          npm run build
```

---

## 5. Buenas Prácticas de Pruebas en el Ecosistema

1. **Aislamiento de Base de Datos:** Nunca ejecutar pruebas contra la base de datos de producción. Utilizar una base de datos PostgreSQL de test aislada o transacciones con rollback automático.
2. **Mocks para Servicios Externos:** Simular llamadas a servicios externos como Flask-Mail (SMTP), Google Analytics 4 y Google Trends para acelerar la ejecución y evitar fallos por conectividad.
3. **Persistencia de Cookies en Tests E2E:** Asegurar que los clientes de prueba gestionen cookies (`credentials: 'include'`) para validar correctamente el sistema de autenticación HTTP-Only.

---

## 6. Guía de Pruebas Manuales de API REST (Postman / Curl)

Esta sección permite auditar y probar manualmente todos los endpoints del backend en ejecución local (`http://localhost:5000`).

---

### 6.1. Suscripción al Boletín (Público)
Simula la captación de prospectos desde el pie de página.
* **Método:** `POST`
* **URL:** `http://localhost:5000/api/suscribir`
* **Headers:** `Content-Type: application/json`
* **Body:**
  ```json
  {
    "correo": "visitante@ejemplo.com"
  }
  ```
* **Respuesta Esperada:** `201 Created` con confirmación de registro en la tabla `boletin_informativo`.

---

### 6.2. Registro de Usuario / Estudiante (Público)
* **Método:** `POST`
* **URL:** `http://localhost:5000/api/registro`
* **Headers:** `Content-Type: application/json`
* **Body:**
  ```json
  {
    "nombre_completo": "Ana Martínez",
    "correo": "ana@estudiante.com",
    "password": "PasswordSegura123!"
  }
  ```
* **Respuesta Esperada:** `201 Created`. Se almacena la contraseña hasheada con Bcrypt y rol por defecto "Estudiante".

---

### 6.3. Autenticación con 2FA en Dos Pasos

#### PASO A: Primer Filtro (Credenciales)
* **Método:** `POST`
* **URL:** `http://localhost:5000/api/login`
* **Body:**
  ```json
  {
    "correo": "admin@autopoiesis.com",
    "password": "admin"
  }
  ```
* **Respuesta Esperada:**
  - *Sin 2FA:* `200 OK` y cookie `access_token` emitida.
  - *Con 2FA Activado:* `200 OK` con JSON:
    ```json
    {
      "requires_2fa": true,
      "temp_token": "eyJhbGciOiJIUzI1NiIsIn...",
      "message": "Requiere verificación de 2 pasos."
    }
    ```

#### PASO B: Segundo Filtro (Código TOTP de Google Authenticator)
* **Método:** `POST`
* **URL:** `http://localhost:5000/api/login/verify-2fa`
* **Body:**
  ```json
  {
    "temp_token": "TOKEN_TEMPORAL_DEL_PASO_A",
    "totp_code": "123456"
  }
  ```
* **Respuesta Esperada:** `200 OK` y captura de la cookie `access_token` definitiva.

---

### 6.4. Configuración Inicial del 2FA (Código QR)
Requiere sesión activa de Administrador.
* **Método:** `GET`
* **URL:** `http://localhost:5000/api/admin/seguridad/2fa/setup`
* **Respuesta Esperada:** `200 OK` con clave secreta textual y código QR en Base64 para sincronizar con la app móvil.

---

### 6.5. Email Marketing Masivo Asíncrono
* **Método:** `POST`
* **URL:** `http://localhost:5000/api/admin/mailing/send`
* **Headers:** Cookie `access_token` de Administrador.
* **Body (`form-data`):**
  * `asunto`: "Lanzamiento Nuevo Diplomado"
  * `mensaje`: "Contenido promocional del correo..."
  * `imagen`: *(Opcional)* Archivo JPG/PNG.
* **Respuesta Esperada:** `200 OK`. El backend inicia un hilo en background para enviar el correo masivo a los suscriptores activos.

---

### 6.6. Seguridad: Verificación de Email y Reset de Password

#### A. Verificación de Email con Token JWT
* **Método:** `POST`
* **URL:** `http://localhost:5000/api/verificar-email`
* **Body:** `{"token": "TOKEN_RECIBIDO_POR_CORREO"}`
* **Respuesta Esperada:** `200 OK` con mensaje "Email verificado con éxito".

#### B. Solicitar Recuperación de Contraseña
* **Método:** `POST`
* **URL:** `http://localhost:5000/api/olvide-password`
* **Body:** `{"correo": "usuario@ejemplo.com"}`
* **Respuesta Esperada:** `200 OK` y despacho del enlace de recuperación con vigencia de 1 hora.

#### C. Resetear Contraseña con Token
* **Método:** `POST`
* **URL:** `http://localhost:5000/api/reset-password`
* **Body:**
  ```json
  {
    "token": "TOKEN_DEL_CORREO_DE_RECUPERACION",
    "new_password": "NuevaPasswordFuerte123!"
  }
  ```
* **Respuesta Esperada:** `200 OK` con confirmación de actualización.

---

### 6.7. Gestión de Preferencias del Usuario
* **Consultar:** `GET http://localhost:5000/api/usuario/preferencias` $\rightarrow$ `{"suscrito_boletin": true}`.
* **Actualizar:** `PUT http://localhost:5000/api/usuario/preferencias` con `{"suscrito_boletin": false}` $\rightarrow$ `200 OK`.

---

### 6.8. Catálogo de Beneficios (CRUD con Borrado Lógico)
* **Crear:** `POST http://localhost:5000/api/admin/beneficios` con `{"nombre": "Acceso a Biblioteca Virtual"}` $\rightarrow$ `201 Created`.
* **Eliminar (Soft Delete):** `DELETE http://localhost:5000/api/admin/beneficios/1` $\rightarrow$ `200 OK` (se marca `eliminado = true` para mantener integridad histórica).

---

### 6.9. Gestión de Facilitadores
* **Listar:** `GET http://localhost:5000/api/admin/facilitadores` $\rightarrow$ Lista de usuarios con rol "Facilitador".
* **Crear:** `POST http://localhost:5000/api/admin/facilitadores` con credenciales de facilitador $\rightarrow$ `201 Created`.

---

### 6.10. Inscripciones Manuales
* **Listar Estudiantes:** `GET http://localhost:5000/api/admin/estudiantes`.
* **Crear Inscripción:**
  * **Método:** `POST`
  * **URL:** `http://localhost:5000/api/admin/inscripciones`
  * **Body:**
    ```json
    {
      "usuario_id": 5,
      "programa_id": 1,
      "estado_id": 1,
      "origen_id": 2,
      "costo_pagado": 1500.00,
      "fecha_inscripcion": "2026-05-08"
    }
    ```
  * **Respuesta Esperada:** `201 Created`.

---

### 6.11. Verification Wall y Limpieza de Cuentas
* **Reenviar Enlace de Verificación:** `POST /api/usuario/reenviar-verificacion` (con cookie de usuario autenticado).
* **Corregir Correo:** `POST /api/usuario/actualizar-correo-verificacion` con `{"nuevo_correo": "nuevo@correo.com"}`.
* **Limpieza de Cuentas Inactivas:** `DELETE /api/admin/limpieza-usuarios?dias=3` (Solo Admin) $\rightarrow$ Retorna el conteo de registros no verificados depurados.
