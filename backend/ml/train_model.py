import pandas as pd
import numpy as np
import xgboost as xgb
import shap
import json
import os
import math
from datetime import datetime
from sqlalchemy import text

import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from db import get_db_connection

def main():
    print("Iniciando Pipeline de Machine Learning (Fase 4)...")
    
    with get_db_connection() as conn:
        print("1. Extrayendo features desde PostgreSQL (Inscripciones históricas)...")
        df = pd.read_sql("""
            SELECT i.id, p.id as programa_id, p.nombre as programa_nombre, 
                   i.fecha_inscripcion, i.edad_estudiante
            FROM inscripciones i
            JOIN programas p ON i.programa_id = p.id
        """, conn)

    if df.empty:
        print("No hay datos para entrenar.")
        return

    # Convertir a datetime
    df['fecha_inscripcion'] = pd.to_datetime(df['fecha_inscripcion'])
    df['anio'] = df['fecha_inscripcion'].dt.isocalendar().year
    df['semana_del_anio'] = df['fecha_inscripcion'].dt.isocalendar().week

    # 1. Feature Engineering: Agrupación SEMANAL por programa
    print("2. Agrupando datos y creando Features Temporales...")
    grouped = df.groupby(['programa_id', 'programa_nombre', 'anio', 'semana_del_anio']).agg(
        conteo_demanda=('id', 'count'),
        edad_promedio=('edad_estudiante', 'mean')
    ).reset_index()

    # Features Cíclicas (Seno y Coseno de la semana) para el bosque
    grouped['seno_semana'] = np.sin(2 * np.pi * grouped['semana_del_anio'] / 52)
    grouped['coseno_semana'] = np.cos(2 * np.pi * grouped['semana_del_anio'] / 52)

    # 2. Persistencia en el Data Warehouse (caracteristicas_demanda_semanal)
    with get_db_connection() as conn:
        with conn.begin():
            print("Guardando características agrupadas en la DB...")
            # Limpiamos antes para este batch simplificado
            conn.execute(text("TRUNCATE caracteristicas_demanda_semanal CASCADE"))
            for _, row in grouped.iterrows():
                conn.execute(text("""
                    INSERT INTO caracteristicas_demanda_semanal 
                    (programa_id, anio, semana_del_anio, conteo_demanda, edad_promedio, seno_semana, coseno_semana)
                    VALUES (:pid, :a, :sa, :c, :ed, :sen, :cos)
                """), {
                    "pid": row['programa_id'], "a": row['anio'], "sa": row['semana_del_anio'],
                    "c": row['conteo_demanda'], "ed": row['edad_promedio'] if pd.notna(row['edad_promedio']) else 0,
                    "sen": row['seno_semana'], "cos": row['coseno_semana']
                })
    
    # 3. Entrenamiento (XGBoost Regressor)
    print("3. Ajustando XGBoostRegressor...")
    features = ['semana_del_anio', 'edad_promedio', 'seno_semana', 'coseno_semana']
    target = 'conteo_demanda'
    
    # Para simplificar el prototipo, entrenaremos un modelo global. En un caso real 
    # se podría entrenar un modelo por Programa o meter programa_id como variable categórica.
    # Aquí introducimos programa_id para que el modelo identifique diferencias de volumen.
    features_full = ['programa_id'] + features

    X = grouped[features_full]
    y = grouped[target]

    model = xgb.XGBRegressor(n_estimators=150, learning_rate=0.05, max_depth=6, random_state=42)
    model.fit(X, y)
    
    print("4. Modelo Ajustado con éxito. Generando SHAP values...")
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)
    
    # Para persistir la explicabilidad por cada renglón predecido
    grouped['demanda_predicha'] = model.predict(X)
    
    # 5. Guardar las predicciones y SHAP (Batch)
    print("5. Serializando metadatos SHAP y subiendo predicciones...")
    with get_db_connection() as conn:
        with conn.begin():
            conn.execute(text("TRUNCATE predicciones RESTART IDENTITY CASCADE"))
            
            # Vamos a proyectar el análisis (para el dashboard visual) sobre los datos históricos y las siguientes semanas.
            # Convertimos valores de numpy a float estandar para JSON
            for i, row in grouped.iterrows():
                # Estructurar JSONB de SHAP para esta predicción puntual
                shap_dict = {
                    "programa_id_impact": float(shap_values[i][0]),
                    "semana_del_anio_impact": float(shap_values[i][1]),
                    "edad_promedio_impact": float(shap_values[i][2]),
                    "seno_semana_impact": float(shap_values[i][3]),
                    "coseno_semana_impact": float(shap_values[i][4]),
                    "base_value": float(explainer.expected_value)
                }

                conn.execute(text("""
                    INSERT INTO predicciones (programa_id, anio_objetivo, semana_objetivo, demanda_predicha, nivel_confianza, resumen_shap)
                    VALUES (:pid, :a, :s, :dp, :nc, :shap)
                """), {
                    "pid": row['programa_id'],
                    "a": row['anio'],
                    "s": row['semana_del_anio'],
                    "dp": max(0, float(row['demanda_predicha'])), # Sin negativos
                    "nc": 0.85, # Dummy Confidence placeholder
                    "shap": json.dumps(shap_dict)
                })
                
    print("✅ Pipeline Explicable (XGBoost + SHAP) Concluido. Dashboard listo para leer.")

if __name__ == "__main__":
    main()
