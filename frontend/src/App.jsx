import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Cursos from './pages/Cursos';
import Diplomados from './pages/Diplomados';
import Login from './pages/Login';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import Inscripciones from './pages/dashboard/Inscripciones';
import IAPredictiva from './pages/dashboard/IAPredictiva';
import './index.css';

// Componente simple para proteger rutas
const PrivateRoute = ({ children }) => {
  // Lógica simple de check de Auth (en un mundo real usaríamos Context API o Redux)
  const isAuth = document.cookie.includes('access_token') || sessionStorage.getItem('user');
  // Nota: Como la cookie es HTTP-only no podemos leer 'access_token' en JS directamente
  // Por ende, usaremos un truco apoyándonos en un flag guardado en sessionStorage al hacer login exitoso
  const loggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
  return loggedIn ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        
        <main style={{ flex: 1 }}>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/cursos" element={<Cursos />} />
            <Route path="/diplomados" element={<Diplomados />} />
            
            {/* Ruta Login */}
            <Route path="/login" element={<Login />} />
            
            {/* Rutas Privadas */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }>
              <Route index element={<h2 style={{padding: '20px'}}>Bienvenido al Panel de Control de Autopoiesis</h2>} />
              <Route path="inscripciones" element={<Inscripciones />} />
              <Route path="ia-predictiva" element={<IAPredictiva />} />
            </Route>
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
