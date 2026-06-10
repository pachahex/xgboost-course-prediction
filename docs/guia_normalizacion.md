# Arquitectura de Base de Datos Orientada a Machine Learning

Este documento detalla los principios de diseño estructural aplicados a la base de datos de la Academia Autopoiesis. El esquema actual (definido en `db/init/01_schema.sql`) ha sido meticulosamente diseñado respetando las Formas Normales de las bases de datos relacionales, con el objetivo dual de mantener un sistema transaccional robusto y alimentar un pipeline de **XGBoost**.

## 1. Fundamentos de Normalización

El esquema de la base de datos cumple estrictamente con las reglas de normalización (1NF, 2NF, 3NF), lo que garantiza la ausencia de redundancia y previene anomalías de actualización.

### 1.1. Primera Forma Normal (1NF): Atomicidad
*La 1NF dicta que todos los atributos deben ser atómicos (indivisibles) y no pueden existir grupos repetitivos.*
*   **Implementación:** En lugar de guardar una lista de facilitadores asociados a un programa en un solo campo de texto (ej. "Facilitador A, Facilitador B"), se ha implementado una **tabla pivote `programa_facilitadores`**.
*   **Beneficio ML:** XGBoost no puede procesar strings delimitados por comas nativamente. Al tener una relación N:M estructurada, se pueden extraer métricas limpias como "Cantidad de facilitadores por programa" o "Promedio de edad de los facilitadores asignados".

### 1.2. Segunda Forma Normal (2NF): Dependencia Completa
*La 2NF exige que todos los atributos no clave dependan de la clave primaria completa.*
*   **Implementación:** Los datos geográficos de los estudiantes (`departamentos`) no se guardan directamente en `inscripciones`, sino en `usuarios`. La inscripción depende de la interacción, pero el departamento de origen depende puramente del estudiante.

### 1.3. Tercera Forma Normal (3NF): Eliminación de Dependencias Transitivas
*La 3NF establece que no debe haber dependencias transitivas entre atributos no clave (todo atributo debe depender exclusivamente de la clave primaria).*
*   **Implementación:** Se ha creado la tabla catálogo `origenes_captacion` en lugar de un campo de texto libre (`VARCHAR`).
*   **Beneficio ML:** Un texto libre genera ruido y alta cardinalidad ("FB", "Face", "Facebook"). El catálogo garantiza categorías únicas y finitas, lo que es **crítico para aplicar One-Hot Encoding** en la preparación de datos para XGBoost.

## 2. Decisiones de Diseño Críticas para ML

### 2.1. El Congelamiento del Costo (`costo_pagado`)
Aunque puramente bajo la teoría estricta de la normalización, copiar el `costo_oficial_bs` de la tabla `programas` hacia `inscripciones` podría considerarse redundante, es una **excepción de diseño fundamental (Slowly Changing Dimensions - Tipo 2 simplificado)**.
*   **Justificación:** El precio de un programa puede variar con el tiempo. Si el sistema contable lee el precio actual en lugar del histórico, toda la información de ingresos pasados se corrompería.
*   **Beneficio ML:** Para el modelo predictivo, el "Costo en el momento exacto de la inscripción" es una variable predictiva (feature) mucho más potente que el "Costo actual del programa".

### 2.2. Aislamiento Financiero (`pagos`)
El sistema no asume que "Inscrito = Pagado completamente". Se ha separado el acto académico (tabla `inscripciones`) del flujo de caja (tabla `pagos`).
*   **Beneficio ML:** El modelo predictivo puede analizar series de tiempo de pagos (ej. pagos en cuotas) para predecir **Abandono (Churn)** antes de que ocurra. Estudiantes con retrasos en la tabla `pagos` tienen estadísticamente más probabilidad de cambiar su estado a 'Abandono'.

## 3. Manejo de Ruido (Outliers)

### Eliminación del departamento "Otro"
En recolección de datos, la categoría "Otro" suele convertirse en un basurero estadístico. Al obligar al sistema a encasillar los datos geográficos en "Departamentos de Bolivia" o "Extranjero", reducimos la varianza no explicada del modelo, agrupando comportamientos internacionales bajo un mismo clúster.

---
> [!TIP]
> **Para el Equipo de Data Science:** Las tablas `caracteristicas_demanda_semanal` y `predicciones` han sido diseñadas para operar como un Data Mart analítico sobre este esquema transaccional, aislando la carga de inferencia del Core del negocio.
