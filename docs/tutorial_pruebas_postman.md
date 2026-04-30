# Tutorial de Pruebas con Postman (Fase 6)

Esta guía te ayudará a probar los nuevos flujos de Seguridad (2FA), Suscripciones y Registro utilizando **Postman** u otra herramienta de testing de APIs.

---

## 1. Módulo de Suscripción al Boletín (Público)

Simularemos cuando un usuario deja su correo en el pie de página (Footer).

*   **Método:** `POST`
*   **URL:** `http://localhost:5000/api/suscribir`
*   **Headers:** `Content-Type: application/json`
*   **Body (raw JSON):**
    ```json
    {
      "correo": "visitante@ejemplo.com"
    }
    ```
*   **Comportamiento Esperado:** Recibirás un `201 Created` con el mensaje *"Te has suscrito con éxito al boletín."*. Si revisas la base de datos, verás el correo en la tabla `suscriptores` y no en `usuarios`.

---

## 2. Registro de Nuevo Estudiante (Público)

Simularemos que una persona llena el formulario `/registro`.

*   **Método:** `POST`
*   **URL:** `http://localhost:5000/api/registro`
*   **Headers:** `Content-Type: application/json`
*   **Body (raw JSON):**
    ```json
    {
      "nombre_completo": "Ana Martínez",
      "correo": "ana@estudiante.com",
      "password": "mi_clave_secreta"
    }
    ```
*   **Comportamiento Esperado:** Recibirás un `201 Created`. En la base de datos se creará un registro en `usuarios` con el hash de bcrypt y el rol asignado a "Estudiante".

---

## 3. Flujo de Autenticación con 2FA Activado

Este es el proceso de "Dos Pasos" cuando la cuenta de Administrador ya activó Google Authenticator.

### PASO 3A: Primer Filtro (Usuario y Contraseña)
*   **Método:** `POST`
*   **URL:** `http://localhost:5000/api/login`
*   **Body (raw JSON):**
    ```json
    {
      "correo": "admin@autopoiesis.com",
      "password": "admin" 
    }
    ```
    *(Nota: Asegúrate de usar la contraseña correcta configurada en tu BD para el admin).*
*   **Comportamiento Esperado:**
    Si el administrador **no tiene 2FA**, recibe un `200 OK` y la cookie `access_token`.
    **Si el administrador tiene 2FA activado**, recibe:
    ```json
    {
      "message": "Requiere verificación de 2 pasos.",
      "requires_2fa": true,
      "temp_token": "eyJhbGciOiJIUzI1NiIsIn..."
    }
    ```
    **Guarda este `temp_token`** porque lo necesitas para el Paso 3B.

### PASO 3B: Segundo Filtro (Código TOTP de la App)
*   **Método:** `POST`
*   **URL:** `http://localhost:5000/api/login/verify-2fa`
*   **Body (raw JSON):**
    ```json
    {
      "temp_token": "EL_TOKEN_OBTENIDO_EN_PASO_3A",
      "totp_code": "123456" 
    }
    ```
    *(Reemplaza `123456` por los 6 dígitos que muestra tu app de Google Authenticator en este momento).*
*   **Comportamiento Esperado:** Si el código es correcto, recibirás un `200 OK`, el mensaje de *"Login exitoso"* y, lo más importante, Postman capturará la cookie definitiva `access_token` en la pestaña de *Cookies*.

---

## 4. Configuración Inicial del 2FA (Requiere ser Admin)

Este endpoint genera el Código QR. Requiere que envíes la cookie `access_token` del Administrador.

*   **Método:** `GET`
*   **URL:** `http://localhost:5000/api/admin/seguridad/2fa/setup`
*   **Headers:** Incluir la cookie `access_token` (Postman suele hacerlo automático si acabas de iniciar sesión).
*   **Comportamiento Esperado:** Retornará el `secret` en texto y un `qr_code` en base64. En el dashboard, la imagen Base64 se renderiza como el código de barras bidimensional.

---

## 5. Módulo de Mailing (Simulación)

*   **Método:** `POST`
*   **URL:** `http://localhost:5000/api/admin/mailing/send`
*   **Headers:** Incluir la cookie `access_token` de Admin.
*   **Body (raw JSON):**
    ```json
    {
      "asunto": "Nuevas ofertas de Cursos",
      "mensaje": "Hola! Queremos informarte que..."
    }
    ```
*   **Comportamiento Esperado:** Recibirás un `200 OK` indicando a cuántos destinatarios se "envió". Además, **si miras la consola/logs del backend (`docker logs xgboost-course-prediction-backend-1`)**, verás el resumen impreso confirmando los correos que se usaron en el envío simulado.
