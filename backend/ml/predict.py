import os
import sys
import time
import math
import pandas as pd
import numpy as np
import joblib

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.dirname(_THIS_DIR)
sys.path.append(_BACKEND_DIR)

from db import get_db_connection
from sqlalchemy import text

MODEL_PATH = os.path.join(_THIS_DIR, "model.joblib")
EXPLAINER_PATH = os.path.join(_THIS_DIR, "shap_explainer.joblib")

_model = None
_explainer = None
_last_load_time = 0

FEATURE_COLS = [
    "edad_promedio", "edad_mediana", "edad_min", "edad_max",
    "porc_estudiantes", "porc_profesionales",
    "porc_la_paz", "porc_otros_depts",
    "ingreso_semana", "precio_promedio_pagado", "tasa_descuento", "precio_relativo",
    "tasa_activos", "tasa_retirados", "tasa_finalizados", "tasa_pendientes",
    "porc_facebook", "porc_boletin", "porc_organico", "porc_recomendacion",
    "duracion_horas", "num_facilitadores", "costo_oficial_bs",
    "categoria_id", "tipo_servicio_id", "modalidad_id", "num_beneficios",
    "seno_semana", "coseno_semana", "seno_mes", "coseno_mes",
    "es_inicio_trimestre", "es_fin_anio",
    "ga4_sesiones_semana", "ga4_eventos_conversion",
    "ga4_usuarios_activos", "ga4_tasa_rebote",
    "trends_interes_categoria", "trends_interes_programa",
    "conteo_lag_1", "conteo_lag_2", "conteo_lag_4",
    "conteo_rolling_4w", "conteo_rolling_8w",
    "conteo_mismo_periodo_anio_ant",
]

def _check_and_load_model():
    """Patrón Singleton para cargar modelo y explainer con hot-reload si hay una nueva versión."""
    global _model, _explainer, _last_load_time
    
    if not os.path.exists(MODEL_PATH) or not os.path.exists(EXPLAINER_PATH):
        return False
        
    mtime = max(os.path.getmtime(MODEL_PATH), os.path.getmtime(EXPLAINER_PATH))
    if mtime > _last_load_time or _model is None:
        try:
            _model = joblib.load(MODEL_PATH)
            _explainer = joblib.load(EXPLAINER_PATH)
            _last_load_time = mtime
            print(f"✅ Modelo y explainer recargados correctamente ({time.ctime(mtime)})")
        except Exception as e:
            print(f"❌ Error al cargar modelo/explainer: {e}")
            return False
            
    return True

def _get_latest_features(programa_id, anio, semana):
    """Obtiene el vector de features más reciente para un programa_id."""
    with get_db_connection() as conn:
        cols_str = ", ".join(FEATURE_COLS)
        query = text(f"""
            SELECT {cols_str}
            FROM caracteristicas_demanda_semanal
            WHERE programa_id = :programa_id
            ORDER BY anio DESC, semana_del_anio DESC
            LIMIT 1
        """)
        row = conn.execute(query, {"programa_id": programa_id}).fetchone()
        
        if not row:
            return None
            
        features = {}
        for i, col in enumerate(FEATURE_COLS):
            features[col] = float(row[i]) if row[i] is not None else 0.0
            
        # Actualizamos variables temporales cíclicas para la semana futura solicitada
        features["seno_semana"] = math.sin(2 * math.pi * semana / 52)
        features["coseno_semana"] = math.cos(2 * math.pi * semana / 52)
        
        # Aproximación del mes (cada 4.33 semanas)
        mes = max(1, min(12, int(semana / 4.33) + 1))
        features["seno_mes"] = math.sin(2 * math.pi * mes / 12)
        features["coseno_mes"] = math.cos(2 * math.pi * mes / 12)
        features["es_inicio_trimestre"] = 1.0 if mes in [1, 4, 7, 10] else 0.0
        features["es_fin_anio"] = 1.0 if semana >= 48 else 0.0
        
        return features

def predict_programa(programa_id, semana, anio, features_dict=None):
    """
    Realiza una inferencia en tiempo real para un programa y fecha específica.
    """
    if not _check_and_load_model():
        return {
            "error": "Modelo no entrenado o archivos faltantes. Ejecute el re-entrenamiento primero.",
            "demanda_predicha": 0,
            "demanda_lower": 0,
            "demanda_upper": 0,
            "nivel_confianza": 0,
            "shap_values_dict": {},
            "top_feature": None,
            "recomendacion": "Modelo no disponible.",
            "nivel_riesgo": "medio"
        }
        
    if features_dict is None:
        features_dict = _get_latest_features(programa_id, anio, semana)
        
    if features_dict is None:
        return {
            "error": "No hay datos históricos para este programa en caracteristicas_demanda_semanal.",
            "demanda_predicha": 0,
            "demanda_lower": 0,
            "demanda_upper": 0,
            "nivel_confianza": 0,
            "shap_values_dict": {},
            "top_feature": None,
            "recomendacion": "Falta historial de datos para predecir.",
            "nivel_riesgo": "medio"
        }
        
    # Convertir a DataFrame en el orden exacto esperado por el modelo
    x_input = pd.DataFrame([[features_dict.get(c, 0.0) for c in FEATURE_COLS]], columns=FEATURE_COLS)
    
    # 1. Predicción
    demanda_predicha = max(0.0, float(_model.predict(x_input)[0]))
    
    # 2. Explicabilidad SHAP
    shap_vals = _explainer.shap_values(x_input)
    
    if isinstance(shap_vals, list):
        shap_vals = shap_vals[0]
        
    shap_values_dict = {}
    for i, col in enumerate(FEATURE_COLS):
        shap_values_dict[col] = float(shap_vals[0][i])
        
    top_feature = max(shap_values_dict, key=lambda k: abs(shap_values_dict[k]))
    
    # 3. Intervalo de confianza heurístico (cuando no es bootstrap en batch)
    demanda_lower = max(0.0, demanda_predicha - demanda_predicha * 0.20)
    demanda_upper = demanda_predicha + demanda_predicha * 0.20
    nivel_confianza = 0.85
    
    # 4. Recomendación accionable y nivel de riesgo
    if demanda_predicha > 10.0:
        recomendacion = "Alta demanda proyectada. Lanzamiento recomendado. Considere aumentar cupos."
        nivel_riesgo = "bajo"
    elif demanda_predicha >= 4.0:
        recomendacion = "Demanda moderada esperada. Evalúe costo vs. umbral de rentabilidad."
        nivel_riesgo = "medio"
    else:
        recomendacion = "Demanda baja proyectada. Se recomienda posponer o fortalecer campaña de marketing."
        nivel_riesgo = "alto"
        
    return {
        "demanda_predicha": demanda_predicha,
        "demanda_lower": demanda_lower,
        "demanda_upper": demanda_upper,
        "nivel_confianza": nivel_confianza,
        "shap_values_dict": shap_values_dict,
        "top_feature": top_feature,
        "recomendacion": recomendacion,
        "nivel_riesgo": nivel_riesgo
    }
