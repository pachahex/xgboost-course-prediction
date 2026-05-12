import json
import jwt
import os
from flask import request
from sqlalchemy import text
from db import get_db_connection

SECRET_KEY = os.getenv("SECRET_KEY", "autopoiesis_super_secret_dev_key")

def log_event(nivel, evento, detalles=None, status_code=None):
    """Utilidad interna para persistir eventos de telemetría en la base de datos"""
    try:
        user_id = None
        # Intentamos obtener el usuario del token si existe en la petición
        token = request.cookies.get('access_token')
        if token:
            try:
                decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                user_id = decoded.get('sub')
            except:
                pass

        with get_db_connection() as conn:
            with conn.begin():
                conn.execute(text("""
                    INSERT INTO telemetria_eventos 
                    (usuario_id, nivel_severidad, evento, detalles, endpoint, metodo, status_code, ip_origen, user_agent)
                    VALUES (:uid, :lvl, :evt, :det, :end, :met, :stat, :ip, :ua)
                """), {
                    "uid": user_id,
                    "lvl": nivel,
                    "evt": evento,
                    "det": json.dumps(detalles) if detalles else None,
                    "end": request.path if request else 'N/A',
                    "met": request.method if request else 'N/A',
                    "stat": status_code,
                    "ip": request.remote_addr if request else '127.0.0.1',
                    "ua": request.user_agent.string if (request and request.user_agent) else 'Unknown'
                })
    except Exception as e:
        print(f"CRITICAL [Telemetry]: Fallo al registrar evento: {e}")

def init_telemetry(app):
    """Configura los hooks globales de la aplicación para telemetría"""
    
    @app.after_request
    def after_request_log(response):
        """Captura automáticamente errores HTTP (4xx, 5xx)"""
        if response.status_code >= 400:
            nivel = 'ERROR' if response.status_code >= 500 else 'WARNING'
            log_event(nivel, f"HTTP_{response.status_code}", status_code=response.status_code)
        return response
