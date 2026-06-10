# Guía de Implementación de Pruebas Automatizadas

Este documento proporciona una hoja de ruta breve para implementar pruebas automatizadas en el proyecto **Academia Autopoiesis**, asegurando la estabilidad del sistema a medida que crece.

---

## 1. Backend (Python/Flask)

Para el backend, se recomienda utilizar **Pytest**.

### Instalación
```bash
pip install pytest pytest-flask
```

### Estructura sugerida
Crea una carpeta `backend/tests/`:
- `conftest.py`: Configuración de fixtures (app, db_session limpia).
- `test_auth.py`: Pruebas de login y 2FA.
- `test_programas.py`: Pruebas del CRUD de programas y beneficios.

### Ejemplo de prueba básica (`test_app.py`)
```python
def test_public_stats(client):
    response = client.get('/api/public-stats')
    assert response.status_code == 200
    assert 'stats' in response.json
```

---

## 2. Frontend (React/Vite)

Para el frontend, existen dos enfoques complementarios:

### A. Pruebas Unitarias y de Componentes (**Vitest** + **React Testing Library**)
Ideal para probar lógica de componentes aislados.

**Instalación:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Ejemplo:**
```javascript
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import MyButton from './MyButton';

test('debe mostrar el texto correctamente', () => {
  render(<MyButton label="Click aquí" />);
  expect(screen.getByText('Click aquí')).toBeInTheDocument();
});
```

### B. Pruebas de Extremo a Extremo (E2E) (**Cypress** o **Playwright**)
Ideal para probar flujos completos (Registro -> Login -> Dashboard).

**Recomendación:** Cypress por su facilidad de uso y dashboard visual.
```bash
npm install cypress --save-dev
npx cypress open
```

---

## 3. Integración Continua (CI)

Puedes automatizar la ejecución de estas pruebas cada vez que subas código a tu repositorio utilizando **GitHub Actions**.

**Ejemplo de flujo (`.github/workflows/tests.yml`):**
```yaml
name: Run Tests
on: [push, pull_request]
jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Pytest
        run: |
          pip install -r backend/requirements.txt
          pytest backend/tests
```

---

## 4. Mejores Prácticas

1.  **Base de Datos de Test:** Nunca uses la base de datos de producción para las pruebas. Configura una instancia de PostgreSQL temporal o usa un contenedor Docker específico para tests.
2.  **Mocks:** Simula respuestas de servicios externos (como el envío de emails) para no depender de internet y acelerar las pruebas.
3.  **Cobertura:** Apunta a cubrir primero los flujos críticos (Happy Path) y luego los casos de error (Edge Cases).
