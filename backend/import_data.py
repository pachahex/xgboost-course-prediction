import os
import pandas as pd
import json
import bcrypt
from sqlalchemy import create_engine, text

"""
IMPORT SCRIPT (Flujo Completo: Seed -> Ingest)
Este script unifica la carga de datos del proyecto:
1. SEED: Crea el Administrador y pobla el catálogo de Programas reales.
2. INGEST: Cuando los datasets (.csv) estén listos, los leerá y poblará las inscripciones 
   y los perfiles de estudiantes históricos para el modelo de IA.
"""

# Configuración de base de datos
DB_URL = os.getenv("DATABASE_URL", "postgresql://admin:password123@localhost:5433/autopoiesis_db")

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def run_import():
    print(f"Conectando a {DB_URL} para Importación...")
    engine = create_engine(DB_URL)
    
    with engine.connect() as conn:
        with conn.begin():
            # ==============================================================================
            # FASE 1: SEED (Datos Estructurales Complejos)
            # ==============================================================================
            
            # 1. Recuperar Roles Base (Ya insertados por 01_schema.sql)
            role_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, nombre FROM roles"))}
            
            # 2. Inserción de Usuario Administrador Principal
            print("Insertando Usuario Administrador...")
            admin_pwd = hash_password("admin123")
            admin_email = 'juandiegomc.sis@gmail.com'
            conn.execute(text("""
                INSERT INTO usuarios (rol_id, nombre_completo, correo, hash_contrasena, email_verificado) 
                VALUES (:rid, 'Administrador Principal', :correo, :pwd, true)
                ON CONFLICT (correo) DO NOTHING
            """), {"rid": role_map['Administrador'], "correo": admin_email, "pwd": admin_pwd})

            
            # 3. Mapeos de Catálogos para Programas
            print("Recuperando Catálogos (Categorías y Tipos de Servicio)...")
            cat_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, nombre FROM categorias"))}
            ts_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, nombre FROM tipos_servicio"))}
            mod_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, nombre FROM modalidades"))}
            grado_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, nombre FROM grados_academicos"))}
            
            # 4. Poblar Catálogo de Programas
            print("Poblando Programas Reales...")
            
            PROGRAMAS_JSON_PATH = os.path.join(os.path.dirname(__file__), 'data', 'seed_programas.json')
            
            with open(PROGRAMAS_JSON_PATH, 'r', encoding='utf-8') as f:
                programas_raw = json.load(f)
            
            for prog in programas_raw:
                conn.execute(text("""
                    INSERT INTO programas (categoria_id, tipo_servicio_id, modalidad_id, nombre, costo_oficial_bs, descripcion, imagen_url, activo)
                    SELECT :cid, :tsid, :mid, :n, :c, :desc, :img, false
                    WHERE NOT EXISTS (SELECT 1 FROM programas WHERE nombre = :n)
                """), {
                    "cid": cat_map[prog["categoria"]],
                    "tsid": ts_map[prog["tipo"]],
                    "mid": mod_map.get(prog.get("modalidad", "Virtual")),
                    "n": prog["nombre"].upper(),
                    "c": prog["costo_oficial_bs"],
                    "desc": prog.get("descripcion") or None,
                    "img": prog.get("imagen_url") or None
                })

            # ==============================================================================
            # FASE 2: INGEST (Carga Masiva de Datos Históricos)
            # ==============================================================================
            print("\nVerificando existencia de dataset para ingesta masiva...")
            CSV_PATH = os.path.join(os.path.dirname(__file__), 'data', 'dataset.csv')
            
            if os.path.exists(CSV_PATH):
                print(f"Dataset encontrado en {CSV_PATH}. Preparando ingesta...")
                # df = pd.read_csv(CSV_PATH)
                
                # --- LÓGICA DE INGESTA (PENDIENTE) ---
                # 1. Crear a los Estudiantes ficticios en la tabla 'usuarios' (con sus datos demográficos).
                # 2. Registrar las 'inscripciones' asociadas a esos usuarios y programas.
                
                print(">> La lógica de ingesta está pendiente hasta la definición del nuevo dataset.csv")
            else:
                print(f"No se encontró dataset en {CSV_PATH}. Omitiendo fase de ingesta.")

    print("\nProceso de Importación finalizado con éxito!")

if __name__ == "__main__":
    run_import()
