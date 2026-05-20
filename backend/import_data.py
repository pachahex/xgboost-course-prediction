import os
import random
import datetime
import bcrypt
import pandas as pd
from faker import Faker
from sqlalchemy import create_engine, text

"""
IMPORT SCRIPT (Flujo Completo: Seed -> Ingest)
Este script unifica la carga de datos del proyecto:
1. SEED: Crea el Administrador, Facilitador y pobla el catálogo de Programas reales.
2. INGEST: Genera automáticamente ~3000 inscripciones históricas lógicas y las
   ingresa a la base de datos y exporta un dataset.csv para revisión manual.
"""

# Inicializamos Faker para nombres latinos
fake = Faker('es_MX')

# Configuración de base de datos
DB_URL = os.getenv("DATABASE_URL", "postgresql://admin:password123@localhost:5433/autopoiesis_db")

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def get_random_date(start, end):
    delta = end - start
    int_delta = (delta.days * 24 * 60 * 60) + delta.seconds
    random_second = random.randrange(int_delta)
    return start + datetime.timedelta(seconds=random_second)

def run_import():
    print(f"Conectando a {DB_URL} para Importación...")
    engine = create_engine(DB_URL)
    
    with engine.connect() as conn:
        with conn.begin():
            # ==============================================================================
            # FASE 1: SEED (Datos Estructurales Complejos)
            # ==============================================================================
            
            # Asegurar que los roles existan
            conn.execute(text("""
                INSERT INTO roles (nombre) VALUES 
                ('Administrador'), ('Estudiante'), ('Facilitador'), ('Suscriptor') 
                ON CONFLICT (nombre) DO NOTHING
            """))

            role_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, nombre FROM roles"))}
            
            # Mapas de Catálogos
            print("Recuperando Catálogos...")
            cat_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, nombre FROM categorias"))}
            ts_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, nombre FROM tipos_servicio"))}
            mod_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, nombre FROM modalidades"))}
            grado_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, nombre FROM grados_academicos"))}
            dep_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, nombre FROM departamentos"))}
            estado_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, nombre FROM estados_inscripcion"))}
            origen_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, nombre FROM origenes_captacion"))}
            
            # Helper reverse maps for CSV
            rev_prog_map = {}
            rev_est_map = {v: k for k, v in estado_map.items()}
            rev_orig_map = {v: k for k, v in origen_map.items()}
            rev_dep_map = {v: k for k, v in dep_map.items()}
            
            print("Poblando Programas Reales (Generando Cohortes Temporales)...")
            import json
            PROGRAMAS_JSON_PATH = os.path.join(os.path.dirname(__file__), 'data', 'seed_programas.json')
            
            with open(PROGRAMAS_JSON_PATH, 'r', encoding='utf-8') as f:
                programas_raw = json.load(f)
            
            start_date_range = datetime.datetime(2023, 10, 1)
            end_date_range = datetime.datetime(2026, 4, 30)
            
            for prog in programas_raw:
                conn.execute(text("""
                    INSERT INTO programas (categoria_id, tipo_servicio_id, modalidad_id, nombre, costo_oficial_bs, duracion_horas, descripcion, imagen_url, activo)
                    SELECT :cid, :tsid, :mid, :n, :c, :dur, :desc, :img, false
                    WHERE NOT EXISTS (SELECT 1 FROM programas WHERE nombre = :n)
                """), {
                    "cid": cat_map[prog["categoria"]],
                    "tsid": ts_map[prog["tipo"]],
                    "mid": mod_map.get(prog.get("modalidad", "Virtual")),
                    "n": prog["nombre"],
                    "c": prog["costo_oficial_bs"],
                    "dur": prog.get("duracion_horas") or 120,
                    "desc": prog.get("descripcion") or None,
                    "img": prog.get("imagen_url") or None
                })
                
                # Fetch program ID
                prog_id = conn.execute(text("SELECT id FROM programas WHERE nombre = :n"), {"n": prog["nombre"]}).scalar()
                
                num_editions = random.randint(3, 6)
                for i in range(num_editions):
                    fecha_inicio = get_random_date(start_date_range, end_date_range).date()
                    fecha_fin = fecha_inicio + datetime.timedelta(days=random.randint(30, 90))
                    
                    mes_nombre = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][fecha_inicio.month - 1]
                    nombre_cohorte = f"Edición {mes_nombre} {fecha_inicio.year}"
                    
                    conn.execute(text("""
                        INSERT INTO cohortes (programa_id, nombre, fecha_inicio, fecha_fin, activo)
                        VALUES (:pid, :n, :fi, :ff, false)
                    """), {
                        "pid": prog_id,
                        "n": nombre_cohorte,
                        "fi": fecha_inicio,
                        "ff": fecha_fin
                    })
            
            cohortes_info = [{"id": row[0], "pid": row[1], "prog_nombre": row[2], "tipo": row[3], "costo": float(row[4]), "fecha_inicio": row[5]} 
                              for row in conn.execute(text("""
                                SELECT c.id, p.id, p.nombre, p.tipo_servicio_id, p.costo_oficial_bs, c.fecha_inicio 
                                FROM cohortes c JOIN programas p ON c.programa_id = p.id
                              """)).fetchall()]
            
            # ==============================================================================
            # FASE 2: INGEST (Consumo de Semilla de Estudiantes JSON)
            # ==============================================================================
            print("\nGenerando datos históricos para Machine Learning a partir del dataset...")
            print("1. Limpiando estudiantes históricos anteriores...")
            conn.execute(text("DELETE FROM usuarios WHERE correo LIKE '%@historico.local'"))
            
            SEED_ESTUDIANTES_PATH = os.path.join(os.path.dirname(__file__), 'data', 'seed_estudiantes.json')
            print("2. Cargando estudiantes históricos desde semilla JSON...")
            with open(SEED_ESTUDIANTES_PATH, 'r', encoding='utf-8') as f:
                estudiantes_json = json.load(f)
            
            usuarios_batch = []
            dummy_hash = 'HISTORICO_SIN_ACCESO'
            
            for est in estudiantes_json:
                usuarios_batch.append({
                    "rid": role_map['Estudiante'],
                    "did": dep_map.get(est['departamento']) or list(dep_map.values())[0],
                    "gid": grado_map.get(est['grado_academico']) or list(grado_map.values())[0],
                    "nom": est['nombre_completo'],
                    "ci": est['ci'],
                    "correo": est['correo'],
                    "pwd": dummy_hash,
                    "req_pwd": False,
                    "fnac": est['fecha_nacimiento'],
                })
            
            print(f"  -> Insertando {len(usuarios_batch)} usuarios a la DB...")
            conn.execute(text("""
                INSERT INTO usuarios (rol_id, departamento_id, grado_academico_id, nombre_completo, ci, correo, hash_contrasena, requiere_cambio_password, fecha_nacimiento, email_verificado)
                VALUES (:rid, :did, :gid, :nom, :ci, :correo, :pwd, :req_pwd, :fnac, true)
                ON CONFLICT (correo) DO NOTHING
            """), usuarios_batch)
            
            # Map memory users to their DB IDs by CI
            db_estudiantes = {str(row[1]): row[0] for row in conn.execute(text("SELECT id, ci FROM usuarios WHERE correo LIKE '%@historico.local'")).fetchall()}
            
            # ==============================================================================
            # FASE 3: INGEST (Consumo de Inscripciones CSV)
            # ==============================================================================
            CSV_PATH = os.path.join(os.path.dirname(__file__), 'data', 'dataset.csv')
            print(f"3. Cargando inscripciones desde {CSV_PATH}...")
            df = pd.read_csv(CSV_PATH)
            
            # Organizar cohortes por programa para búsqueda rápida
            cohortes_por_programa = {}
            for c in cohortes_info:
                if c["prog_nombre"] not in cohortes_por_programa:
                    cohortes_por_programa[c["prog_nombre"]] = []
                cohortes_por_programa[c["prog_nombre"]].append(c)
                
            inscripciones_batch = []
            
            for _, row in df.iterrows():
                ci = str(row['CI_Estudiante']).strip()
                if ci not in db_estudiantes:
                    continue
                
                uid = db_estudiantes[ci]
                prog_nom = row['Programa_Cohorte']
                
                # Si el programa no existe en las cohortes actuales (por alguna razón), saltar
                if prog_nom not in cohortes_por_programa or not cohortes_por_programa[prog_nom]:
                    continue
                    
                # Elegimos una cohorte al azar del programa para la inscripción histórica
                cohorte = random.choice(cohortes_por_programa[prog_nom])
                cid = cohorte["id"]
                
                fecha_inscripcion = row['Fecha_Inscripcion']
                costo = row['Costo_Pagado_Bs']
                estado_str = row['Estado']
                origen_str = row['Origen_Captacion']
                
                eid = estado_map.get(estado_str, estado_map.get('Finalizado', list(estado_map.values())[0]))
                oid = origen_map.get(origen_str, origen_map.get('Facebook', list(origen_map.values())[0]))
                
                inscripciones_batch.append({
                    "uid": uid,
                    "cid": cid,
                    "eid": eid,
                    "oid": oid,
                    "f": fecha_inscripcion,
                    "c": costo
                })
            
            unique_insc = {}
            for ins in inscripciones_batch:
                key = (ins["uid"], ins["cid"])
                if key not in unique_insc:
                    unique_insc[key] = ins
            
            db_insc_batch = list(unique_insc.values())
            
            print(f"  -> Insertando {len(db_insc_batch)} inscripciones a la DB...")
            if db_insc_batch:
                conn.execute(text("""
                    INSERT INTO inscripciones (usuario_id, cohorte_id, estado_id, origen_id, fecha_inscripcion, costo_pagado)
                    VALUES (:uid, :cid, :eid, :oid, :f, :c)
                """), db_insc_batch)

    print("\n✅ Proceso de Importación finalizado con éxito (Modo Cargador).")
    print("Administrador: juandiegomc.sis@gmail.com / admin123")

if __name__ == "__main__":
    run_import()
