-- Feature Store para el pipeline ML (Tabla aplanada en 3NF)
CREATE TABLE IF NOT EXISTS caracteristicas_demanda_semanal (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    programa_id INT NOT NULL,
    anio INT NOT NULL,
    semana_del_anio INT NOT NULL,

    -- Target
    conteo_demanda INT DEFAULT 0,

    -- Atributos de Demografía
    edad_promedio DOUBLE PRECISION,
    edad_mediana DOUBLE PRECISION,
    edad_min DOUBLE PRECISION,
    edad_max DOUBLE PRECISION,
    porc_estudiantes DOUBLE PRECISION,
    porc_profesionales DOUBLE PRECISION,
    porc_la_paz DOUBLE PRECISION,
    porc_otros_depts DOUBLE PRECISION,

    -- Atributos Financieros
    ingreso_semana DOUBLE PRECISION,
    precio_promedio_pagado DOUBLE PRECISION,
    tasa_descuento DOUBLE PRECISION,
    precio_relativo DOUBLE PRECISION,

    -- Atributos de Estado / Retención
    tasa_activos DOUBLE PRECISION,
    tasa_retirados DOUBLE PRECISION,
    tasa_finalizados DOUBLE PRECISION,
    tasa_pendientes DOUBLE PRECISION,

    -- Atributos de Canales de Adquisición
    porc_facebook DOUBLE PRECISION,
    porc_boletin DOUBLE PRECISION,
    porc_organico DOUBLE PRECISION,
    porc_recomendacion DOUBLE PRECISION,

    -- Atributos del Programa (Carry Forward)
    duracion_horas DOUBLE PRECISION,
    num_facilitadores INT,
    costo_oficial_bs DOUBLE PRECISION,
    categoria_id INT,
    tipo_servicio_id INT,
    modalidad_id INT,
    num_beneficios INT,

    -- Temporalidad Cíclica (Seno/Coseno)
    seno_semana DOUBLE PRECISION,
    coseno_semana DOUBLE PRECISION,
    seno_mes DOUBLE PRECISION,
    coseno_mes DOUBLE PRECISION,
    es_inicio_trimestre INT DEFAULT 0,
    es_fin_anio INT DEFAULT 0,

    -- Datos Externos
    ga4_sesiones_semana DOUBLE PRECISION,
    ga4_eventos_conversion DOUBLE PRECISION,
    ga4_usuarios_activos DOUBLE PRECISION,
    ga4_tasa_rebote DOUBLE PRECISION,
    trends_interes_categoria DOUBLE PRECISION,
    trends_interes_programa DOUBLE PRECISION,

    -- Autoregresivos (Lags y Rolling Windows)
    conteo_lag_1 DOUBLE PRECISION,
    conteo_lag_2 DOUBLE PRECISION,
    conteo_lag_4 DOUBLE PRECISION,
    conteo_rolling_4w DOUBLE PRECISION,
    conteo_rolling_8w DOUBLE PRECISION,
    conteo_mismo_periodo_anio_ant DOUBLE PRECISION,

    fecha_actualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cds_programa FOREIGN KEY (programa_id) REFERENCES programas(id) ON DELETE CASCADE,
    CONSTRAINT uq_cds_periodo UNIQUE (programa_id, anio, semana_del_anio)
);

-- Tabla de Predicciones del modelo
CREATE TABLE IF NOT EXISTS predicciones (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    programa_id INT NOT NULL,
    anio_objetivo INT NOT NULL,
    semana_objetivo INT NOT NULL,
    fecha_prediccion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    demanda_predicha DOUBLE PRECISION NOT NULL,
    demanda_lower DOUBLE PRECISION,                   -- límite inferior intervalo confianza
    demanda_upper DOUBLE PRECISION,                   -- límite superior intervalo confianza
    nivel_confianza DOUBLE PRECISION,                 -- ej. 0.90
    nivel_riesgo VARCHAR(20),                         -- 'bajo', 'medio', 'alto'

    resumen_shap JSONB,                               -- Top features que explicaron la predicción
    recomendacion TEXT,                               -- Texto de recomendación generada
    es_historico BOOLEAN DEFAULT false,               -- true si fue proyectada y el tiempo ya pasó

    CONSTRAINT fk_predicciones_programa FOREIGN KEY (programa_id) REFERENCES programas(id) ON DELETE CASCADE,
    CONSTRAINT uq_predicciones_periodo UNIQUE (programa_id, anio_objetivo, semana_objetivo)
);

-- Métricas de cada versión del modelo entrenado
CREATE TABLE IF NOT EXISTS metricas_modelo (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    version INT NOT NULL DEFAULT 1,
    fecha_entrenamiento TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    rmse_train DOUBLE PRECISION,
    rmse_test DOUBLE PRECISION,
    mae_train DOUBLE PRECISION,
    mae_test DOUBLE PRECISION,
    r2_train DOUBLE PRECISION,
    r2_test DOUBLE PRECISION,
    mape_test DOUBLE PRECISION,
    n_samples_train INT,
    n_samples_test INT,
    n_features INT,
    n_optuna_trials INT,
    mejores_hiperparametros JSONB,
    importancia_features JSONB,
    activo BOOLEAN DEFAULT true,
    notas TEXT
);

-- Métricas de GA4 por programa y período
CREATE TABLE IF NOT EXISTS ga4_metricas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    programa_id INT,
    fecha DATE NOT NULL,
    metrica VARCHAR(100) NOT NULL,
    valor DOUBLE PRECISION NOT NULL DEFAULT 0,
    dimension_clave VARCHAR(100),
    dimension_valor VARCHAR(200),
    fecha_extraccion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ga4_programa FOREIGN KEY (programa_id) REFERENCES programas(id) ON DELETE SET NULL,
    CONSTRAINT uq_ga4_metrica UNIQUE NULLS NOT DISTINCT (programa_id, fecha, metrica, dimension_valor)
);

-- Tendencias de búsqueda de Google Trends Bolivia
CREATE TABLE IF NOT EXISTS trends_data (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    keyword VARCHAR(200) NOT NULL,
    categoria_id INT,
    fecha DATE NOT NULL,
    indice_interes INT NOT NULL DEFAULT 0,
    geo VARCHAR(10) DEFAULT 'BO',
    fecha_extraccion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_trends_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
    CONSTRAINT uq_trends_periodo UNIQUE (keyword, fecha, geo)
);

CREATE INDEX IF NOT EXISTS idx_cds_programa_periodo ON caracteristicas_demanda_semanal(programa_id, anio, semana_del_anio);
CREATE INDEX IF NOT EXISTS idx_predicciones_programa ON predicciones(programa_id, anio_objetivo, semana_objetivo);
CREATE INDEX IF NOT EXISTS idx_predicciones_futuras ON predicciones(es_historico, fecha_prediccion);
CREATE INDEX IF NOT EXISTS idx_ga4_fecha ON ga4_metricas(fecha, metrica);
CREATE INDEX IF NOT EXISTS idx_trends_fecha ON trends_data(keyword, fecha);
CREATE INDEX IF NOT EXISTS idx_metricas_modelo_activo ON metricas_modelo(activo, fecha_entrenamiento);
