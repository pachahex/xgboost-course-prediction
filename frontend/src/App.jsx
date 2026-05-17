import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Cursos from './pages/Cursos';
import Diplomados from './pages/Diplomados';
import Login from './pages/Login';
import Registro from './pages/Registro';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import Inscripciones from './pages/dashboard/Inscripciones';
import IAPredictiva from './pages/dashboard/IAPredictiva';
import GestorProgramas from './pages/dashboard/GestorProgramas';
import GestorBeneficios from './pages/dashboard/GestorBeneficios';
import GestorFacilitadores from './pages/dashboard/GestorFacilitadores';
import NuevaInscripcion from './pages/dashboard/NuevaInscripcion';
import Mailing from './pages/dashboard/Mailing';
import Seguridad from './pages/dashboard/Seguridad';
import Preferencias from './pages/dashboard/Preferencias';
import VerificarEmail from './pages/VerificarEmail';
import ResetPassword from './pages/ResetPassword';
import './index.css';

// Componente simple para proteger rutas
const PrivateRoute = ({ children }) => {
  const loggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
  return loggedIn ? children : <Navigate to="/login" replace />;
};

// Componente para proteger rutas según el ROL
const RoleRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const loggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

  if (!loggedIn) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Componente para rastrear cambios de página en Analytics (SPA)
const PageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (window.gtag) {
      window.gtag('config', 'G-W3TTTRY7L8', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  return null;
};

function App() {
  return (
    <BrowserRouter>
      <PageTracker />
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        
        <main style={{ flex: 1 }}>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/cursos" element={<Cursos />} />
            <Route path="/diplomados" element={<Diplomados />} />
            
            {/* Ruta Login y Registro */}
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/verificar-email" element={<VerificarEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Rutas Privadas */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }>
              {/* Rutas compartidas o de Estudiante */}
              <Route index element={<GestorProgramas />} />
              <Route path="seguridad" element={<Seguridad />} />
              <Route path="preferencias" element={<Preferencias />} />

              {/* Rutas exclusivas de Administrador */}
              <Route path="beneficios" element={
                <RoleRoute allowedRoles={['Administrador']}>
                  <GestorBeneficios />
                </RoleRoute>
              } />
              <Route path="facilitadores" element={
                <RoleRoute allowedRoles={['Administrador']}>
                  <GestorFacilitadores />
                </RoleRoute>
              } />
              <Route path="inscripciones" element={
                <RoleRoute allowedRoles={['Administrador']}>
                  <Inscripciones />
                </RoleRoute>
              } />
              <Route path="inscripciones/nueva" element={
                <RoleRoute allowedRoles={['Administrador']}>
                  <NuevaInscripcion />
                </RoleRoute>
              } />
              <Route path="ia-predictiva" element={
                <RoleRoute allowedRoles={['Administrador']}>
                  <IAPredictiva />
                </RoleRoute>
              } />
              <Route path="mailing" element={
                <RoleRoute allowedRoles={['Administrador']}>
                  <Mailing />
                </RoleRoute>
              } />
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
