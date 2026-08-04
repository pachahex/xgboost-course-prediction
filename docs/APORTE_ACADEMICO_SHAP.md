# Aporte Académico y Desarrollo de la Explicabilidad SHAP

Este documento sirve como evidencia técnica y soporte académico para documentar el desarrollo, la integración visual y el aporte científico del framework **SHAP (SHapley Additive exPlanations)** dentro del proyecto de predicción de demanda de la **Academia Autopoiesis**.

---

## 1. El Aporte Académico de SHAP (Inteligencia Artificial Explicable - XAI)

En los proyectos tradicionales de Machine Learning, los algoritmos de ensamble complejos como **XGBoost** operan como "cajas negras". Aunque ofrecen un alto rendimiento predictivo, es imposible comprender intuitivamente por qué el modelo estima una determinada cantidad de alumnos para un programa académico en particular.

Para resolver esta limitación y proporcionar valor científico al proyecto, se integró **SHAP**, una metodología basada en la **Teoría de Juegos Cooperativos** (formulada originalmente por el Premio Nobel Lloyd Shapley en 1953). 

### Fundamento Científico
*   **Aditividad:** SHAP desglosa la predicción final como la suma de un valor base (la media histórica de inscripciones) más las contribuciones individuales (positivas o negativas) de cada característica de entrada (precio, mes, categoría, etc.).
*   **Consistencia:** Si una variable cambia de tal forma que incrementa la demanda en cualquier escenario, su valor SHAP no disminuirá.
*   **Transparencia:** Traduce coeficientes abstractos de árboles de decisión a unidades directamente legibles por seres humanos: **cantidad de alumnos que suma o resta una variable a la predicción**.

---

## 2. Arquitectura de Conexión del Flujo SHAP

El flujo completo que conecta el entrenamiento del modelo con la visualización interactiva se estructura de la siguiente manera:

```mermaid
graph LR
    subgraph Backend [Python - Motor Predictivo]
        A[train_model.py] -->|1. Entrena y genera| B[xgboost_model.pkl]
        A -->|2. Genera gráfico global| C[shap_summary.png]
        D[predict.py] -->|3. Inferencia individual| E[shap_explainer.joblib]
    end

    subgraph API [Flask - Capa de Servicio]
        F[app.py] -->|4. Expone API predictiva| G[/api/admin/predecir-demanda]
    end

    subgraph Frontend [React - Interfaz Visual]
        H[IAPredictiva.jsx] -->|5. Consume API| G
        I[IAPredictivaDetalle.jsx] -->|6. Renderiza| J[Recharts BarChart]
        K[FichaTecnicaModelo.jsx] -->|7. Renderiza estáticos| C
    end
```

---

## 3. Evidencia de Desarrollo: Código Fuente del Proyecto

A continuación se presentan los fragmentos de código exactos que implementan esta lógica en el backend y frontend como evidencia del desarrollo del Sprint 11.

### A. Generación de Explicabilidad Local en Inferencia (Backend)
En el script de predicción [predict.py](file:///c:/Users/pipe-/Repositorio%20Local/xgboost-course-prediction/backend/ml/predict.py#L134-L144), el modelo utiliza el objeto `_explainer` de la biblioteca `shap` para descomponer en tiempo real la predicción de demanda de un programa seleccionado para un mes específico:

```python
    # 2. Explicabilidad SHAP
    shap_vals = _explainer.shap_values(x_input)
    
    if isinstance(shap_vals, list):
        shap_vals = shap_vals[0]
        
    shap_values_dict = {}
    for i, col in enumerate(FEATURE_COLS):
        shap_values_dict[col] = float(shap_vals[0][i])
        
    # Identificar la característica con mayor impacto absoluto
    top_feature = max(shap_values_dict, key=lambda k: abs(shap_values_dict[k]))
```

### B. Algoritmo Lógico Secundario: Recomendaciones Textuales Automáticas
Para que el gestor académico no requiera interpretar números complejos, en [predict.py](file:///c:/Users/pipe-/Repositorio%20Local/xgboost-course-prediction/backend/ml/predict.py#L151-L170) se programó un algoritmo secundario que evalúa los resultados predictivos y emite recomendaciones cualitativas y alertas de riesgo en lenguaje natural:

```python
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
```

### C. Backend: Entrenamiento y SHAP Global
En [train_model.py](file:///c:/Users/pipe-/Repositorio%20Local/xgboost-course-prediction/backend/ml/train_model.py#L87-L101), se calcula el impacto general de las variables sobre todo el catálogo para exportar el gráfico global de explicabilidad que se mostrará en la ficha técnica:

```python
    # 7. Explicabilidad: SHAP Values
    print("\nGenerando explicabilidad visual (SHAP)...")
    explainer = shap.TreeExplainer(best_model)
    shap_values = explainer.shap_values(X_test)

    # Configuración y guardado del gráfico global
    plt.figure(figsize=(10, 6))
    shap.summary_plot(shap_values, X_test, show=False)
    plt.title('Impacto de las Variables en el Tamaño del Cohorte (SHAP)')
    plt.tight_layout()
    plt.savefig(shap_plot_path, bbox_inches='tight', dpi=300)
    plt.close()
```

### D. Frontend: Gráfico de Cascada/Contribución Interactivo con Recharts
Para transformar los valores SHAP del backend en componentes interactivos, el frontend en React ([IAPredictivaDetalle.jsx](file:///c:/Users/pipe-/Repositorio%20Local/xgboost-course-prediction/frontend/src/pages/dashboard/IAPredictivaDetalle.jsx#L81-L91)) procesa los datos estructurados, los ordena y asigna colores semánticos dinámicos (Verde para factores que aumentan la demanda, Rojo para factores que la disminuyen):

```javascript
      // Extraemos y ordenamos los valores SHAP reales devueltos por XGBoost para el mes objetivo
      const shapEntries = Object.entries(progData.shap_values)
        .map(([key, value]) => ({
          name: key.replace('Categoria_', 'Cat: ').replace('Tipo_Programa_', 'Tipo: '),
          value: value,
          color: value >= 0 ? '#51cf66' : '#ff6b6b' // Verde positivo, Rojo negativo
        }))
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
        .slice(0, 6);
        
      setShapData(shapEntries);
```

Luego, en [IAPredictivaDetalle.jsx](file:///c:/Users/pipe-/Repositorio%20Local/xgboost-course-prediction/frontend/src/pages/dashboard/IAPredictivaDetalle.jsx#L273-L287), se utiliza la biblioteca **Recharts** para renderizar barras horizontales interactivas (el símil de contribución/cascada de SHAP):

```jsx
            <div className="chart-shap-container" style={{ height: '220px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shapData} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                  <XAxis type="number" tick={{fill: 'var(--text-muted)'}} />
                  <YAxis dataKey="name" type="category" width={100} tick={{fill: 'var(--text-main)', fontSize: 12, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    {shapData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
```

---

## 4. Aclaración Visual: ¿Cómo funciona cada representación?

Es fundamental diferenciar las dos representaciones de SHAP en la aplicación para evitar confusiones metodológicas durante la defensa del proyecto:

### A. Gráfico SHAP Global (Ficha Técnica del Modelo)
*   **Qué muestra:** El impacto agregado de las variables sobre todo el conjunto de prueba (Test Set).
*   **Significado del Color (Rojo y Azul):** Representa el **valor de la variable**.
    *   **Rojo (Alto valor de variable):** Por ejemplo, un precio oficial alto o un mes de lanzamiento tardío.
    *   **Azul (Bajo valor de variable):** Por ejemplo, un precio oficial bajo.
*   **Significado del Eje X (SHAP Value):** Si el punto se sitúa a la derecha (positivo), indica que ese valor de variable aumenta la demanda. Si se sitúa a la izquierda (negativo), la disminuye.
*   *Ejemplo de Lectura:* Un precio alto (puntos rojos) en la característica `Costo_Oficial_Bs` se agrupa en el lado izquierdo del eje X (SHAP negativo), lo que demuestra científicamente la ley de oferta y demanda en el catálogo (a mayor precio, menor número de alumnos esperados).

### B. Gráficos SHAP Locales (Simulador / Detalle Predictivo)
*   **Qué muestran:** La explicación específica de una predicción puntual para un único programa en un mes específico.
*   **Significado del Color (Verde y Rojo):** Representa el **sentido del impacto del SHAP Value** (y no el valor de la variable).
    *   **Verde (SHAP positivo / valor $\ge 0$):** Factores que **impulsan la demanda** al alza respecto al promedio. Por ejemplo, pertenecer a una categoría de alta demanda en Bolivia como 'Derecho' (leyes obligatorias).
    *   **Rojo (SHAP negativo / valor $< 0$):** Factores que **frenan la demanda** a la baja. Por ejemplo, un precio alto o lanzar en temporada baja (estacionalidad de fin de año).

---

## 5. Guía de Capturas de Pantalla para la Documentación / Tesis

Para ilustrar de forma idónea el aporte de SHAP en tu reporte académico, realiza y adjunta las siguientes capturas de pantalla desde la interfaz web del sistema en ejecución (`http://localhost:3000`):

### 📷 Captura 1: Gráfico Global de SHAP (Ficha Técnica)
*   **Ruta en la app:** `/dashboard/ficha-tecnica` o ingresa a **Ficha Técnica del Modelo**.
*   **Qué capturar:** El panel completo de "Explicabilidad y Relaciones" que muestra la imagen generada por Python (`shap_summary.png`) con las nubes de puntos de colores rojo y azul.
*   **Título sugerido para el reporte:** *"Figura X. Impacto global de variables del modelo XGBoost mediante SHAP Summary Plot (Python backend)."*

### 📷 Captura 2: Recomendaciones y Gráfico Local Interactivos (Detalle Predictivo)
*   **Ruta en la app:** Ve a **Gestor de Programas**, marca un programa con la estrella amarilla, luego dirígete a **Detalle Predictivo**.
*   **Qué capturar:** La sección combinada que muestra la "Demanda Proyectada" (el número estimado de inscritos), las "Recomendaciones Textuales Automáticas" (texto lógico en lenguaje natural) y el gráfico de barras horizontales de **Recharts** con colores verde y rojo.
*   **Título sugerido para el reporte:** *"Figura Y. Visualización interactiva con Recharts y Recomendaciones Lógicas del análisis SHAP local para un programa individual."*

### 📷 Captura 3: Simulación Dinámica de Ranking
*   **Ruta en la app:** Ve a **IA Predictiva**.
*   **Qué capturar:** El listado de programas rankeados de mayor a menor demanda, donde cada tarjeta de programa muestra su respectivo gráfico interactivo de barras de SHAP (Recharts).
*   **Título sugerido para el reporte:** *"Figura Z. Comparador predictivo de programas académicos ordenados por demanda con su respectivo desglose de explicabilidad SHAP."*
