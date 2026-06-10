# Base de Datos - Academia Autopoiesis

Este módulo define la estructura de persistencia transaccional (OLTP) y analítica (OLAP) del sistema de la Academia Autopoiesis, utilizando PostgreSQL 15.

## Estructura del Esquema
La base de datos sigue un modelo normalizado en 3NF:
*   **Entidades Catálogo:** `categorias`, `tipos_servicio`, `departamentos`, `roles`, `estados_inscripcion`, `origenes_captacion`.
*   **Entidades Transaccionales:** `programas`, `usuarios`, `inscripciones`, `boletin_informativo`, etc.
*   **Entidades de Machine Learning:** Tablas destinadas al análisis histórico y predicciones.

## Directrices de Diseño
1.  **Integridad Relacional:** Todas las relaciones definen Foreign Keys explícitas.
2.  **Seguridad de Borrado:** Se utiliza borrado lógico (`eliminado = true`) en lugar de `ON DELETE CASCADE` en tablas críticas para no afectar el modelo de Inteligencia Artificial.
3.  **Catálogos Categóricos:** Diseñados específicamente para facilitar el proceso de One-Hot Encoding en el modelo XGBoost.
