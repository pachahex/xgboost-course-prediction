import os
from sqlalchemy import create_engine, event

# Utilizamos la variable de entorno de Docker, o fallback para test local
DB_URL = os.getenv("DATABASE_URL", "postgresql://admin:password123@db:5432/autopoiesis_db")
DB_TIMEZONE = os.getenv("DB_TIMEZONE", "America/La_Paz")

# Creación del engine global de SQLAlchemy manejando un pool eficiente
engine = create_engine(DB_URL, pool_size=10, max_overflow=20)


@event.listens_for(engine, "connect")
def set_connection_timezone(dbapi_connection, _):
    """Forza la zona horaria por sesion para evitar desfases al usar CURRENT_TIMESTAMP."""
    with dbapi_connection.cursor() as cursor:
        cursor.execute("SET TIME ZONE %s", (DB_TIMEZONE,))

def get_db_connection():
    """Función de utilidad para obtener una conexión manejada mediante contexto"""
    return engine.connect()
