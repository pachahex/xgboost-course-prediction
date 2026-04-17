import os
import pandas as pd
import bcrypt
from sqlalchemy import create_engine, text

# Si se corre fuera de Docker, usa el puerto mapeado de la BD local
DB_URL = os.getenv("DATABASE_URL", "postgresql://admin:password123@localhost:5433/autopoiesis_db")
CSV_PATH = os.path.join(os.path.dirname(__file__), 'data', 'dataset.csv')

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def run_import():
    print(f"Connecting to {DB_URL}...")
    engine = create_engine(DB_URL)
    
    print(f"Reading dataset from {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH)
    
    with engine.connect() as conn:
        with conn.begin():
            # 1. Poblar Roles
            print("Poblando Roles...")
            roles = ['Administrador', 'Suscriptor', 'Estudiante']
            for r in roles:
                conn.execute(text("INSERT INTO roles (nombre) VALUES (:r) ON CONFLICT (nombre) DO NOTHING"), {"r": r})
            
            # Obtener IDs de roles
            res = conn.execute(text("SELECT id, nombre FROM roles"))
            role_map = {row[1]: row[0] for row in res}
            
            # 2. Inserción de Usuario Seed Admin
            print("Insertando Usuario Administrador (Seed)...")
            admin_pwd = hash_password("admin123")
            admin_email = 'admin@autopoiesis.com'
            conn.execute(text("""
                INSERT INTO usuarios (rol_id, nombre_completo, correo, hash_contrasena) 
                VALUES (:rid, 'Administrador Principal', :correo, :pwd)
                ON CONFLICT (correo) DO NOTHING
            """), {"rid": role_map['Administrador'], "correo": admin_email, "pwd": admin_pwd})

            # Recuperar id del Administrador
            admin_id = conn.execute(text("SELECT id FROM usuarios WHERE correo = :correo"), {"correo": admin_email}).scalar()
            
            # 3. Poblar Catálogos
            print("Poblando Catálogos (Categorias, Tipos de Servicio, Departamentos, Estados)...")
            
            for cat in df['Categoria'].dropna().unique():
                conn.execute(text("INSERT INTO categorias (nombre) VALUES (:v) ON CONFLICT (nombre) DO NOTHING"), {"v": cat})
                
            for ts in df['Tipo_Servicio'].dropna().unique():
                conn.execute(text("INSERT INTO tipos_servicio (nombre) VALUES (:v) ON CONFLICT (nombre) DO NOTHING"), {"v": ts})
                
            for dep in df['Departamento'].dropna().unique():
                conn.execute(text("INSERT INTO departamentos (nombre) VALUES (:v) ON CONFLICT (nombre) DO NOTHING"), {"v": dep})
                
            for est in df['Estado_Inscripcion'].dropna().unique():
                conn.execute(text("INSERT INTO estados_inscripcion (nombre) VALUES (:v) ON CONFLICT (nombre) DO NOTHING"), {"v": est})
                
            # Mapeos inversos para obtener IDs rápido
            cat_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, nombre FROM categorias"))}
            ts_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, nombre FROM tipos_servicio"))}
            dep_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, nombre FROM departamentos"))}
            est_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, nombre FROM estados_inscripcion"))}
            
            # 4. Poblar Programas
            print("Poblando Programas...")
            # Extraer programas únicos con su último costo (si hubiera variación usamos el max o first)
            programas_df = df[['Programa', 'Categoria', 'Tipo_Servicio', 'Costo_Oficial_Bs']].drop_duplicates(subset=['Programa'])
            
            for _, row in programas_df.iterrows():
                conn.execute(text("""
                    INSERT INTO programas (categoria_id, tipo_servicio_id, nombre, costo_oficial_bs)
                    SELECT :cid, :tsid, :n, :c 
                    WHERE NOT EXISTS (SELECT 1 FROM programas WHERE nombre = :n)
                """), {
                    "cid": cat_map[row['Categoria']],
                    "tsid": ts_map[row['Tipo_Servicio']],
                    "n": row['Programa'],
                    "c": row['Costo_Oficial_Bs']
                })
                
            prog_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, nombre FROM programas"))}

            # 5. Poblar Inscripciones
            print("Poblando Inscripciones...")
            # Limpiamos inscripciones masivamente si existieran (opcional, dejamos para idempotencia)
            # Primero chequear si ya estan insertadas basado en count
            count_insc = conn.execute(text("SELECT COUNT(*) FROM inscripciones")).scalar()
            if count_insc > 0:
                print(f"Ya existen {count_insc} inscripciones. Se omitirá la carga masiva para evitar duplicados.")
            else:
                # Pandas to dict
                records = df.to_dict('records')
                
                count = 0
                for r in records:
                    # Insertar inscripcion usando el ID del Administrador como usuario central para los historicos
                    conn.execute(text("""
                        INSERT INTO inscripciones (usuario_id, programa_id, departamento_id, estado_id, fecha_inscripcion, edad_estudiante, costo_real_bs)
                        VALUES (:uid, :pid, :did, :eid, :f, :ee, :c)
                    """), {
                        "uid": admin_id,
                        "pid": prog_map[r['Programa']],
                        "did": dep_map[r['Departamento']],
                        "eid": est_map[r['Estado_Inscripcion']],
                        "f": r['Fecha_Registro'],
                        "ee": r['Edad_Alumno'],
                        "c": r['Costo_Oficial_Bs'] # Usaremos el costo oficial como real en datos hístóricos base
                    })
                    
                    count += 1
                    if count % 500 == 0:
                        print(f"Insertados {count} registros historiques...")
                
                print(f"Total importado: {count} registros.")

    print("Importación finalizada con éxito!")

if __name__ == "__main__":
    run_import()
