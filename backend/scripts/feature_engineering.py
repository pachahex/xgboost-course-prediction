import pandas as pd
import numpy as np
import json
import os

def feature_engineering():
    # Rutas dinámicas
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dataset_path = os.path.join(base_dir, 'data', 'dataset.csv')
    seed_path = os.path.join(base_dir, 'data', 'seed_programas.json')
    output_path = os.path.join(base_dir, 'data', 'cohortes_dataset.csv')

    print("Cargando datos...")
    df = pd.read_csv(dataset_path)
    df['Fecha_Inscripcion'] = pd.to_datetime(df['Fecha_Inscripcion'])

    with open(seed_path, 'r', encoding='utf-8') as f:
        programas = json.load(f)
    
    prog_info = {p['nombre']: p for p in programas}

    print("Calculando variables del cohorte...")
    # 1. Tamaño del Cohorte (Target) y Mes de Lanzamiento
    cohortes_stats = df.groupby(['Programa', 'Cohorte']).agg(
        Tamano_Cohorte=('CI_Estudiante', 'count'),
        Fecha_Primer_Inscrito=('Fecha_Inscripcion', 'min')
    ).reset_index()

    cohortes_stats['Mes_Lanzamiento'] = cohortes_stats['Fecha_Primer_Inscrito'].dt.month

    # 2. Variables estáticas del programa
    cohortes_stats['Tipo_Programa'] = cohortes_stats['Programa'].apply(lambda x: prog_info.get(x, {}).get('tipo', 'Desconocido'))
    cohortes_stats['Categoria'] = cohortes_stats['Programa'].apply(lambda x: prog_info.get(x, {}).get('categoria', 'Desconocido'))
    cohortes_stats['Costo_Oficial_Bs'] = cohortes_stats['Programa'].apply(lambda x: prog_info.get(x, {}).get('costo_oficial_bs', 0))

    # 3. Feature Engineering: Codificación Cíclica Temporal
    # Usamos senos y cosenos para que Diciembre (12) y Enero (1) estén "cerca" matemáticamente.
    print("Aplicando codificación cíclica...")
    cohortes_stats['Seno_Mes'] = np.sin(2 * np.pi * cohortes_stats['Mes_Lanzamiento'] / 12)
    cohortes_stats['Coseno_Mes'] = np.cos(2 * np.pi * cohortes_stats['Mes_Lanzamiento'] / 12)

    # 4. Feature Engineering: One-Hot Encoding
    print("Aplicando One-Hot Encoding...")
    # get_dummies genera columnas como Tipo_Programa_Diplomado, Categoria_Derecho, etc.
    df_encoded = pd.get_dummies(cohortes_stats, columns=['Tipo_Programa', 'Categoria'])

    # Convertir booleanos a enteros (1 y 0) para XGBoost
    for col in df_encoded.columns:
        if df_encoded[col].dtype == 'bool':
            df_encoded[col] = df_encoded[col].astype(int)

    # Ordenar columnas (Identificadores al principio, Target al final, Features en el medio)
    cols = list(df_encoded.columns)
    cols.remove('Programa')
    cols.remove('Cohorte')
    cols.remove('Fecha_Primer_Inscrito')
    cols.remove('Tamano_Cohorte')
    
    final_cols = ['Programa', 'Cohorte', 'Fecha_Primer_Inscrito'] + cols + ['Tamano_Cohorte']
    df_final = df_encoded[final_cols]

    # 5. Guardar el dataset resultante
    df_final.to_csv(output_path, index=False)
    print(f"¡Éxito! Dataset de cohortes guardado en: {output_path}")
    print(f"Total de cohortes procesados: {len(df_final)}")
    print(f"Dimensiones del dataset final: {df_final.shape}")

if __name__ == "__main__":
    feature_engineering()
