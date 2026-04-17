import os
from sqlalchemy import create_engine

# Utilizamos la variable de entorno de Docker, o fallback para test local
DB_URL = os.getenv("DATABASE_URL", "postgresql://admin:password123@db:5432/autopoiesis_db")

# Creación del engine global de SQLAlchemy manejando un pool eficiente
engine = create_engine(DB_URL, pool_size=10, max_overflow=20)

def get_db_connection():
    """Función de utilidad para obtener una conexión manejada mediante contexto"""
    return engine.connect()
