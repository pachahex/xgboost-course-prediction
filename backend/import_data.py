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
            # FASE 2: INGEST (Generación Histórica Realista - ~3000 Inscripciones)
            # ==============================================================================
            print("\nGenerando datos históricos para Machine Learning (~3000 registros)...")
            num_estudiantes = 2000
            print("Limpiando estudiantes históricos anteriores...")
            conn.execute(text("DELETE FROM usuarios WHERE correo LIKE '%@historico.local'"))
            
            usuarios_batch = []
            
            print("1. Creando 2000 estudiantes históricos en memoria...")
            
            # Usaremos un hash dummy muy simple para no gastar CPU (ej. password123)
            # En producción esto tomaría demasiado tiempo, pero para seeds locales está bien si limitamos
            # Usamos un solo hash cacheado:
            dummy_hash = hash_password("1234567")
            
            seen_cis = set()
            
            for i in range(num_estudiantes):
                grado = random.choices(['Estudiante', 'Egresado', 'Profesional'], weights=[0.4, 0.3, 0.3])[0]
                
                if grado == 'Estudiante': edad = random.randint(18, 24)
                elif grado == 'Egresado': edad = random.randint(22, 28)
                else: edad = random.randint(25, 50)
                
                fecha_nacimiento = datetime.date.today() - datetime.timedelta(days=edad*365)
                
                # Generar CI boliviano realista y único
                while True:
                    ci = f"{random.randint(4000000, 14000000)}"
                    if ci not in seen_cis:
                        seen_cis.add(ci)
                        break
                        
                correo_ficticio = f"user{i}_{ci}@historico.local"
                nombre = fake.name()
                
                # Fuerte predominancia en La Paz (oficina principal)
                dep_nombre = random.choices(list(dep_map.keys()), weights=[0.75, 0.10, 0.05, 0.02, 0.02, 0.02, 0.01, 0.01, 0.01, 0.01])[0]
                
                usuarios_batch.append({
                    "rid": role_map['Estudiante'],
                    "did": dep_map[dep_nombre],
                    "gid": grado_map[grado],
                    "nom": nombre,
                    "ci": ci,
                    "correo": correo_ficticio,
                    "pwd": dummy_hash,
                    "req_pwd": True,
                    "fnac": fecha_nacimiento,
                })
            
            print("  -> Insertando usuarios a la DB...")
            conn.execute(text("""
                INSERT INTO usuarios (rol_id, departamento_id, grado_academico_id, nombre_completo, ci, correo, hash_contrasena, requiere_cambio_password, fecha_nacimiento, email_verificado)
                VALUES (:rid, :did, :gid, :nom, :ci, :correo, :pwd, :req_pwd, :fnac, true)
                ON CONFLICT (correo) DO NOTHING
            """), usuarios_batch)
            
            # Map memory users to their DB IDs
            estudiantes = [{"id": row[0], "grado": row[1], "did": row[2], "fnac": row[3], "ci": row[4]} 
                           for row in conn.execute(text("SELECT u.id, g.nombre, u.departamento_id, u.fecha_nacimiento, u.ci FROM usuarios u JOIN grados_academicos g ON u.grado_academico_id = g.id WHERE u.correo LIKE '%@historico.local'")).fetchall()]
            
            num_inscripciones = 3000
            inscripciones_batch = []
            
            print("2. Generando ~3000 inscripciones con reglas lógicas...")
            
            for _ in range(num_inscripciones):
                est = random.choice(estudiantes)
                
                if est["grado"] == 'Estudiante':
                    progs_posibles = [p for p in cohortes_info if p["tipo"] == ts_map['Curso']]
                elif est["grado"] == 'Egresado':
                    progs_posibles = [p for p in cohortes_info if p["tipo"] in (ts_map['Curso'], ts_map['Diplomado'])]
                else: 
                    progs_posibles = [p for p in cohortes_info if p["tipo"] == ts_map['Diplomado']] if random.random() < 0.7 else [p for p in cohortes_info if p["tipo"] == ts_map['Curso']]
                
                if not progs_posibles:
                    progs_posibles = cohortes_info
                
                cohorte_elegido = random.choice(progs_posibles)
                
                dias_antes = random.randint(1, 30)
                fecha_inscripcion = cohorte_elegido["fecha_inicio"] - datetime.timedelta(days=dias_antes)
                
                costo_pagado = cohorte_elegido["costo"]
                if random.random() < 0.3:
                    costo_pagado = round(costo_pagado * 0.85, 2)
                
                if cohorte_elegido["fecha_inicio"] < datetime.date.today():
                    estado = random.choices(['Finalizado', 'Retirado'], weights=[0.8, 0.2])[0]
                else:
                    estado = random.choices(['Activo', 'Pendiente de Pago'], weights=[0.7, 0.3])[0]
                    
                # Recomendación y Facebook como orígenes más probables
                origenes_keys = list(origen_map.keys())
                pesos_origenes = []
                for o_key in origenes_keys:
                    if o_key == 'Recomendación': pesos_origenes.append(0.40)
                    elif o_key == 'Facebook': pesos_origenes.append(0.40)
                    elif o_key == 'Sitio Web (Organico)': pesos_origenes.append(0.15)
                    else: pesos_origenes.append(0.05)
                
                origen = random.choices(origenes_keys, weights=pesos_origenes)[0]
                
                inscripciones_batch.append({
                    "uid": est["id"],
                    "cid": cohorte_elegido["id"],
                    "eid": estado_map[estado],
                    "oid": origen_map[origen],
                    "f": fecha_inscripcion,
                    "c": costo_pagado,
                    # Extras for CSV:
                    "est_ci": est["ci"],
                    "est_grado": est["grado"],
                    "est_dep": rev_dep_map[est["did"]],
                    "est_fnac": est["fnac"],
                    "prog_nom": cohorte_elegido["prog_nombre"],
                    "estado_str": estado,
                    "origen_str": origen
                })
            
            unique_insc = {}
            for ins in inscripciones_batch:
                key = (ins["uid"], ins["cid"])
                if key not in unique_insc:
                    unique_insc[key] = ins
            
            db_insc_batch = [{"uid": ins["uid"], "cid": ins["cid"], "eid": ins["eid"], "oid": ins["oid"], "f": ins["f"], "c": ins["c"]} for ins in unique_insc.values()]
            
            print(f"  -> Insertando {len(db_insc_batch)} inscripciones a la DB...")
            conn.execute(text("""
                INSERT INTO inscripciones (usuario_id, cohorte_id, estado_id, origen_id, fecha_inscripcion, costo_pagado)
                VALUES (:uid, :cid, :eid, :oid, :f, :c)
            """), db_insc_batch)
            
            # Export CSV
            print("3. Exportando dataset.csv para revisión...")
            dataset_rows = []
            for ins in unique_insc.values():
                edad = (ins["f"] - ins["est_fnac"]).days // 365
                dataset_rows.append({
                    "CI_Estudiante": ins["est_ci"],
                    "Edad_Inscripcion": edad,
                    "Grado": ins["est_grado"],
                    "Departamento": ins["est_dep"],
                    "Programa_Cohorte": ins["prog_nom"],
                    "Fecha_Inscripcion": ins["f"],
                    "Costo_Pagado_Bs": ins["c"],
                    "Estado": ins["estado_str"],
                    "Origen_Captacion": ins["origen_str"]
                })
            
            df = pd.DataFrame(dataset_rows)
            csv_path = os.path.join(os.path.dirname(__file__), 'data', 'dataset.csv')
            df.to_csv(csv_path, index=False)
            print(f"  -> Dataset guardado en: {csv_path}")

    print("\n✅ Proceso de Importación finalizado con éxito.")
    print("Administrador: juandiegomc.sis@gmail.com / admin123")

if __name__ == "__main__":
    run_import()
