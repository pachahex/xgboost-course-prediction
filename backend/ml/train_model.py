import pandas as pd
import numpy as np
import xgboost as xgb
import shap
import joblib
import os
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def train():
    # 1. Configuración de Rutas
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dataset_path = os.path.join(base_dir, 'data', 'cohortes_dataset.csv')
    model_export_path = os.path.join(base_dir, 'ml', 'xgboost_model.pkl')
    shap_plot_path = os.path.join(base_dir, 'ml', 'shap_summary.png')
    
    print("--------------------------------------------------")
    print("Iniciando Fase de Entrenamiento: XGBoost + SHAP")
    print("--------------------------------------------------")

    # 2. Carga de Datos
    print("Cargando dataset preprocesado...")
    if not os.path.exists(dataset_path):
        print(f"Error: No se encontró el dataset en {dataset_path}")
        return

    df = pd.read_csv(dataset_path)
    
    # 3. Preparación de X e y (Evitando Data Leakage)
    print("Separando variables dependientes e independientes...")
    # Excluimos las columnas identificadoras (no matemáticas) y la variable objetivo
    columnas_excluidas = ['Programa', 'Cohorte', 'Fecha_Primer_Inscrito', 'Tamano_Cohorte']
    X = df.drop(columns=columnas_excluidas)
    y = df['Tamano_Cohorte']

    # 4. División Train-Test (80% Entrenamiento, 20% Prueba)
    print("Dividiendo en Conjunto de Entrenamiento (80%) y Prueba (20%)...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"Dimensiones Train: {X_train.shape}, Test: {X_test.shape}")

    # 5. Configuración Base y Ajuste de Hiperparámetros (GridSearchCV)
    print("Iniciando búsqueda de hiperparámetros (GridSearchCV)...")
    xgb_model = xgb.XGBRegressor(random_state=42, objective='reg:squarederror')
    
    # Malla de parámetros a explorar
    param_grid = {
        'n_estimators': [50, 100, 150],
        'learning_rate': [0.01, 0.05, 0.1],
        'max_depth': [3, 5, 7],
        'subsample': [0.8, 1.0]
    }

    grid_search = GridSearchCV(
        estimator=xgb_model,
        param_grid=param_grid,
        scoring='neg_mean_absolute_error', # Buscamos minimizar el error absoluto
        cv=5, # Validación cruzada de 5 pliegues
        verbose=1,
        n_jobs=-1
    )

    # Entrenar la malla
    grid_search.fit(X_train, y_train)
    
    # Extraer el mejor modelo
    best_model = grid_search.best_estimator_
    print("\n¡Hiperparámetros óptimos encontrados!")
    print(grid_search.best_params_)

    # 6. Evaluación de Métricas en el Conjunto de Prueba
    print("\nEvaluando el modelo con datos no vistos (Test Set)...")
    y_pred = best_model.predict(X_test)

    # Cálculo de métricas académicas
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    print(f"MAE (Error Absoluto Medio): {mae:.2f} alumnos.")
    print(f"RMSE (Raíz del Error Cuadrático Medio): {rmse:.2f} alumnos.")
    print(f"R² (Coeficiente de Determinación): {r2:.4f} ({(r2*100):.1f}% de la varianza explicada).")

    # 7. Explicabilidad: SHAP Values
    print("\nGenerando explicabilidad visual (SHAP)...")
    explainer = shap.TreeExplainer(best_model)
    shap_values = explainer.shap_values(X_test)

    # Configuración del gráfico
    plt.figure(figsize=(10, 6))
    shap.summary_plot(shap_values, X_test, show=False)
    plt.title('Impacto de las Variables en el Tamaño del Cohorte (SHAP)')
    plt.tight_layout()
    
    # Guardar gráfico
    plt.savefig(shap_plot_path, bbox_inches='tight', dpi=300)
    plt.close()
    print(f"Gráfico SHAP guardado en: {shap_plot_path}")

    # 8. Exportación del Modelo Definitivo
    print("\nExportando el modelo optimizado (.pkl)...")
    joblib.dump(best_model, model_export_path)
    print(f"¡Éxito! Modelo exportado a: {model_export_path}")
    print("Pipeline de Machine Learning concluido satisfactoriamente.")

if __name__ == "__main__":
    train()
