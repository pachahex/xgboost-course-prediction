import pandas as pd
import json
import random
import datetime
import os

# Nombres y apellidos bolivianos típicos
NOMBRES_MASCULINOS = [
    "José", "Luis", "Juan", "Carlos", "Roberto", "Fernando", "Daniel", "Miguel", 
    "Víctor", "Jorge", "Diego", "Alejandro", "Marcelo", "Eduardo", "Mario", "Pedro", "Álvaro"
]
NOMBRES_FEMENINOS = [
    "María", "Ana", "Carmen", "Rosa", "Patricia", "Silvia", "Sonia", "Elizabeth", 
    "Verónica", "Marcela", "Daniela", "Claudia", "Roxana", "Paola", "Carla", "Laura", "Lucía"
]
APELLIDOS = [
    "Mamani", "Quispe", "Choque", "Condori", "Vargas", "Rojas", "Gutiérrez", "Flores", 
    "Fernández", "Rodríguez", "García", "Gómez", "López", "Gonzales", "Pérez", "Martínez", 
    "Cruz", "Sánchez", "Ramos", "Mendoza", "Nina", "Apaza", "Arias", "Huanca", "Callisaya", "Chávez"
]

def generate_bolivian_name(ci):
    # Set seed to the CI to make it deterministic
    try:
        random.seed(int(ci))
    except ValueError:
        random.seed(hash(ci))
        
    genero = random.choice(["M", "F"])
    if genero == "M":
        nombres = f"{random.choice(NOMBRES_MASCULINOS)} {random.choice(NOMBRES_MASCULINOS)}"
    else:
        nombres = f"{random.choice(NOMBRES_FEMENINOS)} {random.choice(NOMBRES_FEMENINOS)}"
        
    apellidos = f"{random.choice(APELLIDOS)} {random.choice(APELLIDOS)}"
    
    return f"{nombres} {apellidos}"

def main():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    csv_path = os.path.join(base_dir, 'data', 'dataset.csv')
    json_path = os.path.join(base_dir, 'data', 'seed_estudiantes.json')
    
    print(f"Leyendo dataset en: {csv_path}")
    df = pd.read_csv(csv_path)
    
    # Extraer estudiantes únicos. Tomamos la primera inscripción para obtener datos base.
    # Ordenamos por Fecha_Inscripcion para agarrar la más antigua y calcular edad.
    df['Fecha_Inscripcion'] = pd.to_datetime(df['Fecha_Inscripcion'])
    df_sorted = df.sort_values('Fecha_Inscripcion')
    
    estudiantes = {}
    
    for _, row in df_sorted.iterrows():
        ci = str(row['CI_Estudiante']).strip()
        if ci not in estudiantes:
            edad = int(row['Edad_Inscripcion'])
            fecha_ins = row['Fecha_Inscripcion']
            # Calcular fecha de nacimiento aproximada (y determinista en base a la inscripción)
            fecha_nacimiento = datetime.date(fecha_ins.year - edad, fecha_ins.month, fecha_ins.day)
            
            # Formatear fecha para evitar problemas con 29 de Febrero en años no bisiestos
            try:
                fnac_str = fecha_nacimiento.strftime('%Y-%m-%d')
            except ValueError:
                # Fallback por si acaso cae en 29 de feb y no era bisiesto
                fnac_str = f"{fecha_ins.year - edad}-01-01"
            
            estudiantes[ci] = {
                "ci": ci,
                "nombre_completo": generate_bolivian_name(ci),
                "correo": f"estudiante_{ci}@historico.local",
                "fecha_nacimiento": fnac_str,
                "departamento": str(row['Departamento']).strip(),
                "grado_academico": str(row['Grado']).strip()
            }
            
    lista_estudiantes = list(estudiantes.values())
    
    print(f"Generados {len(lista_estudiantes)} estudiantes únicos.")
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(lista_estudiantes, f, ensure_ascii=False, indent=2)
        
    print(f"Archivo semilla guardado exitosamente en: {json_path}")

if __name__ == '__main__':
    main()
