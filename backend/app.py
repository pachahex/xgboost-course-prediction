from flask import Flask, request, jsonify, make_response, send_from_directory
from flask_cors import CORS
import jwt
import datetime
import bcrypt
from sqlalchemy import text
from db import get_db_connection
import os
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.utils import secure_filename

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

# ==========================================
# RUTAS DE AUTENTICACIÓN
# ==========================================

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    correo = data.get('correo')
    password = data.get('password')
    
    if not correo or not password:
        return jsonify({"error": "Correo y contraseña obligatorios."}), 400
        
    with get_db_connection() as conn:
        res = conn.execute(text("""
            SELECT u.id, u.hash_contrasena, r.nombre as rol_nombre, u.nombre_completo 
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            WHERE u.correo = :correo
        """), {"correo": correo}).fetchone()
        
    if not res:
        return jsonify({"error": "Credenciales inválidas."}), 401
        
    user_id, hash_bd, rol_nombre, nombre = res
    
    # Validar contraseña bcrypt
    if bcrypt.checkpw(password.encode('utf-8'), hash_bd.encode('utf-8')):
        # Generar Token JWT con vigencia de 8 horas
        payload = {
            "sub": user_id,
            "nombre": nombre,
            "rol": rol_nombre,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8)
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
        
        # Respuesta empaquetada con cookie HTTP-Only para mitigar exposición a XSS en Frontend
        resp = make_response(jsonify({
            "message": "Login exitoso",
            "user": {"nombre": nombre, "rol": rol_nombre}
        }))
        
        resp.set_cookie(
            'access_token', 
            token, 
            httponly=True,   # El JavaScript del Frontend no puede leerla (protección XSS)
            secure=False,    # Pasar a True en Producción (HTTPS)
            samesite='Lax'   # Protección básica CSRF
        )
        return resp, 200
    else:
        return jsonify({"error": "Credenciales inválidas."}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    resp = make_response(jsonify({"message": "Sesión cerrada exitosamente."}))
    resp.set_cookie('access_token', '', expires=0)
    return resp, 200

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

@app.route('/api/programas', methods=['GET'])
def get_public_programas():
    """Retorna el catálogo unificado de Cursos y Diplomados ACTIVOS para la Portada"""
    with get_db_connection() as conn:
        result = conn.execute(text("""
            SELECT p.id, p.nombre, p.costo_oficial_bs, c.nombre as categoria, 
                   ts.nombre as tipo, p.imagen_url, p.descripcion, p.activo
            FROM programas p
            JOIN categorias c ON p.categoria_id = c.id
            JOIN tipos_servicio ts ON p.tipo_servicio_id = ts.id
            WHERE p.activo = true
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
                "imagen_url": r.imagen_url,
                "descripcion": r.descripcion,
                "activo": r.activo
            })
    return jsonify(programas)

@app.route('/api/admin/programas/all', methods=['GET'])
@admin_required
def get_all_programas():
    """Retorna todos los programas, tanto activos como inactivos, para el Dashboard"""
    with get_db_connection() as conn:
        result = conn.execute(text("""
            SELECT p.id, p.nombre, p.costo_oficial_bs, c.nombre as categoria, 
                   ts.nombre as tipo, p.imagen_url, p.descripcion, p.activo
            FROM programas p
            JOIN categorias c ON p.categoria_id = c.id
            JOIN tipos_servicio ts ON p.tipo_servicio_id = ts.id
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
                "imagen_url": r.imagen_url,
                "descripcion": r.descripcion,
                "activo": r.activo
            })
    return jsonify(programas)

@app.route('/api/uploads/<path:filename>')
def serve_upload(filename):
    """Serve los archivos estáticos guardados por los administradores"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/suscribir', methods=['POST'])
def suscribir():
    """Captura de leads/correos del footer asegurando tener un rol genérico (Ej. Suscriptor)"""
    data = request.json
    correo = data.get('correo')
    
    if not correo:
        return jsonify({"error": "El correo es requerido."}), 400
        
    with get_db_connection() as conn:
        with conn.begin():
            # Buscar rol "Suscriptor"
            rol_id = conn.execute(text("SELECT id FROM roles WHERE nombre = 'Suscriptor'")).scalar()
            if not rol_id:
                # Si no existe, usamos cualquier otro o fallamos controladamente (en tu caso debería estar creado por el import_data)
                return jsonify({"error": "Rol suscriptor no configurado en BD."}), 500
                
            # Intento de inserción
            try:
                # Utilizamos una contraseña aleatoria descartable o "N/A" si no tienen cuenta para login
                # O podríamos permitir hash_contrasena nulo para suscriptores. Para el MVP usaremos un dummy.
                pwd_placeholder = bcrypt.hashpw(os.urandom(12).hex().encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                
                conn.execute(text("""
                    INSERT INTO usuarios (rol_id, nombre_completo, correo, hash_contrasena)
                    VALUES (:rid, 'Suscriptor Pendiente', :correo, :pwd)
                    ON CONFLICT (correo) DO NOTHING
                """), {"rid": rol_id, "correo": correo, "pwd": pwd_placeholder})
                
                return jsonify({"message": "Te has suscrito con éxito al boletín."}), 201
            except Exception as e:
                return jsonify({"error": f"Error interno: {str(e)}"}), 500

# ==========================================
# RUTAS PRIVADAS (ADMIN)
# ==========================================

@app.route('/api/admin/inscripciones', methods=['GET'])
@admin_required
def get_inscripciones():
    """Obtiene una lista paginada y estructurada de las inscripciones para el CRUD/Dashboard"""
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 50))
    offset = (page - 1) * limit
    
    with get_db_connection() as conn:
        total = conn.execute(text("SELECT COUNT(*) FROM inscripciones")).scalar()
        
        query = text("""
            SELECT i.id, p.nombre as programa, d.nombre as departamento, e.nombre as estado, 
                   i.fecha_inscripcion, i.edad_estudiante, i.costo_real_bs 
            FROM inscripciones i
            JOIN programas p ON i.programa_id = p.id
            JOIN departamentos d ON i.departamento_id = d.id
            JOIN estados_inscripcion e ON i.estado_id = e.id
            ORDER BY i.fecha_inscripcion DESC
            LIMIT :l OFFSET :o
        """)
        
        result = conn.execute(query, {"l": limit, "o": offset}).fetchall()
        
        inscripciones = []
        for r in result:
            inscripciones.append({
                "id": r.id,
                "programa": r.programa,
                "departamento": r.departamento,
                "estado": r.estado,
                "fecha": str(r.fecha_inscripcion),
                "edad": r.edad_estudiante,
                "costo": float(r.costo_real_bs)
            })
            
    return jsonify({
        "total": total,
        "page": page,
        "data": inscripciones
    })

@app.route('/api/admin/programas', methods=['POST'])
@admin_required
def create_programa():
    """Recibe detalles de un nuevo programa (Curso/Diplomado) y su miniatura visual opcional"""
    # En Multipart Form los datos vienen en request.form y request.files
    nombre = request.form.get('nombre')
    costo = request.form.get('costo')
    categoria_id = request.form.get('categoria_id')
    tipo_servicio_id = request.form.get('tipo_servicio_id')
    descripcion = request.form.get('descripcion')
    activo = request.form.get('activo') == 'true'
    
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
            conn.execute(text("""
                INSERT INTO programas (nombre, categoria_id, tipo_servicio_id, costo_oficial_bs, imagen_url, descripcion, activo)
                VALUES (:n, :c_id, :t_id, :costo, :img, :desc, :act)
            """), {
                "n": nombre.upper(), 
                "c_id": categoria_id, 
                "t_id": tipo_servicio_id, 
                "costo": costo,
                "img": imagen_url,
                "desc": descripcion,
                "act": activo
            })
            
    return jsonify({"message": "Programa publicado con éxito"}), 201

@app.route('/api/admin/programas/<int:programa_id>', methods=['PUT'])
@admin_required
def update_programa(programa_id):
    """Actualiza la información (y opcionalmente la imagen) de un programa existente para conservar historial ML"""
    nombre = request.form.get('nombre')
    costo = request.form.get('costo')
    categoria_id = request.form.get('categoria_id')
    tipo_servicio_id = request.form.get('tipo_servicio_id')
    descripcion = request.form.get('descripcion')
    activo = request.form.get('activo') == 'true'
    
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
            if imagen_url:
                conn.execute(text("""
                    UPDATE programas 
                    SET nombre = :n, categoria_id = :c_id, tipo_servicio_id = :t_id, 
                        costo_oficial_bs = :costo, descripcion = :desc, imagen_url = :img, activo = :act
                    WHERE id = :pid
                """), {
                    "n": nombre.upper(), "c_id": categoria_id, "t_id": tipo_servicio_id, 
                    "costo": costo, "desc": descripcion, "img": imagen_url, "act": activo, "pid": programa_id
                })
            else:
                conn.execute(text("""
                    UPDATE programas 
                    SET nombre = :n, categoria_id = :c_id, tipo_servicio_id = :t_id, 
                        costo_oficial_bs = :costo, descripcion = :desc, activo = :act
                    WHERE id = :pid
                """), {
                    "n": nombre.upper(), "c_id": categoria_id, "t_id": tipo_servicio_id, 
                    "costo": costo, "desc": descripcion, "act": activo, "pid": programa_id
                })
                
    return jsonify({"message": "Programa actualizado exitosamente!"}), 200

@app.route('/api/admin/utils/catalogos', methods=['GET'])
@admin_required
def get_catalogos():
    """Devuelve las categorias y tipos para los SELECT del formulario"""
    with get_db_connection() as conn:
        categorias = [{"id": r.id, "nombre": r.nombre} for r in conn.execute(text("SELECT id, nombre FROM categorias")).fetchall()]
        tipos = [{"id": r.id, "nombre": r.nombre} for r in conn.execute(text("SELECT id, nombre FROM tipos_servicio")).fetchall()]
    return jsonify({"categorias": categorias, "tipos_servicio": tipos})


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

if __name__ == '__main__':
    # Habilitamos Flask para escuchar peticiones de Docker u host externo
    app.run(host='0.0.0.0', port=5000, debug=True)