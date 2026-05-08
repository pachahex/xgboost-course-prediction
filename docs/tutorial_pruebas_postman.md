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
*   **Comportamiento Esperado:** Recibirás un `201 Created` con el mensaje *"Te has suscrito con éxito al boletín."*. Si revisas la base de datos, verás el correo en la tabla `boletin_informativo` y no en `usuarios`.

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

## 5. Módulo de Email Marketing (Mailing)

Ahora el backend soporta el envío real asíncrono y adjuntos de imagen.

*   **Método:** `POST`
*   **URL:** `http://localhost:5000/api/admin/mailing/send`
*   **Headers:** Incluir la cookie `access_token` de Admin.
*   **Body (form-data):**
    *   `asunto`: "Título de la campaña"
    *   `mensaje`: "Cuerpo del correo (soporta texto plano)"
    *   `imagen`: (Opcional) Selecciona un archivo de imagen (PNG/JPG).
*   **Comportamiento Esperado:** Recibirás un `200 OK`. El backend iniciará un hilo en segundo plano para enviar el correo masivo a todos los suscriptores activos. Podrás ver el progreso en los logs del contenedor (`docker logs`).

---

## 7. Gestión de Preferencias (Estudiante/Admin)

Permite al usuario logueado decidir si quiere estar en la lista de correo.

### PASO 7A: Obtener estado actual
*   **Método:** `GET`
*   **URL:** `http://localhost:5000/api/usuario/preferencias`
*   **Comportamiento Esperado:** `{"suscrito_boletin": true/false}`.

### PASO 7B: Actualizar suscripción
*   **Método:** `PUT`
*   **URL:** `http://localhost:5000/api/usuario/preferencias`
*   **Body (raw JSON):**
    ```json
    {
      "suscrito_boletin": true
    }
    ```
*   **Comportamiento Esperado:** `200 OK` con el mensaje de éxito. Esto sincroniza tanto la tabla `usuarios` como `boletin_informativo`.

---

## 6. Módulo de Seguridad: Verificación y Recuperación

### A. Verificación de Email (Simulación de link)
Cuando te registras, recibes un token JWT en tu correo. Para probar el endpoint manualmente:

*   **Método:** `POST`
*   **URL:** `http://localhost:5000/api/verificar-email`
*   **Body (raw JSON):**
    ```json
    {
      "token": "pega_aqui_el_token_que_viste_en_el_enlace_del_correo"
    }
    ```
*   **Comportamiento Esperado:** `200 OK` con el mensaje "Email verificado con éxito".

### B. Solicitar Recuperación (Olvidé mi contraseña)
*   **Método:** `POST`
*   **URL:** `http://localhost:5000/api/olvide-password`
*   **Body (raw JSON):**
    ```json
    {
      "correo": "tu_correo@gmail.com"
    }
    ```
*   **Comportamiento Esperado:** `200 OK`. El backend enviará el correo de recuperación.

### C. Resetear Contraseña con Token
*   **Método:** `POST`
*   **URL:** `http://localhost:5000/api/reset-password`
*   **Body (raw JSON):**
    ```json
    {
      "token": "token_recibido_en_el_correo_de_recuperacion",
      "new_password": "NuevaPasswordFuerte123!"
    }
    ```
*   **Comportamiento Esperado:** `200 OK` con el mensaje "Contraseña actualizada correctamente".

---

## 8. Gestión de Catálogos: Beneficios (Requiere ser Admin)

Estos endpoints permiten gestionar el catálogo de beneficios que se ofrecen en los programas.

### PASO 8A: Crear un Nuevo Beneficio
*   **Método:** `POST`
*   **URL:** `http://localhost:5000/api/admin/beneficios`
*   **Headers:** Incluir la cookie `access_token` de Admin.
*   **Body (raw JSON):**
    ```json
    {
      "nombre": "Acceso a Biblioteca Virtual Premium"
    }
    ```
*   **Comportamiento Esperado:** Recibirás un `201 Created` con el mensaje *"Beneficio creado con éxito."*. El nuevo beneficio aparecerá automáticamente en el catálogo para ser asignado a programas.

### PASO 8B: Eliminar un Beneficio
*   **Método:** `DELETE`
*   **URL:** `http://localhost:5000/api/admin/beneficios/ID_DEL_BENEFICIO`
*   **Headers:** Incluir la cookie `access_token` de Admin.
*   **(Nota:** Reemplaza `ID_DEL_BENEFICIO` por el ID numérico del beneficio que deseas borrar).
*   **Comportamiento Esperado:** Recibirás un `200 OK` con el mensaje *"Beneficio eliminado del catálogo (borrado lógico)."*. Gracias a la integridad referencial y lógica de la base de datos, este beneficio dejará de aparecer en los formularios pero sus datos históricos permanecerán en la tabla `beneficios` marcados como `eliminado = true`.

---
