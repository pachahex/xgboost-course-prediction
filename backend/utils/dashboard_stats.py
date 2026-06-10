from sqlalchemy import text
from db import get_db_connection
import json

def get_dashboard_full_stats():
    """Genera las métricas para los 9 gráficos del Dashboard Administrativo."""
    with get_db_connection() as conn:
        # Gráfico 1 & 6: Inscritos Históricos vs Esperados (Serie de tiempo general)
        # Sumamos la demanda real vs predicha por semana/año a nivel global
        try:
            res_tiempo = conn.execute(text("""
                SELECT 
                    COALESCE(c.anio, p.anio_objetivo) as anio,
                    COALESCE(c.semana_del_anio, p.semana_objetivo) as semana,
                    SUM(COALESCE(c.conteo_demanda, 0)) as historico,
                    SUM(COALESCE(p.demanda_predicha, 0)) as esperado
                FROM predicciones p
                FULL OUTER JOIN caracteristicas_demanda_semanal c 
                    ON p.programa_id = c.programa_id AND p.anio_objetivo = c.anio AND p.semana_objetivo = c.semana_del_anio
                GROUP BY 1, 2
                ORDER BY 1, 2
                LIMIT 24
            """)).fetchall()
            chart_serie_tiempo = [{"name": f"S{row[1]}-{row[0]}", "historico": int(row[2]), "esperado": round(float(row[3]), 2)} for row in res_tiempo]
        except Exception:
            conn.rollback() # Rollback the failed transaction
            chart_serie_tiempo = []
        
        # Gráfico 2 & 3: Top Programas Recomendados y Peores Programas (En Riesgo)
        # Basado en la suma de demanda predicha
        try:
            res_progs = conn.execute(text("""
                SELECT pr.nombre, SUM(p.demanda_predicha) as total_predicho
                FROM predicciones p
                JOIN programas pr ON p.programa_id = pr.id
                GROUP BY pr.nombre
                ORDER BY total_predicho DESC
            """)).fetchall()
            chart_top_programas = [{"name": row[0], "value": round(float(row[1]), 2)} for row in res_progs[:5]]
            chart_peores_programas = [{"name": row[0], "value": round(float(row[1]), 2)} for row in res_progs[-5:]] if len(res_progs) > 5 else []
        except Exception:
            conn.rollback()
            chart_top_programas = []
            chart_peores_programas = []
        
        # Gráfico 4: Demanda Histórica por Categoría
        res_cat = conn.execute(text("""
            SELECT c.nombre, COUNT(i.id) as total
            FROM inscripciones i
            JOIN cohortes co ON i.cohorte_id = co.id
            JOIN programas pr ON co.programa_id = pr.id
            JOIN categorias c ON pr.categoria_id = c.id
            GROUP BY c.nombre
            ORDER BY total DESC
        """)).fetchall()
        chart_demanda_categoria = [{"name": row[0], "value": int(row[1])} for row in res_cat]
        
        # Gráfico 5: Impacto SHAP General
        # Promediamos los valores absolutos de SHAP de todas las predicciones para ver qué variable pesa más
        try:
            res_shap = conn.execute(text("SELECT resumen_shap FROM predicciones LIMIT 100")).fetchall()
            shap_avg = {"programa_id": 0, "semana": 0, "edad": 0, "seno_semana": 0, "coseno_semana": 0}
            total_shap = 0
            for (shap_str,) in res_shap:
                if shap_str:
                    s = json.loads(shap_str)
                    shap_avg["programa_id"] += abs(s.get("programa_id_impact", 0))
                    shap_avg["semana"] += abs(s.get("semana_del_anio_impact", 0))
                    shap_avg["edad"] += abs(s.get("edad_promedio_impact", 0))
                    shap_avg["seno_semana"] += abs(s.get("seno_semana_impact", 0))
                    shap_avg["coseno_semana"] += abs(s.get("coseno_semana_impact", 0))
                    total_shap += 1
                    
            if total_shap > 0:
                chart_impacto_shap = [
                    {"name": "Programa", "impact": round(shap_avg["programa_id"]/total_shap, 4)},
                    {"name": "Semana del Año", "impact": round(shap_avg["semana"]/total_shap, 4)},
                    {"name": "Edad Promedio", "impact": round(shap_avg["edad"]/total_shap, 4)},
                    {"name": "Temporada (Sen)", "impact": round(shap_avg["seno_semana"]/total_shap, 4)},
                    {"name": "Temporada (Cos)", "impact": round(shap_avg["coseno_semana"]/total_shap, 4)}
                ]
            else:
                chart_impacto_shap = []
        except Exception:
            conn.rollback()
            chart_impacto_shap = []
            
        # Gráfico 7: Distribución de Edades Histórica
        res_edades = conn.execute(text("""
            SELECT 
                CASE 
                    WHEN EXTRACT(YEAR FROM age(fecha_nacimiento)) < 20 THEN '< 20'
                    WHEN EXTRACT(YEAR FROM age(fecha_nacimiento)) BETWEEN 20 AND 25 THEN '20 - 25'
                    WHEN EXTRACT(YEAR FROM age(fecha_nacimiento)) BETWEEN 26 AND 30 THEN '26 - 30'
                    WHEN EXTRACT(YEAR FROM age(fecha_nacimiento)) BETWEEN 31 AND 40 THEN '31 - 40'
                    ELSE '> 40'
                END as rango_edad,
                COUNT(*) as total
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            WHERE r.nombre = 'Estudiante' AND fecha_nacimiento IS NOT NULL
            GROUP BY 1
            ORDER BY 1
        """)).fetchall()
        chart_edades = [{"name": row[0], "value": int(row[1])} for row in res_edades]
        
        # Gráfico 8: Orígenes de Captación
        res_orig = conn.execute(text("""
            SELECT o.nombre, COUNT(i.id) as total
            FROM inscripciones i
            JOIN origenes_captacion o ON i.origen_id = o.id
            GROUP BY o.nombre
            ORDER BY total DESC
        """)).fetchall()
        chart_origenes = [{"name": row[0], "value": int(row[1])} for row in res_orig]
        
        # Gráfico 9: Tasa de Conversión (Estado de Inscripción)
        res_estado = conn.execute(text("""
            SELECT e.nombre, COUNT(i.id) as total
            FROM inscripciones i
            JOIN estados_inscripcion e ON i.estado_id = e.id
            GROUP BY e.nombre
            ORDER BY total DESC
        """)).fetchall()
        chart_estados = [{"name": row[0], "value": int(row[1])} for row in res_estado]

        # Gráfico Adicional: Ingresos Estimados (Top 5)
        res_ingresos = conn.execute(text("""
            SELECT pr.nombre, SUM(i.costo_pagado) as ingresos
            FROM inscripciones i
            JOIN cohortes co ON i.cohorte_id = co.id
            JOIN programas pr ON co.programa_id = pr.id
            WHERE i.estado_id IN (SELECT id FROM estados_inscripcion WHERE nombre IN ('Activo', 'Finalizado'))
            GROUP BY pr.nombre
            ORDER BY ingresos DESC
            LIMIT 5
        """)).fetchall()
        chart_ingresos = [{"name": row[0][:20], "value": float(row[1])} for row in res_ingresos]

    return {
        "chart_serie_tiempo": chart_serie_tiempo,
        "chart_top_programas": chart_top_programas,
        "chart_peores_programas": chart_peores_programas,
        "chart_demanda_categoria": chart_demanda_categoria,
        "chart_impacto_shap": chart_impacto_shap,
        "chart_edades": chart_edades,
        "chart_origenes": chart_origenes,
        "chart_estados": chart_estados,
        "chart_ingresos": chart_ingresos
    }
