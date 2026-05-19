from flask import Flask, request, jsonify, make_response, send_from_directory
from flask_cors import CORS
import jwt
import datetime
import bcrypt
from sqlalchemy import text
from db import get_db_connection
import os
import re
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.utils import secure_filename
import pyotp
import qrcode
import base64
from io import BytesIO
import json
from utils.email import mail, send_verification_email, send_reset_password_email, send_mass_mailing

app = Flask(__name__)
# Configuracion de Archivos
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)
# Habilitamos CORS, importante supportar cookies para HTTP-Only con frameworks JS (React)
CORS(app, supports_credentials=True, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

# En un entorno real debe ir en .env
SECRET_KEY = os.getenv("SECRET_KEY", "autopoiesis_super_secret_dev_key")

# Configuracion de Email
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@autopoiesis.com')

mail.init_app(app)

def admin_required(f):
    """Decorador para proteger rutas requiriendo el rol de Administrador usando JWT en Cookies HTTP-Only"""
    def wrap(*args, **kwargs):
        token = request.cookies.get('access_token')
        if not token:
            return jsonify({"error": "No token provisto. Acceso denegado."}), 401
            
        try:
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            if decoded.get('rol') != 'Administrador':
                return jsonify({"error": "No tienes privilegios de Administrador."}), 403
            
            # Pasar info del usuario a la función
            request.user_info = decoded
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expirado. Inicia sesión nuevamente."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token inválido."}), 401
            
        return f(*args, **kwargs)
    wrap.__name__ = f.__name__
    return wrap

def auth_required(f):
    """Decorador para proteger rutas requiriendo un JWT válido sin importar el rol"""
    def wrap(*args, **kwargs):
        token = request.cookies.get('access_token')
        if not token:
            return jsonify({"error": "No token provisto. Acceso denegado."}), 401
            
        try:
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            request.user_info = decoded
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expirado. Inicia sesión nuevamente."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token inválido."}), 401
            
        return f(*args, **kwargs)
    wrap.__name__ = f.__name__
    return wrap

# ==========================================
# UTILIDADES JWT PARA EMAILS
# ==========================================
def create_email_token(email, exp_hours=24):
    payload = {
        'email': email,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=exp_hours)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def decode_email_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload['email']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# ==========================================
# RUTAS DE AUTENTICACIÓN Y REGISTRO
# ==========================================

@app.route('/api/registro', methods=['POST'])
def registro():
    """Registro público de Estudiantes"""
    data = request.json
    nombre = data.get('nombre_completo')
    correo = data.get('correo')
    ci = data.get('ci')
    password = data.get('password')
    telefono = data.get('telefono')
    fecha_nacimiento = data.get('fecha_nacimiento')
    grado_academico_id = data.get('grado_academico_id')
    departamento_id = data.get('departamento_id')
    
    if not all([nombre, correo, ci, password, fecha_nacimiento, departamento_id, grado_academico_id]):
        return jsonify({"error": "Faltan campos obligatorios (incluyendo CI)."}), 400
        
    with get_db_connection() as conn:
        with conn.begin():
            # Buscar rol Estudiante
            rol_id = conn.execute(text("SELECT id FROM roles WHERE nombre = 'Estudiante'")).scalar()
            if not rol_id:
                return jsonify({"error": "Rol Estudiante no configurado en BD."}), 500
                
            # 3. Verificar si el correo o CI ya existe en usuarios
            exists = conn.execute(text("SELECT id FROM usuarios WHERE correo = :correo OR ci = :ci"), {"correo": correo, "ci": ci}).scalar()
            if exists:
                return jsonify({"error": "El correo o CI ya está registrado."}), 400

            # 4. Verificar si el correo ya estaba suscrito al boletín (como invitado)
            suscripcion_previa = conn.execute(text("""
                SELECT id FROM boletin_informativo WHERE correo = :correo AND activo = true
            """), {"correo": correo}).scalar()
            
            suscrito = True if suscripcion_previa else False
            
            # 5. Generar Hash de contraseña
            hash_pwd = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # 6. Insertar nuevo usuario
            user_id = conn.execute(text("""
                INSERT INTO usuarios (rol_id, departamento_id, grado_academico_id, nombre_completo, ci, correo, hash_contrasena, telefono, fecha_nacimiento, requiere_cambio_password)
                VALUES (:rid, :dep_id, :grado_id, :nombre, :ci, :correo, :pwd, :tel, :fnac, false)
                RETURNING id
            """), {
                "rid": rol_id, 
                "dep_id": departamento_id, 
                "grado_id": grado_academico_id,
                "nombre": nombre,
                "ci": ci,
                "correo": correo, 
                "pwd": hash_pwd,
                "tel": telefono,
                "fnac": fecha_nacimiento
            }).scalar()

            # 7. Si tenía suscripción previa, vincular el usuario_id en boletin_informativo
            if suscripcion_previa:
                conn.execute(text("""
                    UPDATE boletin_informativo SET usuario_id = :uid WHERE id = :sid
                """), {"uid": user_id, "sid": suscripcion_previa})
            
    # Intentar enviar el correo (no bloquea el registro si falla en dev)
    try:
        token = create_email_token(correo, 24)
        send_verification_email(correo, nombre, token)
    except Exception as e:
        print(f"Error enviando correo de verificación: {e}")
            
    return jsonify({"message": "Registro exitoso. Revisa tu bandeja de entrada para verificar tu correo."}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    correo = data.get('correo')
    password = data.get('password')
    
    if not correo or not password:
        return jsonify({"error": "Correo y contraseña obligatorios."}), 400
        
    with get_db_connection() as conn:
        res = conn.execute(text("""
            SELECT u.id, u.hash_contrasena, r.nombre as rol_nombre, u.nombre_completo, u.totp_enabled, u.email_verificado, u.requiere_cambio_password
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            WHERE u.correo = :correo
        """), {"correo": correo}).fetchone()
        
    if not res:
        return jsonify({"error": "Credenciales inválidas."}), 401
        
    user_id, hash_bd, rol_nombre, nombre, totp_enabled, email_verificado, requiere_cambio = res
    
    # Validar contraseña bcrypt
    if bcrypt.checkpw(password.encode('utf-8'), hash_bd.encode('utf-8')):
        
        # Si 2FA está activado, retornamos un token temporal y requires_2fa
        if totp_enabled:
            temp_payload = {
                "sub": user_id,
                "temp": True,
                "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
            }
            temp_token = jwt.encode(temp_payload, SECRET_KEY, algorithm="HS256")
            return jsonify({
                "requires_2fa": True,
                "temp_token": temp_token,
                "message": "Requiere verificación de 2 pasos."
            }), 200

        # Si no tiene 2FA, procedemos con el login normal
        payload = {
            "sub": user_id,
            "nombre": nombre,
            "rol": rol_nombre,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8)
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
        
        resp = make_response(jsonify({
            "message": "Login exitoso",
            "user": {
                "nombre": nombre, 
                "rol": rol_nombre, 
                "email_verificado": email_verificado,
                "requiere_cambio_password": requiere_cambio
            }
        }))
        
        resp.set_cookie(
            'access_token', 
            token, 
            httponly=True,
            secure=False,
            samesite='Lax'
        )
        return resp, 200
    else:
        return jsonify({"error": "Credenciales inválidas."}), 401

@app.route('/api/login/verify-2fa', methods=['POST'])
def verify_2fa():
    """Verifica el token temporal y el código TOTP para emitir la cookie final"""
    data = request.json
    temp_token = data.get('temp_token')
    totp_code = data.get('totp_code')
    
    if not temp_token or not totp_code:
        return jsonify({"error": "Faltan datos de verificación."}), 400
        
    try:
        decoded = jwt.decode(temp_token, SECRET_KEY, algorithms=["HS256"])
        if not decoded.get('temp'):
            return jsonify({"error": "Token inválido para esta operación."}), 401
            
        user_id = decoded['sub']
        
        with get_db_connection() as conn:
            res = conn.execute(text("""
                SELECT u.totp_secret, u.nombre_completo, r.nombre as rol_nombre, u.requiere_cambio_password
                FROM usuarios u
                JOIN roles r ON u.rol_id = r.id
                WHERE u.id = :uid
            """), {"uid": user_id}).fetchone()
            
        if not res or not res.totp_secret:
            return jsonify({"error": "Configuración 2FA inválida."}), 400
            
        totp_secret, nombre, rol_nombre, requiere_cambio = res
        
        # Verificar código con pyotp (valid_window=2 para tolerar desfases de tiempo en Docker)
        totp = pyotp.TOTP(totp_secret)
        if totp.verify(totp_code, valid_window=2):
            
            # Recuperar email_verificado adicionalmente
            with get_db_connection() as conn:
                res_email = conn.execute(text("SELECT email_verificado FROM usuarios WHERE id = :uid"), {"uid": user_id}).fetchone()
            email_verificado = res_email.email_verificado if res_email else False
            
            # Emitir cookie final
            payload = {
                "sub": user_id,
                "nombre": nombre,
                "rol": rol_nombre,
                "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8)
            }
            token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
            
            resp = make_response(jsonify({
                "message": "Login exitoso",
                "user": {
                    "nombre": nombre, 
                    "rol": rol_nombre, 
                    "email_verificado": email_verificado,
                    "requiere_cambio_password": requiere_cambio
                }
            }))
            
            resp.set_cookie(
                'access_token', 
                token, 
                httponly=True,
                secure=False,
                samesite='Lax'
            )
            return resp, 200
        else:
            return jsonify({"error": "Código 2FA incorrecto."}), 401
            
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "El tiempo para ingresar el código expiró."}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Token temporal inválido."}), 401

@app.route('/api/login/cambiar-password-forzado', methods=['POST'])
@auth_required
def cambiar_password_forzado():
    """Permite al usuario cambiar su contraseña temporal si es requerido"""
    data = request.json
    new_password = data.get('new_password')
    
    if not new_password or len(new_password) < 8:
        return jsonify({"error": "La contraseña debe tener al menos 8 caracteres."}), 400
        
    user_id = request.user_info['sub']
    hash_pwd = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    with get_db_connection() as conn:
        with conn.begin():
            req = conn.execute(text("SELECT requiere_cambio_password FROM usuarios WHERE id = :uid"), {"uid": user_id}).scalar()
            if not req:
                return jsonify({"error": "No se requiere cambio de contraseña."}), 400
                
            conn.execute(text("""
                UPDATE usuarios SET hash_contrasena = :pwd, requiere_cambio_password = false WHERE id = :uid
            """), {"pwd": hash_pwd, "uid": user_id})
            
    return jsonify({"message": "Contraseña actualizada exitosamente."}), 200

# ==========================================
# RUTAS DE CORREO (VERIFICACIÓN Y RESET)
# ==========================================

@app.route('/api/verificar-email', methods=['POST'])
def verificar_email():
    token = request.json.get('token')
    if not token:
        return jsonify({"error": "Token ausente"}), 400
        
    correo = decode_email_token(token)
    if not correo:
        return jsonify({"error": "Token inválido o expirado"}), 400
        
    with get_db_connection() as conn:
        with conn.begin():
            res = conn.execute(text("UPDATE usuarios SET email_verificado = true WHERE correo = :correo RETURNING id"), {"correo": correo}).fetchone()
            if not res:
                return jsonify({"error": "Usuario no encontrado"}), 404
                
    return jsonify({"message": "Correo verificado exitosamente"}), 200

@app.route('/api/olvide-password', methods=['POST'])
def olvide_password():
    correo = request.json.get('correo')
    if not correo:
        return jsonify({"error": "Correo obligatorio"}), 400
        
    with get_db_connection() as conn:
        user = conn.execute(text("SELECT nombre_completo FROM usuarios WHERE correo = :correo"), {"correo": correo}).fetchone()
        
    # Siempre retornamos exito para evitar enumeración de correos
    if user:
        nombre = user.nombre_completo
        try:
            token = create_email_token(correo, exp_hours=1)
            send_reset_password_email(correo, nombre, token)
        except Exception as e:
            print(f"Error enviando correo de reset: {e}")
            
    return jsonify({"message": "Si el correo está registrado, recibirás un enlace de recuperación."}), 200

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    token = data.get('token')
    new_password = data.get('password')
    
    if not token or not new_password:
        return jsonify({"error": "Faltan datos"}), 400
        
    correo = decode_email_token(token)
    if not correo:
        return jsonify({"error": "Token inválido o expirado"}), 400
        
    hash_pwd = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    with get_db_connection() as conn:
        with conn.begin():
            conn.execute(text("UPDATE usuarios SET hash_contrasena = :pwd WHERE correo = :correo"), {"pwd": hash_pwd, "correo": correo})
            
    return jsonify({"message": "Contraseña actualizada exitosamente."}), 200

@app.route('/api/logout', methods=['POST'])
def logout():
    resp = make_response(jsonify({"message": "Sesión cerrada exitosamente."}))
    resp.set_cookie('access_token', '', expires=0)
    return resp, 200

@app.route('/api/usuario/reenviar-verificacion', methods=['POST'])
@auth_required
def reenviar_verificacion():
    """Permite al usuario solicitar un nuevo link de verificación"""
    user_id = request.user_info.get('sub') # JWT usa 'sub' para el ID del usuario
    
    with get_db_connection() as conn:
        user = conn.execute(text("SELECT nombre_completo, correo, email_verificado FROM usuarios WHERE id = :uid"), {"uid": user_id}).fetchone()
        
        if not user:
            return jsonify({"error": "Usuario no encontrado."}), 404
        
        if user.email_verificado:
            return jsonify({"error": "Tu cuenta ya está verificada."}), 400
            
        try:
            token = create_email_token(user.correo, 24)
            send_verification_email(user.correo, user.nombre_completo, token)
            return jsonify({"message": "Correo de verificación reenviado con éxito."}), 200
        except Exception as e:
            return jsonify({"error": f"Error al enviar el correo: {str(e)}"}), 500

@app.route('/api/usuario/actualizar-correo-verificacion', methods=['POST'])
@auth_required
def actualizar_correo_verificacion():
    """Permite cambiar el correo si el actual está mal escrito y aún no ha sido verificado"""
    user_id = request.user_info.get('sub')
    new_email = request.json.get('nuevo_correo')
    
    if not new_email:
        return jsonify({"error": "El nuevo correo es obligatorio."}), 400
        
    # Validar formato de nuevo correo
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', new_email):
        return jsonify({"error": "Formato de correo inválido."}), 400

    with get_db_connection() as conn:
        with conn.begin():
            # 1. Verificar que el usuario no esté verificado aún
            user = conn.execute(text("SELECT nombre_completo, email_verificado FROM usuarios WHERE id = :uid"), {"uid": user_id}).fetchone()
            
            if not user:
                return jsonify({"error": "Usuario no encontrado."}), 404
            
            if user.email_verificado:
                return jsonify({"error": "No puedes cambiar el correo de una cuenta ya verificada por este medio."}), 400
            
            # 2. Verificar si el nuevo correo ya existe en otro usuario
            exists = conn.execute(text("SELECT id FROM usuarios WHERE correo = :c AND id != :uid"), {"c": new_email, "uid": user_id}).scalar()
            if exists:
                return jsonify({"error": "Este correo ya está registrado por otro usuario."}), 400
                
            # 3. Actualizar correo
            conn.execute(text("UPDATE usuarios SET correo = :c WHERE id = :uid"), {"c": new_email, "uid": user_id})
            
            # 4. Enviar nuevo link
            token = create_email_token(new_email, 24)
            send_verification_email(new_email, user.nombre_completo, token)
            
    return jsonify({"message": "Correo actualizado y nueva verificación enviada."}), 200

@app.route('/api/admin/limpieza-usuarios', methods=['DELETE'])
@admin_required
def limpieza_usuarios():
    """Elimina cuentas que no han sido verificadas después de X días (Default 3)"""
    dias = request.args.get('dias', 3)
    
    with get_db_connection() as conn:
        with conn.begin():
            # Nota: En PostgreSQL INTERVAL 'X days' requiere cuidado con parámetros. Usamos concatenación segura.
            result = conn.execute(text(f"""
                DELETE FROM usuarios 
                WHERE email_verificado = false 
                AND fecha_creacion < (CURRENT_TIMESTAMP - INTERVAL '{dias} days')
                RETURNING id
            """)).fetchall()
            
    return jsonify({"message": f"Limpieza completada. Se eliminaron {len(result)} cuentas inactivas."}), 200

@app.route('/api/usuario/check-verificacion', methods=['GET'])
@auth_required
def check_verificacion():
    """Consulta el estado real de verificación en la DB para refrescar el frontend"""
    user_id = request.user_info.get('sub')
    with get_db_connection() as conn:
        res = conn.execute(text("SELECT email_verificado FROM usuarios WHERE id = :uid"), {"uid": user_id}).fetchone()
        if res and res.email_verificado:
            return jsonify({"verificado": True}), 200
        return jsonify({"verificado": False}), 200

# ==========================================
# RUTAS PÚBLICAS
# ==========================================

@app.route('/api/public-stats', methods=['GET'])
def get_public_stats():
    """Retorna estadísticas generales de la academia para la Portada (Hero/Ventas)"""
    with get_db_connection() as conn:
        total_egresados = conn.execute(text("SELECT COUNT(*) FROM inscripciones WHERE estado_id = (SELECT id FROM estados_inscripcion WHERE nombre = 'Completado')")).scalar() or 0
        total_programas = conn.execute(text("SELECT COUNT(*) FROM programas")).scalar() or 0
        
    return jsonify({
        "stats": [
            {"label": "+ Años de Experiencia", "value": 3},
            {"label": "Egresados", "value": total_egresados},
            {"label": "Programas Activos", "value": total_programas}
        ]
    })

@app.route('/api/departamentos', methods=['GET'])
def get_public_departamentos():
    """Retorna la lista de departamentos para el formulario de registro"""
    with get_db_connection() as conn:
        result = conn.execute(text("SELECT id, nombre FROM departamentos ORDER BY id")).fetchall()
        departamentos = [{"id": r.id, "nombre": r.nombre} for r in result]
    return jsonify(departamentos)

@app.route('/api/grados-academicos', methods=['GET'])
def get_public_grados():
    """Retorna la lista de grados académicos para el formulario de registro"""
    with get_db_connection() as conn:
        result = conn.execute(text("SELECT id, nombre FROM grados_academicos ORDER BY id")).fetchall()
        grados = [{"id": r.id, "nombre": r.nombre} for r in result]
    return jsonify(grados)

@app.route('/api/programas', methods=['GET'])
def get_public_programas():
    """Retorna el catálogo unificado de Cursos y Diplomados ACTIVOS para la Portada"""
    with get_db_connection() as conn:
        result = conn.execute(text("""
            SELECT p.id, p.nombre, p.costo_oficial_bs, c.nombre as categoria, 
                   ts.nombre as tipo, m.nombre as modalidad, 
                   p.duracion_horas,
                   p.imagen_url, p.descripcion, p.activo
            FROM programas p
            JOIN categorias c ON p.categoria_id = c.id
            JOIN tipos_servicio ts ON p.tipo_servicio_id = ts.id
            JOIN modalidades m ON p.modalidad_id = m.id
            WHERE p.activo = true AND p.eliminado = false
            ORDER BY p.id DESC
        """)).fetchall()
        
        programas = []
        for r in result:
            programas.append({
                "id": r.id,
                "nombre": r.nombre,
                "costo": float(r.costo_oficial_bs),
                "categoria": r.categoria,
                "tipo": r.tipo,
                "modalidad": r.modalidad,
                "duracion_horas": r.duracion_horas,
                "imagen_url": r.imagen_url,
                "descripcion": r.descripcion,
                "activo": r.activo
            })
    return jsonify(programas)

@app.route('/api/programas/<int:id>', methods=['GET'])
def get_public_programa_detalle(id):
    """Retorna los detalles de un programa específico, incluyendo beneficios y facilitadores"""
    with get_db_connection() as conn:
        r = conn.execute(text("""
            SELECT p.id, p.nombre, p.costo_oficial_bs, c.nombre as categoria, 
                   ts.nombre as tipo, m.nombre as modalidad, 
                   p.duracion_horas,
                   p.imagen_url, p.descripcion, p.activo
            FROM programas p
            JOIN categorias c ON p.categoria_id = c.id
            JOIN tipos_servicio ts ON p.tipo_servicio_id = ts.id
            JOIN modalidades m ON p.modalidad_id = m.id
            WHERE p.id = :id AND p.eliminado = false
        """), {"id": id}).fetchone()
        
        if not r:
            return jsonify({"error": "Programa no encontrado."}), 404
            
        beneficios = conn.execute(text("""
            SELECT b.nombre 
            FROM programa_beneficios pb
            JOIN beneficios b ON pb.beneficio_id = b.id
            WHERE pb.programa_id = :id
        """), {"id": id}).fetchall()
        
        cohort = conn.execute(text("""
            SELECT fecha_inicio, fecha_fin 
            FROM cohortes 
            WHERE programa_id = :id 
            ORDER BY id DESC 
            LIMIT 1
        """), {"id": id}).fetchone()
        
        facilitadores = conn.execute(text("""
            SELECT u.nombre_completo 
            FROM programa_facilitadores pf
            JOIN usuarios u ON pf.facilitador_id = u.id
            WHERE pf.programa_id = :id
        """), {"id": id}).fetchall()
        
        programa = {
            "id": r.id,
            "nombre": r.nombre,
            "costo": float(r.costo_oficial_bs),
            "categoria": r.categoria,
            "tipo": r.tipo,
            "modalidad": r.modalidad,
            "duracion_horas": r.duracion_horas,
            "imagen_url": r.imagen_url,
            "descripcion": r.descripcion,
            "activo": r.activo,
            "fecha_inicio": str(cohort.fecha_inicio) if cohort else None,
            "fecha_fin": str(cohort.fecha_fin) if cohort else None,
            "beneficios": [{"nombre": b.nombre, "descripcion": None} for b in beneficios],
            "facilitadores": [f.nombre_completo for f in facilitadores]
        }
    return jsonify(programa)

@app.route('/api/admin/programas/all', methods=['GET'])
@admin_required
def get_all_programas():
    """Retorna todos los programas, tanto activos como inactivos, para el Dashboard"""
    with get_db_connection() as conn:
        result = conn.execute(text("""
            SELECT p.id, p.nombre, p.costo_oficial_bs, c.nombre as categoria, 
                   ts.nombre as tipo, m.nombre as modalidad, 
                   p.duracion_horas,
                   p.imagen_url, p.descripcion, p.activo,
                   (SELECT ARRAY_AGG(beneficio_id) FROM programa_beneficios WHERE programa_id = p.id) as beneficios_ids,
                   (SELECT ARRAY_AGG(facilitador_id) FROM programa_facilitadores WHERE programa_id = p.id) as facilitadores_ids,
                   (SELECT fecha_inicio FROM cohortes WHERE programa_id = p.id ORDER BY id DESC LIMIT 1) as fecha_inicio,
                   (SELECT fecha_fin FROM cohortes WHERE programa_id = p.id ORDER BY id DESC LIMIT 1) as fecha_fin
            FROM programas p
            JOIN categorias c ON p.categoria_id = c.id
            JOIN tipos_servicio ts ON p.tipo_servicio_id = ts.id
            JOIN modalidades m ON p.modalidad_id = m.id
            WHERE p.eliminado = false
            ORDER BY p.id DESC
        """)).fetchall()
        
        programas = []
        for r in result:
            programas.append({
                "id": r.id,
                "nombre": r.nombre,
                "costo": float(r.costo_oficial_bs),
                "categoria": r.categoria,
                "tipo": r.tipo,
                "modalidad": r.modalidad,
                "duracion_horas": r.duracion_horas,
                "imagen_url": r.imagen_url,
                "descripcion": r.descripcion,
                "activo": r.activo,
                "beneficios_ids": r.beneficios_ids if r.beneficios_ids else [],
                "facilitadores_ids": r.facilitadores_ids if r.facilitadores_ids else [],
                "fecha_inicio": str(r.fecha_inicio) if r.fecha_inicio else "",
                "fecha_fin": str(r.fecha_fin) if r.fecha_fin else ""
            })
    return jsonify(programas)

@app.route('/api/admin/cohortes/all', methods=['GET'])
@admin_required
def get_admin_cohortes():
    """Retorna todas las cohortes para uso administrativo con conteos de enrollees"""
    with get_db_connection() as conn:
        result = conn.execute(text("""
            SELECT c.id, c.nombre, p.nombre as programa, c.fecha_inicio, c.fecha_fin, c.activo,
                   COUNT(i.id) as total_inscritos,
                   COALESCE(SUM(CASE WHEN i.estado_id = (SELECT id FROM estados_inscripcion WHERE nombre = 'Activo') THEN 1 ELSE 0 END), 0) as activos,
                   COALESCE(SUM(CASE WHEN i.estado_id = (SELECT id FROM estados_inscripcion WHERE nombre = 'Finalizado') THEN 1 ELSE 0 END), 0) as finalizados,
                   COALESCE(SUM(CASE WHEN i.estado_id = (SELECT id FROM estados_inscripcion WHERE nombre = 'Pendiente de Pago') THEN 1 ELSE 0 END), 0) as pendientes
            FROM cohortes c
            JOIN programas p ON c.programa_id = p.id
            LEFT JOIN inscripciones i ON i.cohorte_id = c.id
            GROUP BY c.id, p.id
            ORDER BY c.fecha_inicio DESC
        """)).fetchall()
        
        cohortes = []
        for r in result:
            cohortes.append({
                "id": r.id,
                "nombre": f"{r.programa} - {r.nombre}",
                "programa_nombre": r.programa,
                "cohorte_nombre": r.nombre,
                "fecha_inicio": str(r.fecha_inicio),
                "fecha_fin": str(r.fecha_fin),
                "activo": r.activo,
                "total_inscritos": r.total_inscritos,
                "activos": r.activos,
                "finalizados": r.finalizados,
                "pendientes": r.pendientes
            })
    return jsonify(cohortes)

@app.route('/api/uploads/<path:filename>')
def serve_upload(filename):
    """Serve los archivos estáticos guardados por los administradores"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/suscribir', methods=['POST'])
def suscribir():
    """Captura de leads/correos del footer asegurando guardarlos en la tabla de marketing aislada"""
    data = request.json
    correo = data.get('correo')
    
    if not correo:
        return jsonify({"error": "El correo es requerido."}), 400
        
    with get_db_connection() as conn:
        with conn.begin():
            try:
                # 1. Recuperar ID de usuario si existe
                user_id = conn.execute(text("SELECT id FROM usuarios WHERE correo = :correo"), {"correo": correo}).scalar()
                
                # 2. Guardar en tabla de marketing con su ID si lo tenemos
                conn.execute(text("""
                    INSERT INTO boletin_informativo (correo, usuario_id)
                    VALUES (:correo, :uid)
                    ON CONFLICT (correo) DO UPDATE SET usuario_id = EXCLUDED.usuario_id
                """), {"correo": correo, "uid": user_id})
                
                return jsonify({"message": "Te has suscrito con éxito al boletín."}), 201
            except Exception as e:
                return jsonify({"error": f"Error interno: {str(e)}"}), 500

@app.route('/api/admin/estudiantes', methods=['GET'])
@admin_required
def get_all_estudiantes():
    """Retorna todos los estudiantes registrados (históricos y nuevos)"""
    with get_db_connection() as conn:
        result = conn.execute(text("""
            SELECT u.id, u.nombre_completo, u.ci, u.correo, u.telefono, u.fecha_creacion, g.nombre as grado, d.nombre as departamento
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            LEFT JOIN grados_academicos g ON u.grado_academico_id = g.id
            LEFT JOIN departamentos d ON u.departamento_id = d.id
            WHERE r.nombre = 'Estudiante'
            ORDER BY u.id DESC
        """)).fetchall()
        
        estudiantes = [{
            "id": r.id, "nombre": r.nombre_completo, "ci": r.ci, "correo": r.correo,
            "telefono": r.telefono, "fecha_creacion": r.fecha_creacion,
            "grado": r.grado, "departamento": r.departamento
        } for r in result]
    return jsonify(estudiantes)

@app.route('/api/admin/estudiantes', methods=['POST'])
@admin_required
def crear_estudiante():
    """Crea un estudiante manualmente, usando su CI como contraseña obligatoria"""
    data = request.json
    nombre = data.get('nombre_completo')
    correo = data.get('correo')
    ci = data.get('ci')
    telefono = data.get('telefono')
    fecha_nacimiento = data.get('fecha_nacimiento')
    grado_academico_id = data.get('grado_academico_id')
    departamento_id = data.get('departamento_id')
    
    if not all([nombre, correo, ci, fecha_nacimiento, departamento_id, grado_academico_id]):
        return jsonify({"error": "Faltan campos obligatorios."}), 400
        
    with get_db_connection() as conn:
        with conn.begin():
            rol_id = conn.execute(text("SELECT id FROM roles WHERE nombre = 'Estudiante'")).scalar()
            
            exists = conn.execute(text("SELECT id FROM usuarios WHERE correo = :correo OR ci = :ci"), {"correo": correo, "ci": ci}).scalar()
            if exists:
                return jsonify({"error": "El correo o CI ya está registrado."}), 400
            
            # Hash del CI como contraseña inicial
            hash_pwd = bcrypt.hashpw(ci.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            user_id = conn.execute(text("""
                INSERT INTO usuarios (rol_id, departamento_id, grado_academico_id, nombre_completo, ci, correo, hash_contrasena, telefono, fecha_nacimiento, requiere_cambio_password, email_verificado)
                VALUES (:rid, :dep_id, :grado_id, :nombre, :ci, :correo, :pwd, :tel, :fnac, true, true)
                RETURNING id
            """), {
                "rid": rol_id, 
                "dep_id": departamento_id, 
                "grado_id": grado_academico_id,
                "nombre": nombre, 
                "ci": ci,
                "correo": correo, 
                "pwd": hash_pwd,
                "tel": telefono,
                "fnac": fecha_nacimiento
            }).scalar()
            
    return jsonify({"message": "Estudiante creado. Su contraseña es su CI.", "user_id": user_id}), 201

@app.route('/api/admin/programas/<int:programa_id>/cerrar', methods=['POST'])
@admin_required
def cerrar_programa(programa_id):
    """Cierra un programa (activo = false) y actualiza los estados de inscripciones."""
    with get_db_connection() as conn:
        with conn.begin():
            # Marcar el programa como inactivo
            conn.execute(text("UPDATE programas SET activo = false WHERE id = :pid"), {"pid": programa_id})
            
            # Marcar cohortes asociados como inactivos
            conn.execute(text("UPDATE cohortes SET activo = false WHERE programa_id = :pid"), {"pid": programa_id})
            
            # Actualizar inscripciones 'Activo' -> 'Finalizado'
            conn.execute(text("""
                UPDATE inscripciones 
                SET estado_id = (SELECT id FROM estados_inscripcion WHERE nombre = 'Finalizado') 
                WHERE cohorte_id IN (SELECT id FROM cohortes WHERE programa_id = :pid) 
                AND estado_id = (SELECT id FROM estados_inscripcion WHERE nombre = 'Activo')
            """), {"pid": programa_id})
            
            # Actualizar inscripciones 'Pendiente de Pago' -> 'Retirado'
            conn.execute(text("""
                UPDATE inscripciones 
                SET estado_id = (SELECT id FROM estados_inscripcion WHERE nombre = 'Retirado') 
                WHERE cohorte_id IN (SELECT id FROM cohortes WHERE programa_id = :pid) 
                AND estado_id = (SELECT id FROM estados_inscripcion WHERE nombre = 'Pendiente de Pago')
            """), {"pid": programa_id})
            
    return jsonify({"message": "Programa y sus cohortes cerrados, inscripciones actualizadas."}), 200

# ==========================================
# RUTAS PRIVADAS (ADMIN)
# ==========================================

@app.route('/api/admin/inscripciones', methods=['GET'])
@admin_required
def get_inscripciones():
    """Obtiene una lista paginada y estructurada de las inscripciones para el CRUD/Dashboard"""
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 50))
    cohorte_id = request.args.get('cohorte_id', '')
    offset = (page - 1) * limit
    
    with get_db_connection() as conn:
        if cohorte_id:
            total = conn.execute(text("SELECT COUNT(*) FROM inscripciones WHERE cohorte_id = :cid"), {"cid": cohorte_id}).scalar()
            query = text("""
                SELECT i.id, i.usuario_id, u.nombre_completo as usuario_nombre, u.ci as usuario_ci,
                       p.nombre as programa, c.nombre as cohorte, d.nombre as departamento, e.nombre as estado, 
                       o.nombre as origen,
                       i.fecha_inscripcion, 
                       EXTRACT(YEAR FROM age(i.fecha_inscripcion, u.fecha_nacimiento))::INT as edad_estudiante,
                       i.costo_pagado as costo 
                FROM inscripciones i
                JOIN cohortes c ON i.cohorte_id = c.id
                JOIN programas p ON c.programa_id = p.id
                JOIN usuarios u ON i.usuario_id = u.id
                JOIN departamentos d ON u.departamento_id = d.id
                JOIN estados_inscripcion e ON i.estado_id = e.id
                JOIN origenes_captacion o ON i.origen_id = o.id
                WHERE i.cohorte_id = :cid
                ORDER BY i.fecha_inscripcion DESC
                LIMIT :l OFFSET :o
            """)
            result = conn.execute(query, {"cid": cohorte_id, "l": limit, "o": offset}).fetchall()
        else:
            total = conn.execute(text("SELECT COUNT(*) FROM inscripciones")).scalar()
            query = text("""
                SELECT i.id, i.usuario_id, u.nombre_completo as usuario_nombre, u.ci as usuario_ci,
                       p.nombre as programa, c.nombre as cohorte, d.nombre as departamento, e.nombre as estado, 
                       o.nombre as origen,
                       i.fecha_inscripcion, 
                       EXTRACT(YEAR FROM age(i.fecha_inscripcion, u.fecha_nacimiento))::INT as edad_estudiante,
                       i.costo_pagado as costo 
                FROM inscripciones i
                JOIN cohortes c ON i.cohorte_id = c.id
                JOIN programas p ON c.programa_id = p.id
                JOIN usuarios u ON i.usuario_id = u.id
                JOIN departamentos d ON u.departamento_id = d.id
                JOIN estados_inscripcion e ON i.estado_id = e.id
                JOIN origenes_captacion o ON i.origen_id = o.id
                ORDER BY i.fecha_inscripcion DESC
                LIMIT :l OFFSET :o
            """)
            result = conn.execute(query, {"l": limit, "o": offset}).fetchall()
        
        inscripciones = []
        for r in result:
            inscripciones.append({
                "id": r.id,
                "usuario_id": r.usuario_id,
                "usuario_nombre": r.usuario_nombre,
                "usuario_ci": r.usuario_ci,
                "programa": r.programa,
                "cohorte": r.cohorte,
                "departamento": r.departamento,
                "estado": r.estado,
                "origen": r.origen,
                "fecha": str(r.fecha_inscripcion),
                "edad": r.edad_estudiante,
                "costo": float(r.costo)
            })
            
    return jsonify({
        "total": total,
        "page": page,
        "data": inscripciones
    })

@app.route('/api/admin/programas', methods=['POST'])
@admin_required
def create_programa():
    """Recibe detalles de un nuevo programa (Curso/Diplomado), facilitadores, y su miniatura visual opcional"""
    nombre = request.form.get('nombre')
    costo = request.form.get('costo')
    categoria_id = request.form.get('categoria_id')
    tipo_servicio_id = request.form.get('tipo_servicio_id')
    modalidad_id = request.form.get('modalidad_id', 1)
    duracion_horas = request.form.get('duracion_horas')
    descripcion = request.form.get('descripcion')
    activo = request.form.get('activo') == 'true'
    fecha_inicio = request.form.get('fecha_inicio')
    fecha_fin = request.form.get('fecha_fin')
    beneficios_ids = request.form.getlist('beneficios[]')
    facilitadores_ids = request.form.getlist('facilitadores[]')
    
    if not all([nombre, costo, categoria_id, tipo_servicio_id]):
         return jsonify({"error": "Faltan campos obligatorios"}), 400
         
    file = request.files.get('imagen')
    imagen_url = None
    
    if file and file.filename != '':
        filename = secure_filename(f"{int(datetime.datetime.now().timestamp())}_{file.filename}")
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        imagen_url = f"/api/uploads/{filename}"
        
    with get_db_connection() as conn:
        with conn.begin():
            # Insertar el programa principal
            programa_id = conn.execute(text("""
                INSERT INTO programas (nombre, categoria_id, tipo_servicio_id, modalidad_id, costo_oficial_bs, 
                                       duracion_horas, imagen_url, descripcion, activo)
                VALUES (:n, :c_id, :t_id, :m_id, :costo, :dur, :img, :desc, :act)
                RETURNING id
            """), {
                "n": nombre.upper(), 
                "c_id": categoria_id, 
                "t_id": tipo_servicio_id,
                "m_id": modalidad_id,
                "costo": costo,
                "dur": duracion_horas if duracion_horas else None,
                "img": imagen_url,
                "desc": descripcion,
                "act": activo
            }).scalar()
            
            # Crear cohorte activa por defecto detrás de escena si se definieron fechas
            if fecha_inicio and fecha_fin:
                cohorte_nombre = "Edición Inicial"
                try:
                    meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
                    dt = datetime.datetime.strptime(fecha_inicio, "%Y-%m-%d")
                    cohorte_nombre = f"Edición {meses[dt.month - 1]} {dt.year}"
                except:
                    pass
                conn.execute(text("""
                    INSERT INTO cohortes (programa_id, nombre, fecha_inicio, fecha_fin, activo)
                    VALUES (:pid, :name, :start, :end, :act)
                """), {
                    "pid": programa_id,
                    "name": cohorte_nombre,
                    "start": fecha_inicio,
                    "end": fecha_fin,
                    "act": activo
                })
            
            # Insertar beneficios opcionales
            if beneficios_ids:
                for b_id in beneficios_ids:
                    conn.execute(text("""
                        INSERT INTO programa_beneficios (programa_id, beneficio_id)
                        VALUES (:pid, :bid)
                    """), {"pid": programa_id, "bid": b_id})
                    
            # Insertar facilitadores
            if facilitadores_ids:
                for f_id in facilitadores_ids:
                    conn.execute(text("""
                        INSERT INTO programa_facilitadores (programa_id, facilitador_id)
                        VALUES (:pid, :fid)
                    """), {"pid": programa_id, "fid": f_id})
            
    return jsonify({"message": "Programa publicado con éxito"}), 201
            
    return jsonify({"message": "Programa publicado con éxito"}), 201

@app.route('/api/admin/programas/<int:programa_id>', methods=['PUT'])
@admin_required
def update_programa(programa_id):
    """Actualiza la información (y opcionalmente la imagen) de un programa existente para conservar historial ML"""
    nombre = request.form.get('nombre')
    costo = request.form.get('costo')
    categoria_id = request.form.get('categoria_id')
    tipo_servicio_id = request.form.get('tipo_servicio_id')
    modalidad_id = request.form.get('modalidad_id', 1)
    duracion_horas = request.form.get('duracion_horas')
    descripcion = request.form.get('descripcion')
    activo = request.form.get('activo') == 'true'
    fecha_inicio = request.form.get('fecha_inicio')
    fecha_fin = request.form.get('fecha_fin')
    beneficios_ids = request.form.getlist('beneficios[]')
    facilitadores_ids = request.form.getlist('facilitadores[]')
    
    if not all([nombre, costo, categoria_id, tipo_servicio_id]):
         return jsonify({"error": "Faltan campos obligatorios"}), 400
         
    file = request.files.get('imagen')
    imagen_url = None
    
    if file and file.filename != '':
        filename = secure_filename(f"{int(datetime.datetime.now().timestamp())}_{file.filename}")
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        imagen_url = f"/api/uploads/{filename}"

    with get_db_connection() as conn:
        with conn.begin():
            # Construir la query dinámica para no machacar la imagen si no se envió
            update_query = """
                UPDATE programas 
                SET nombre = :n, categoria_id = :c_id, tipo_servicio_id = :t_id, modalidad_id = :m_id,
                    costo_oficial_bs = :costo, duracion_horas = :dur, 
                    descripcion = :desc, activo = :act
            """
            params = {
                "n": nombre.upper(), "c_id": categoria_id, "t_id": tipo_servicio_id, "m_id": modalidad_id,
                "costo": costo, "desc": descripcion, "act": activo, "pid": programa_id,
                "dur": duracion_horas if duracion_horas else None
            }
            
            if imagen_url:
                update_query += ", imagen_url = :img WHERE id = :pid"
                params["img"] = imagen_url
            else:
                update_query += " WHERE id = :pid"
 
            conn.execute(text(update_query), params)
            
            # Gestionar la cohorte asociada
            if fecha_inicio and fecha_fin:
                # Comprobar la última cohorte
                latest_cohort = conn.execute(text("""
                    SELECT id, activo, fecha_inicio, fecha_fin FROM cohortes WHERE programa_id = :pid ORDER BY id DESC LIMIT 1
                """), {"pid": programa_id}).fetchone()
                
                cohorte_nombre = "Edición Inicial"
                try:
                    meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
                    dt = datetime.datetime.strptime(fecha_inicio, "%Y-%m-%d")
                    cohorte_nombre = f"Edición {meses[dt.month - 1]} {dt.year}"
                except:
                    pass
                
                # Decidir si creamos una nueva cohorte limpia (comienza con 0 inscritos)
                # o si actualizamos la actual.
                # Si la última cohorte está cerrada (inactiva) o las nuevas fechas difieren de la anterior,
                # creamos una NUEVA versión/lanzamiento (cohorte).
                need_new_cohort = False
                if not latest_cohort:
                    need_new_cohort = True
                else:
                    cohort_id, is_active, old_start, old_end = latest_cohort
                    # Si no está activa o las fechas cambiaron considerablemente, lanzamos nueva cohorte
                    if not is_active or (str(old_start) != str(fecha_inicio) or str(old_end) != str(fecha_fin)):
                        need_new_cohort = True
                
                if need_new_cohort:
                    # Crear una nueva cohorte limpia (reseteando enrollees para la nueva fecha)
                    conn.execute(text("""
                        INSERT INTO cohortes (programa_id, nombre, fecha_inicio, fecha_fin, activo)
                        VALUES (:pid, :name, :start, :end, :act)
                    """), {
                        "pid": programa_id,
                        "name": cohorte_nombre,
                        "start": fecha_inicio,
                        "end": fecha_fin,
                        "act": activo
                    })
                else:
                    # Actualizar la cohorte activa en curso
                    conn.execute(text("""
                        UPDATE cohortes 
                        SET fecha_inicio = :start, fecha_fin = :end, nombre = :name, activo = :act
                        WHERE id = :cid
                    """), {
                        "start": fecha_inicio,
                        "end": fecha_fin,
                        "name": cohorte_nombre,
                        "act": activo,
                        "cid": latest_cohort.id
                    })
            
            # Actualizar beneficios (borrar y recrear)
            conn.execute(text("DELETE FROM programa_beneficios WHERE programa_id = :pid"), {"pid": programa_id})
            if beneficios_ids:
                for b_id in beneficios_ids:
                    conn.execute(text("""
                        INSERT INTO programa_beneficios (programa_id, beneficio_id)
                        VALUES (:pid, :bid)
                    """), {"pid": programa_id, "bid": b_id})
                    
            # Actualizar facilitadores (borrar y recrear)
            conn.execute(text("DELETE FROM programa_facilitadores WHERE programa_id = :pid"), {"pid": programa_id})
            if facilitadores_ids:
                for f_id in facilitadores_ids:
                    conn.execute(text("""
                        INSERT INTO programa_facilitadores (programa_id, facilitador_id)
                        VALUES (:pid, :fid)
                    """), {"pid": programa_id, "fid": f_id})
                
    return jsonify({"message": "Programa actualizado exitosamente!"}), 200
                
    return jsonify({"message": "Programa actualizado exitosamente!"}), 200

@app.route('/api/admin/programas/<int:programa_id>/toggle-status', methods=['PATCH'])
@admin_required
def toggle_programa_status(programa_id):
    """Alterna el estado activo/inactivo de un programa (Visibilidad en Web)"""
    with get_db_connection() as conn:
        with conn.begin():
            current_status = conn.execute(text("SELECT activo FROM programas WHERE id = :pid"), {"pid": programa_id}).scalar()
            if current_status is None:
                return jsonify({"error": "Programa no encontrado"}), 404
            
            new_status = not current_status
            conn.execute(text("UPDATE programas SET activo = :s WHERE id = :pid"), {"s": new_status, "pid": programa_id})
            
    return jsonify({"message": "Estado de visibilidad actualizado", "nuevo_estado": new_status}), 200

@app.route('/api/admin/programas/<int:programa_id>', methods=['DELETE'])
@admin_required
def delete_programa(programa_id):
    """Borrado Lógico: el programa desaparece de TODO el sistema (Panel + Web) pero persiste en DB para ML"""
    with get_db_connection() as conn:
        with conn.begin():
            # Verificar existencia
            exists = conn.execute(text("SELECT id FROM programas WHERE id = :pid"), {"pid": programa_id}).scalar()
            if not exists:
                return jsonify({"error": "Programa no encontrado"}), 404
            
            # Marcamos como eliminado Y desactivamos visibilidad web por seguridad
            conn.execute(text("UPDATE programas SET eliminado = true, activo = false WHERE id = :pid"), {"pid": programa_id})
            
    return jsonify({"message": "Programa eliminado del sistema"}), 200

@app.route('/api/admin/utils/catalogos', methods=['GET'])
@admin_required
def get_catalogos():
    """Devuelve las categorias, tipos, modalidades y beneficios para los SELECT del formulario"""
    with get_db_connection() as conn:
        categorias = [{"id": r.id, "nombre": r.nombre} for r in conn.execute(text("SELECT id, nombre FROM categorias")).fetchall()]
        tipos = [{"id": r.id, "nombre": r.nombre} for r in conn.execute(text("SELECT id, nombre FROM tipos_servicio")).fetchall()]
        modalidades = [{"id": r.id, "nombre": r.nombre} for r in conn.execute(text("SELECT id, nombre FROM modalidades")).fetchall()]
        beneficios = [{"id": r.id, "nombre": r.nombre} for r in conn.execute(text("SELECT id, nombre FROM beneficios")).fetchall()]
        grados_academicos = [{"id": r.id, "nombre": r.nombre} for r in conn.execute(text("SELECT id, nombre FROM grados_academicos")).fetchall()]
        departamentos = [{"id": r.id, "nombre": r.nombre} for r in conn.execute(text("SELECT id, nombre FROM departamentos")).fetchall()]
        estados_inscripcion = [{"id": r.id, "nombre": r.nombre} for r in conn.execute(text("SELECT id, nombre FROM estados_inscripcion")).fetchall()]
        origenes = [{"id": r.id, "nombre": r.nombre} for r in conn.execute(text("SELECT id, nombre FROM origenes_captacion")).fetchall()]

    return jsonify({
        "categorias": categorias, 
        "tipos_servicio": tipos,
        "modalidades": modalidades,
        "beneficios": beneficios,
        "grados_academicos": grados_academicos,
        "departamentos": departamentos,
        "estados_inscripcion": estados_inscripcion,
        "origenes": origenes
    })

@app.route('/api/admin/beneficios', methods=['POST'])
@admin_required
def create_beneficio():
    """Crea un nuevo beneficio en el catálogo"""
    data = request.json
    nombre = data.get('nombre')
    
    if not nombre:
        return jsonify({"error": "El nombre del beneficio es requerido."}), 400
        
    with get_db_connection() as conn:
        with conn.begin():
            try:
                conn.execute(text("INSERT INTO beneficios (nombre) VALUES (:n)"), {"n": nombre})
                return jsonify({"message": "Beneficio creado con éxito."}), 201
            except Exception as e:
                return jsonify({"error": "El beneficio ya existe o hubo un error en la base de datos."}), 400

@app.route('/api/admin/facilitadores', methods=['GET'])
@admin_required
def get_facilitadores():
    """Lista todos los usuarios con rol Facilitador"""
    with get_db_connection() as conn:
        result = conn.execute(text("""
            SELECT u.id, u.nombre_completo, u.correo, u.fecha_creacion
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            WHERE r.nombre = 'Facilitador'
            ORDER BY u.nombre_completo
        """)).fetchall()
        facilitadores = [{"id": r.id, "nombre": r.nombre_completo, "correo": r.correo, "creado": str(r.fecha_creacion)} for r in result]
    return jsonify(facilitadores)

@app.route('/api/admin/facilitadores', methods=['POST'])
@admin_required
def create_facilitador():
    """Registra un nuevo facilitador desde el panel de admin"""
    data = request.json
    nombre = data.get('nombre_completo')
    correo = data.get('correo')
    password = data.get('password', 'facilitador123') # Password por defecto si no se provee
    
    if not nombre or not correo:
        return jsonify({"error": "Nombre y correo son obligatorios."}), 400
        
    with get_db_connection() as conn:
        with conn.begin():
            rol_id = conn.execute(text("SELECT id FROM roles WHERE nombre = 'Facilitador'")).scalar()
            exists = conn.execute(text("SELECT id FROM usuarios WHERE correo = :correo"), {"correo": correo}).scalar()
            if exists:
                return jsonify({"error": "El correo ya está registrado."}), 400
                
            hash_pwd = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            conn.execute(text("""
                INSERT INTO usuarios (rol_id, nombre_completo, correo, hash_contrasena, email_verificado)
                VALUES (:rid, :nombre, :correo, :pwd, true)
            """), {"rid": rol_id, "nombre": nombre, "correo": correo, "pwd": hash_pwd})
            
    return jsonify({"message": "Facilitador registrado con éxito."}), 201

@app.route('/api/admin/estudiantes', methods=['GET'])
@admin_required
def get_estudiantes():
    """Lista todos los usuarios con rol Estudiante"""
    with get_db_connection() as conn:
        result = conn.execute(text("""
            SELECT u.id, u.nombre_completo, u.correo, d.nombre as departamento
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            LEFT JOIN departamentos d ON u.departamento_id = d.id
            WHERE r.nombre = 'Estudiante'
            ORDER BY u.nombre_completo
        """)).fetchall()
        estudiantes = [{"id": r.id, "nombre": r.nombre_completo, "correo": r.correo, "departamento": r.departamento} for r in result]
    return jsonify(estudiantes)

@app.route('/api/admin/inscripciones', methods=['POST'])
@admin_required
def create_inscripcion():
    """Crea una nueva inscripción manual, resolviendo cohorte_id desde programa_id si es necesario"""
    data = request.json
    usuario_id = data.get('usuario_id')
    programa_id = data.get('programa_id')
    cohorte_id = data.get('cohorte_id')
    estado_id = data.get('estado_id')
    origen_id = data.get('origen_id')
    costo = data.get('costo_pagado')
    fecha = data.get('fecha_inscripcion', datetime.date.today().isoformat())
    
    # Si cohorte_id no se provee pero sí programa_id, buscar la cohorte activa o la última creada
    if not cohorte_id and programa_id:
        with get_db_connection() as conn:
            cohorte_id = conn.execute(text("""
                SELECT id FROM cohortes 
                WHERE programa_id = :pid AND activo = true
                ORDER BY id DESC LIMIT 1
            """), {"pid": programa_id}).scalar()
            
            if not cohorte_id:
                cohorte_id = conn.execute(text("""
                    SELECT id FROM cohortes 
                    WHERE programa_id = :pid
                    ORDER BY id DESC LIMIT 1
                """), {"pid": programa_id}).scalar()
                
    if not all([usuario_id, cohorte_id, estado_id, origen_id, costo]):
        return jsonify({"error": "Faltan datos para la inscripción. El programa seleccionado podría no tener una cohorte asignada."}), 400
        
    with get_db_connection() as conn:
        with conn.begin():
            # Verificar si ya existe esa inscripción para evitar duplicados accidentales
            exists = conn.execute(text("SELECT id FROM inscripciones WHERE usuario_id = :uid AND cohorte_id = :cid"), 
                                 {"uid": usuario_id, "cid": cohorte_id}).scalar()
            if exists:
                return jsonify({"error": "El estudiante ya está inscrito en este programa."}), 400

            conn.execute(text("""
                INSERT INTO inscripciones (usuario_id, cohorte_id, estado_id, origen_id, fecha_inscripcion, costo_pagado)
                VALUES (:uid, :cid, :eid, :oid, :f, :c)
            """), {
                "uid": usuario_id, "cid": cohorte_id, "eid": estado_id, "oid": origen_id, "f": fecha, "c": costo
            })
            
    return jsonify({"message": "Inscripción realizada con éxito."}), 201

@app.route('/api/admin/beneficios/<int:beneficio_id>', methods=['DELETE'])
@admin_required
def delete_beneficio(beneficio_id):
    """Elimina físicamente un beneficio del catálogo (Cascada automática en programa_beneficios)"""
    with get_db_connection() as conn:
        with conn.begin():
            res = conn.execute(text("DELETE FROM beneficios WHERE id = :bid RETURNING id"), {"bid": beneficio_id}).fetchone()
            if not res:
                return jsonify({"error": "Beneficio no encontrado."}), 404
                
    return jsonify({"message": "Beneficio eliminado con éxito."}), 200


@app.route('/api/admin/predicciones', methods=['GET'])
@admin_required
def get_predicciones():
    """Retorna las predicciones de demanda aglutinadas con sus coeficientes SHAP (Explicabilidad)"""
    programa_id = request.args.get('programa_id')
    
    with get_db_connection() as conn:
        # Por simplicidad, obtenemos el histórico y las predicciones conjuntas de las últimas/futuras semanas
        where_clause = "WHERE pr.programa_id = :pid" if programa_id else ""
        
        query = text(f"""
            SELECT p.nombre as programa, pr.anio_objetivo, pr.semana_objetivo, 
                   pr.demanda_predicha, pr.resumen_shap, c.conteo_demanda as demanda_real
            FROM predicciones pr
            JOIN programas p ON pr.programa_id = p.id
            LEFT JOIN caracteristicas_demanda_semanal c 
              ON c.programa_id = pr.programa_id AND c.anio = pr.anio_objetivo AND c.semana_del_anio = pr.semana_objetivo
            {where_clause}
            ORDER BY pr.anio_objetivo DESC, pr.semana_objetivo DESC
            LIMIT 52
        """)
        
        params = {"pid": programa_id} if programa_id else {}
        result = conn.execute(query, params).fetchall()
        
        predicciones = []
        for r in result:
            predicciones.append({
                "programa": r.programa,
                "periodo": f"{r.anio_objetivo}-W{str(r.semana_objetivo).zfill(2)}",
                "demanda_real": r.demanda_real,
                "demanda_predicha": round(r.demanda_predicha, 1),
                "shap": r.resumen_shap
            })
            
    # Invertir para que vengan cronológicamente en los gráficos de Recharts
    return jsonify(predicciones[::-1])

@app.route('/api/seguridad/2fa/setup', methods=['GET'])
@auth_required
def setup_2fa():
    """Genera un nuevo TOTP secret y un código QR en Base64 para Google Authenticator"""
    user_id = request.user_info['sub']
    
    with get_db_connection() as conn:
        with conn.begin():
            user_data = conn.execute(text("SELECT correo, totp_enabled FROM usuarios WHERE id = :uid"), {"uid": user_id}).fetchone()
            
            if user_data and user_data.totp_enabled:
                return jsonify({"already_configured": True})
                
            correo = user_data.correo if user_data else "user@example.com"
            
            # Generar un nuevo secreto
            secret = pyotp.random_base32()
            
            # Guardarlo en el usuario (aún no activado)
            conn.execute(text("UPDATE usuarios SET totp_secret = :s WHERE id = :uid"), {"s": secret, "uid": user_id})
            
    # Generar URL de aprovisionamiento
    totp_auth_url = pyotp.totp.TOTP(secret).provisioning_uri(name=correo, issuer_name="Autopoiesis")
    
    # Generar QR
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(totp_auth_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    return jsonify({
        "secret": secret,
        "qr_code": f"data:image/png;base64,{qr_base64}"
    })

@app.route('/api/seguridad/2fa/verify', methods=['POST'])
@auth_required
def verify_2fa_setup():
    """Verifica el primer código para activar definitivamente el 2FA en la cuenta"""
    user_id = request.user_info['sub']
    code = request.json.get('code')
    
    with get_db_connection() as conn:
        with conn.begin():
            secret = conn.execute(text("SELECT totp_secret FROM usuarios WHERE id = :uid"), {"uid": user_id}).scalar()
            
            if not secret:
                return jsonify({"error": "No hay un código TOTP configurado para probar."}), 400
                
            totp = pyotp.TOTP(secret)
            if totp.verify(code, valid_window=2):
                conn.execute(text("UPDATE usuarios SET totp_enabled = true WHERE id = :uid"), {"uid": user_id})
                return jsonify({"message": "Autenticación de 2 Factores activada con éxito."})
            else:
                return jsonify({"error": "Código incorrecto."}), 400

@app.route('/api/usuario/inscripciones', methods=['GET'])
@auth_required
def usuario_inscripciones():
    """Lista las inscripciones del estudiante autenticado con barra de progreso temporal y estado de vigencia"""
    with get_db_connection() as conn:
        result = conn.execute(text("""
            SELECT i.id as inscripcion_id, p.nombre as programa, p.duracion_horas, p.imagen_url, p.tipo_servicio_id,
                   c.nombre as cohorte, c.fecha_inicio, c.fecha_fin,
                   ei.nombre as estado, i.costo_pagado, p.costo_oficial_bs
            FROM inscripciones i
            JOIN cohortes c ON i.cohorte_id = c.id
            JOIN programas p ON c.programa_id = p.id
            JOIN estados_inscripcion ei ON i.estado_id = ei.id
            WHERE i.usuario_id = :uid
            ORDER BY c.fecha_inicio DESC
        """), {"uid": g.user_id}).fetchall()
        
        inscripciones = []
        for r in result:
            inscripciones.append({
                "id": r.inscripcion_id,
                "programa": r.programa,
                "duracion_horas": r.duracion_horas,
                "imagen_url": r.imagen_url,
                "tipo_servicio": "Diplomado" if r.tipo_servicio_id == 2 else "Curso",
                "cohorte": r.cohorte,
                "fecha_inicio": str(r.fecha_inicio),
                "fecha_fin": str(r.fecha_fin),
                "estado": r.estado,
                "costo_pagado": float(r.costo_pagado),
                "costo_total": float(r.costo_oficial_bs)
            })
    return jsonify(inscripciones)

@app.route('/api/usuario/inscribir', methods=['POST'])
@auth_required
def usuario_inscribir():
    """Inscripción automática del estudiante logueado a un programa (usando su última cohorte activa)"""
    data = request.json
    programa_id = data.get('programa_id')
    costo = data.get('costo')
    
    if not all([programa_id, costo]):
        return jsonify({"error": "Faltan datos del programa para la inscripción."}), 400
        
    with get_db_connection() as conn:
        with conn.begin():
            # Buscar la última cohorte activa para el programa
            cohorte_row = conn.execute(text("""
                SELECT id, activo FROM cohortes 
                WHERE programa_id = :pid AND activo = true
                ORDER BY id DESC LIMIT 1
            """), {"pid": programa_id}).fetchone()
            
            if not cohorte_row:
                return jsonify({"error": "No hay cohortes activas disponibles para este programa en este momento."}), 400
                
            cohorte_id = cohorte_row.id
            
            # Buscar el ID del estado 'Activo'
            estado_id = conn.execute(text("SELECT id FROM estados_inscripcion WHERE nombre = 'Activo'")).scalar()
            # Buscar origen 'Web'
            origen_id = conn.execute(text("SELECT id FROM origenes_captacion WHERE nombre = 'Web'")).scalar()
            if not origen_id:
                origen_id = conn.execute(text("SELECT id FROM origenes_captacion LIMIT 1")).scalar()
            
            # Verificar si ya está inscrito
            exists = conn.execute(text("""
                SELECT id FROM inscripciones 
                WHERE usuario_id = :uid AND cohorte_id = :cid
            """), {"uid": request.user_info['sub'], "cid": cohorte_id}).scalar()
            
            if exists:
                return jsonify({"error": "Ya te encuentras inscrito en este programa."}), 400
                
            conn.execute(text("""
                INSERT INTO inscripciones (usuario_id, cohorte_id, estado_id, origen_id, fecha_inscripcion, costo_pagado)
                VALUES (:uid, :cid, :eid, :oid, CURRENT_DATE, :c)
            """), {"uid": request.user_info['sub'], "cid": cohorte_id, "eid": estado_id, "oid": origen_id, "c": costo})
            
    return jsonify({"message": "Inscripción exitosa a la cohorte."}), 201

@app.route('/api/usuario/preferencias', methods=['GET'])
@auth_required
def get_user_preferences():
    user_id = request.user_info['sub']
    with get_db_connection() as conn:
        suscrito = conn.execute(text("SELECT suscrito_boletin FROM usuarios WHERE id = :uid"), {"uid": user_id}).scalar()
    return jsonify({"suscrito_boletin": bool(suscrito)})

@app.route('/api/usuario/preferencias', methods=['PUT'])
@auth_required
def update_user_preferences():
    user_id = request.user_info['sub']
    data = request.json
    suscrito = data.get('suscrito_boletin', False)
    
    with get_db_connection() as conn:
        with conn.begin():
            # Obtener el correo del usuario
            correo = conn.execute(text("SELECT correo FROM usuarios WHERE id = :uid"), {"uid": user_id}).scalar()
            
            # 1. Actualizar tabla usuarios
            conn.execute(text("UPDATE usuarios SET suscrito_boletin = :sub WHERE id = :uid"), {"sub": suscrito, "uid": user_id})
            
            # 2. Actualizar tabla boletin_informativo (crear o actualizar)
            if suscrito:
                conn.execute(text("""
                    INSERT INTO boletin_informativo (correo, usuario_id, activo)
                    VALUES (:correo, :uid, true)
                    ON CONFLICT (correo) DO UPDATE SET activo = true, usuario_id = EXCLUDED.usuario_id
                """), {"correo": correo, "uid": user_id})
            else:
                conn.execute(text("""
                    UPDATE boletin_informativo SET activo = false WHERE correo = :correo
                """), {"correo": correo})
                
    return jsonify({"message": "Preferencias actualizadas con éxito.", "suscrito_boletin": suscrito})

@app.route('/api/admin/mailing/send', methods=['POST'])
@admin_required
def send_mailing():
    """Envío masivo de correos a suscriptores con imagen opcional"""
    # Usar request.form ya que puede venir como multipart/form-data
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        asunto = request.form.get('asunto')
        mensaje = request.form.get('mensaje')
        imagen = request.files.get('imagen')
    else:
        data = request.json or {}
        asunto = data.get('asunto')
        mensaje = data.get('mensaje')
        imagen = None
    
    if not asunto or not mensaje:
        return jsonify({"error": "Asunto y mensaje son requeridos."}), 400
        
    with get_db_connection() as conn:
        # Obtener los correos de los suscriptores activos
        suscriptores_records = conn.execute(text("SELECT correo FROM boletin_informativo WHERE activo = true")).fetchall()
        
    destinatarios = [s.correo for s in suscriptores_records]
    total_enviados = len(destinatarios)
    
    if total_enviados == 0:
        return jsonify({"error": "No hay suscriptores activos para enviar la campaña."}), 400

    file_content = None
    filename = None
    file_mimetype = None
    
    if imagen and imagen.filename:
        filename = secure_filename(imagen.filename)
        file_mimetype = imagen.content_type
        file_content = imagen.read() # Leemos el binario en memoria
        
    # Enviar de forma asíncrona usando la función que preparamos en utils/email.py
    import __main__ # Para evitar problemas de contexto, usamos current_app si estamos dentro del request
    from flask import current_app
    app_instance = current_app._get_current_object()
    
    send_mass_mailing(app_instance, asunto, mensaje, destinatarios, filename, file_content, file_mimetype)
    
    return jsonify({
        "message": "Campaña enviada exitosamente a la cola de envío.",
        "destinatarios": total_enviados
    })

if __name__ == '__main__':
    # Habilitamos Flask para escuchar peticiones de Docker u host externo
    app.run(host='0.0.0.0', port=5000, debug=True)