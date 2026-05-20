-- ==============================================================================
-- ESQUEMA DE BASE DE DATOS: ACADEMIA AUTOPOIESIS (PostgreSQL 18 )[cite: 4]
-- ==============================================================================

-- 1. Fundamento: Restricciones de Dominio y Normalización a 1NF (Primera Forma Normal) y 2NF (Segunda Forma Normal)[cite: 4]
-- Se crean tablas catálogo para evitar la redundancia de texto y dependencias transitivas[cite: 4].
-- En lugar de escribir "La Paz" o "Curso" repetidas veces (lo que rompe la 3NF (Tercera Forma Normal)), 
-- se asigna un identificador único[cite: 4].

CREATE TABLE categorias (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
    -- Fundamento: Tipado Estricto y Unicidad[cite: 4].
    -- 'nombre' tiene un límite de memoria y no permite valores nulos ni duplicados, 
    -- garantizando la consistencia de los datos[cite: 4].
);

CREATE TABLE tipos_servicio (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE departamentos (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE estados_inscripcion (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE roles (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE origenes_captacion (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE modalidades (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE beneficios (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE grados_academicos (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- ==============================================================================

-- 2. Fundamento: Abstracción e Integridad Referencial[cite: 4]
-- La tabla 'usuarios' abstrae a las entidades físicas (estudiantes, gestores)[cite: 4].
-- La tabla 'programas' abstrae la oferta académica[cite: 4].

CREATE TABLE usuarios (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    rol_id INT NOT NULL,
    departamento_id INT,
    grado_academico_id INT,
    nombre_completo VARCHAR(150) NOT NULL,
    ci VARCHAR(20) UNIQUE,
    correo VARCHAR(150) UNIQUE NOT NULL,
    hash_contrasena VARCHAR(255) NOT NULL,
    requiere_cambio_password BOOLEAN DEFAULT false,
    telefono VARCHAR(20),
    fecha_nacimiento DATE,
    totp_secret VARCHAR(50),
    totp_enabled BOOLEAN DEFAULT false,
    email_verificado BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_usuario_departamento FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE RESTRICT,
    CONSTRAINT fk_usuario_grado FOREIGN KEY (grado_academico_id) REFERENCES grados_academicos(id) ON DELETE RESTRICT
    -- Fundamento: Integridad Referencial mediante FK (Llave Foránea)[cite: 4]. 
    -- 'ON DELETE RESTRICT' aplica el principio de prevención de datos huérfanos[cite: 4]. 
    -- No se puede borrar un rol si existen usuarios asignados a él[cite: 4].
);

CREATE TABLE boletin_informativo (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INT,
    correo VARCHAR(150) NOT NULL UNIQUE,
    fecha_suscripcion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true,
    CONSTRAINT fk_boletin_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE programas (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    categoria_id INT NOT NULL,
    tipo_servicio_id INT NOT NULL,
    modalidad_id INT NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    costo_oficial_bs DECIMAL(10, 2) NOT NULL,
    duracion_horas INT,
    imagen_url VARCHAR(255),
    descripcion TEXT,
    activo BOOLEAN DEFAULT false,
    eliminado BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_programa_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
    CONSTRAINT fk_programa_servicio FOREIGN KEY (tipo_servicio_id) REFERENCES tipos_servicio(id) ON DELETE RESTRICT,
    CONSTRAINT fk_programa_modalidad FOREIGN KEY (modalidad_id) REFERENCES modalidades(id) ON DELETE RESTRICT
    -- Fundamento: Composición en el modelo Entidad-Relación[cite: 4].
    -- Un programa "tiene una" categoría y "tiene un" tipo de servicio[cite: 4].
);

CREATE TABLE programa_facilitadores (
    programa_id INT NOT NULL,
    facilitador_id INT NOT NULL,
    PRIMARY KEY (programa_id, facilitador_id),
    CONSTRAINT fk_pf_programa FOREIGN KEY (programa_id) REFERENCES programas(id) ON DELETE CASCADE,
    CONSTRAINT fk_pf_facilitador FOREIGN KEY (facilitador_id) REFERENCES usuarios(id) ON DELETE CASCADE
    -- Fundamento: Resolución de Relación N:M[cite: 4]. 
    -- Un programa puede tener múltiples facilitadores, y un facilitador dictar múltiples programas.
);

CREATE TABLE programa_beneficios (
    programa_id INT NOT NULL,
    beneficio_id INT NOT NULL,
    PRIMARY KEY (programa_id, beneficio_id),
    CONSTRAINT fk_pb_programa FOREIGN KEY (programa_id) REFERENCES programas(id) ON DELETE CASCADE,
    CONSTRAINT fk_pb_beneficio FOREIGN KEY (beneficio_id) REFERENCES beneficios(id) ON DELETE CASCADE
);

-- ==============================================================================

-- 3. Fundamento: Mapeo de Relaciones Muchos a Muchos[cite: 4]
-- La tabla 'inscripciones' resuelve la relación N:M (Muchos a Muchos) entre 'usuarios' y 'programas'[cite: 4].
-- Contiene los registros transaccionales base (OLTP (Procesamiento de Transacciones en Línea)) que el sistema recolectará[cite: 4].

CREATE TABLE cohortes (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    programa_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    activo BOOLEAN DEFAULT false,
    CONSTRAINT fk_cohorte_programa FOREIGN KEY (programa_id) REFERENCES programas(id) ON DELETE CASCADE
);

CREATE TABLE inscripciones (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INT NOT NULL,
    cohorte_id INT NOT NULL,
    estado_id INT NOT NULL,
    origen_id INT NOT NULL,
    fecha_inscripcion DATE NOT NULL,
    costo_pagado DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_inscripcion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_inscripcion_cohorte FOREIGN KEY (cohorte_id) REFERENCES cohortes(id) ON DELETE CASCADE,
    CONSTRAINT fk_inscripcion_estado FOREIGN KEY (estado_id) REFERENCES estados_inscripcion(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inscripcion_origen FOREIGN KEY (origen_id) REFERENCES origenes_captacion(id) ON DELETE RESTRICT
);

CREATE TABLE pagos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    inscripcion_id INT NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    fecha_pago TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pago_inscripcion FOREIGN KEY (inscripcion_id) REFERENCES inscripciones(id) ON DELETE CASCADE
    -- Fundamento: Historial Financiero Independiente.
    -- Separa el estado de la inscripción del flujo de caja, ayudando a XGBoost a predecir abandono por impagos.
);

CREATE TABLE certificados (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    inscripcion_id INT NOT NULL UNIQUE,
    codigo_verificacion VARCHAR(100) UNIQUE NOT NULL,
    url_pdf VARCHAR(255),
    fecha_emision TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_certificado_inscripcion FOREIGN KEY (inscripcion_id) REFERENCES inscripciones(id) ON DELETE CASCADE
);

-- ==============================================================================
-- TABLAS DE MACHINE LEARNING (Fase 4: Predicción Explicable XGBoost + SHAP)
-- ==============================================================================

CREATE TABLE caracteristicas_demanda_semanal (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    programa_id INT NOT NULL,
    anio INT NOT NULL,
    semana_del_anio INT NOT NULL,
    conteo_demanda INT NOT NULL,
    edad_promedio DECIMAL(5, 2) NOT NULL,
    seno_semana DOUBLE PRECISION NOT NULL,
    coseno_semana DOUBLE PRECISION NOT NULL,
    CONSTRAINT fk_cds_programa FOREIGN KEY (programa_id) REFERENCES programas(id) ON DELETE CASCADE,
    CONSTRAINT uq_cds_periodo UNIQUE (programa_id, anio, semana_del_anio)
);

CREATE TABLE predicciones (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    programa_id INT NOT NULL,
    anio_objetivo INT NOT NULL,
    semana_objetivo INT NOT NULL,
    demanda_predicha DOUBLE PRECISION NOT NULL,
    nivel_confianza DOUBLE PRECISION NOT NULL,
    resumen_shap JSONB NOT NULL,
    CONSTRAINT fk_pred_programa FOREIGN KEY (programa_id) REFERENCES programas(id) ON DELETE CASCADE,
    CONSTRAINT uq_pred_periodo UNIQUE (programa_id, anio_objetivo, semana_objetivo)
);


-- ==============================================================================
-- ÍNDICES[cite: 4]
-- Fundamento: Optimización de Complejidad Temporal[cite: 4].
-- Se crean índices en las columnas utilizadas frecuentemente en cláusulas WHERE o JOINs[cite: 4].
-- Reduce la búsqueda secuencial (O(N)) a una búsqueda en árbol B (O(log N))[cite: 4].
-- ==============================================================================

CREATE INDEX idx_inscripciones_cohorte_id ON inscripciones(cohorte_id);
CREATE INDEX idx_inscripciones_fecha ON inscripciones(fecha_inscripcion);

-- ==============================================================================
-- DATOS CATÁLOGO BASE (Bootstrap)
-- ==============================================================================

INSERT INTO roles (nombre) VALUES 
('Administrador'), ('Estudiante'), ('Facilitador'), ('Suscriptor') 
ON CONFLICT DO NOTHING;

INSERT INTO departamentos (nombre) VALUES 
('La Paz'), ('Santa Cruz'), ('Cochabamba'), ('Oruro'), 
('Potosi'), ('Tarija'), ('Chuquisaca'), ('Beni'), ('Pando'), ('Extranjero') 
ON CONFLICT DO NOTHING;

INSERT INTO categorias (nombre) VALUES 
('Derecho'), ('Psicología'), ('Investigación'), ('Educación'), 
('Salud'), ('Tecnología'), ('Administración') 
ON CONFLICT DO NOTHING;

INSERT INTO tipos_servicio (nombre) VALUES 
('Curso'), ('Diplomado') 
ON CONFLICT DO NOTHING;

INSERT INTO estados_inscripcion (nombre) VALUES 
('Pendiente de Pago'), ('Activo'), ('Finalizado'), ('Retirado') 
ON CONFLICT DO NOTHING;

INSERT INTO origenes_captacion (nombre) VALUES 
('Boletin Informativo'), ('Facebook'), ('Sitio Web (Organico)'), ('Recomendación') 
ON CONFLICT DO NOTHING;

INSERT INTO modalidades (nombre) VALUES 
('Virtual'), ('Presencial'), ('Híbrido') 
ON CONFLICT DO NOTHING;

INSERT INTO beneficios (nombre) VALUES 
('Material Digital'), ('Sesiones Grabadas'), ('Certificado de Aprobación'), ('Tutoría Personalizada') 
ON CONFLICT DO NOTHING;

INSERT INTO grados_academicos (nombre) VALUES 
('Estudiante'), ('Egresado'), ('Profesional') 
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- USUARIOS SEMILLA ESENCIALES PARA PRUEBAS (Fase de Bootstrap)
-- ==============================================================================

INSERT INTO usuarios (rol_id, departamento_id, grado_academico_id, nombre_completo, ci, correo, hash_contrasena, requiere_cambio_password, email_verificado, fecha_nacimiento) 
VALUES
((SELECT id FROM roles WHERE nombre = 'Administrador'), 1, (SELECT id FROM grados_academicos WHERE nombre = 'Profesional'), 'Administrador Autopoiesis', '1234567', 'juandiegomc.sis@gmail.com', '$2b$12$kI7.BsmNVESA./5YQ/fAmeKGIbAL/59qnYlnQj37CnHcJdZufB/d.', false, true, '1998-09-23'),
((SELECT id FROM roles WHERE nombre = 'Estudiante'), 1, (SELECT id FROM grados_academicos WHERE nombre = 'Estudiante'), 'Juan Diego Mamani Coarite', '75809309', 'mcj2027302@est.univalle.edu', '$2b$12$Sodx0mzzrTBNEqhebuGAy.HIB6CcFb8nf8BPbHtCa1Sx2AM1n3sBW', false, true, '2000-01-01'),
((SELECT id FROM roles WHERE nombre = 'Estudiante'), 1, (SELECT id FROM grados_academicos WHERE nombre = 'Estudiante'), 'Diego Coarite', '75809310', 'juuuuands@gmail.com', '$2b$12$Sodx0mzzrTBNEqhebuGAy.HIB6CcFb8nf8BPbHtCa1Sx2AM1n3sBW', false, true, '2000-01-02'),
((SELECT id FROM roles WHERE nombre = 'Facilitador'), 1, (SELECT id FROM grados_academicos WHERE nombre = 'Profesional'), 'Victor Hugo Aranda', '77777777', 'vhico765@gmail.com', '$2b$12$vCp7EEBTlFq.KLenGIvLOeqh7b5PH560y4wnV.tlP3aKRv6ImtLOm', false, true, '1999-01-01')
ON CONFLICT (correo) DO NOTHING;