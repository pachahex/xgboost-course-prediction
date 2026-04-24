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

-- ==============================================================================

-- 2. Fundamento: Abstracción e Integridad Referencial[cite: 4]
-- La tabla 'usuarios' abstrae a las entidades físicas (estudiantes, gestores)[cite: 4].
-- La tabla 'programas' abstrae la oferta académica[cite: 4].

CREATE TABLE usuarios (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    rol_id INT NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    hash_contrasena VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT
    -- Fundamento: Integridad Referencial mediante FK (Llave Foránea)[cite: 4]. 
    -- 'ON DELETE RESTRICT' aplica el principio de prevención de datos huérfanos[cite: 4]. 
    -- No se puede borrar un rol si existen usuarios asignados a él[cite: 4].
);

CREATE TABLE programas (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    categoria_id INT NOT NULL,
    tipo_servicio_id INT NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    costo_oficial_bs DECIMAL(10, 2) NOT NULL,
    fecha_creacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_programa_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
    CONSTRAINT fk_programa_servicio FOREIGN KEY (tipo_servicio_id) REFERENCES tipos_servicio(id) ON DELETE RESTRICT
    -- Fundamento: Composición en el modelo Entidad-Relación[cite: 4].
    -- Un programa "tiene una" categoría y "tiene un" tipo de servicio[cite: 4].
);

-- ==============================================================================

-- 3. Fundamento: Mapeo de Relaciones Muchos a Muchos[cite: 4]
-- La tabla 'inscripciones' resuelve la relación N:M (Muchos a Muchos) entre 'usuarios' y 'programas'[cite: 4].
-- Contiene los registros transaccionales base (OLTP (Procesamiento de Transacciones en Línea)) que el sistema recolectará[cite: 4].

CREATE TABLE inscripciones (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INT NOT NULL,
    programa_id INT NOT NULL,
    departamento_id INT NOT NULL,
    estado_id INT NOT NULL,
    fecha_inscripcion DATE NOT NULL,
    edad_estudiante INT CHECK (edad_estudiante >= 15 AND edad_estudiante <= 100),
    costo_real_bs DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_inscripcion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_inscripcion_programa FOREIGN KEY (programa_id) REFERENCES programas(id) ON DELETE CASCADE,
    CONSTRAINT fk_inscripcion_departamento FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inscripcion_estado FOREIGN KEY (estado_id) REFERENCES estados_inscripcion(id) ON DELETE RESTRICT
    -- Fundamento: Validaciones a nivel de base de datos[cite: 4].
    -- El CHECK en 'edad_estudiante' asegura que la lógica de negocio se cumpla antes 
    -- de la inserción, reduciendo la carga de validación en el servidor backend[cite: 4].
);

-- ==============================================================================

-- 4. Fundamento: Almacenamiento Analítico / Ingeniería de Características[cite: 4]
-- Para que XGBoost (eXtreme Gradient Boosting) no tenga que recalcular agregaciones pesadas en tiempo real, 
-- se persiste un almacén de características[cite: 4].

CREATE TABLE caracteristicas_demanda_semanal (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    programa_id INT NOT NULL,
    anio INT NOT NULL,
    semana_del_anio INT NOT NULL CHECK (semana_del_anio >= 1 AND semana_del_anio <= 53),
    conteo_demanda INT NOT NULL DEFAULT 0,
    edad_promedio DECIMAL(5, 2),
    seno_semana DOUBLE PRECISION NOT NULL,
    coseno_semana DOUBLE PRECISION NOT NULL,
    registrado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_caracteristicas_programa FOREIGN KEY (programa_id) REFERENCES programas(id) ON DELETE CASCADE,
    CONSTRAINT uq_programa_anio_semana UNIQUE (programa_id, anio, semana_del_anio)
    -- Fundamento: Clave Alterna mediante restricción UNIQUE[cite: 4].
    -- Garantiza que no existan dos registros de demanda para el mismo programa 
    -- en la misma semana del mismo año, evitando datos de entrenamiento duplicados[cite: 4].
);

-- ==============================================================================

-- 5. Fundamento: Trazabilidad e Inteligencia Artificial Explicable[cite: 4]
-- Almacena las salidas del modelo predictivo y sus explicaciones matemáticas para 
-- permitir la auditoría de la caja negra[cite: 4].

CREATE TABLE predicciones (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    programa_id INT NOT NULL,
    anio_objetivo INT NOT NULL,
    semana_objetivo INT NOT NULL,
    demanda_predicha FLOAT NOT NULL,
    nivel_confianza FLOAT,
    resumen_shap JSONB,
    predicho_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prediccion_programa FOREIGN KEY (programa_id) REFERENCES programas(id) ON DELETE CASCADE
    -- Fundamento: Estructuras de Datos No Relacionales en Entornos Relacionales[cite: 4].
    -- El uso de 'JSONB' (JavaScript Object Notation Binary) permite almacenar el 
    -- diccionario de variables SHAP (SHapley Additive exPlanations) sin requerir una tabla adicional compleja[cite: 4]. 
    -- Optimiza la lectura de datos anidados directamente desde el SGBDR 
    -- (Sistema de Gestión de Bases de Datos Relacionales)[cite: 4].
);

-- ==============================================================================
-- ÍNDICES[cite: 4]
-- Fundamento: Optimización de Complejidad Temporal[cite: 4].
-- Se crean índices en las columnas utilizadas frecuentemente en cláusulas WHERE o JOINs[cite: 4].
-- Reduce la búsqueda secuencial (O(N)) a una búsqueda en árbol B (O(log N))[cite: 4].
-- ==============================================================================

CREATE INDEX idx_inscripciones_programa_id ON inscripciones(programa_id);
CREATE INDEX idx_inscripciones_fecha ON inscripciones(fecha_inscripcion);
CREATE INDEX idx_caracteristicas_demanda_programa_tiempo ON caracteristicas_demanda_semanal(programa_id, anio, semana_del_anio);
CREATE INDEX idx_predicciones_programa_tiempo ON predicciones(programa_id, anio_objetivo, semana_objetivo);