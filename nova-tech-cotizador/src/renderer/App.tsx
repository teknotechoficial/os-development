import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store/auth';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewQuote from './pages/NewQuote';
import QuoteHistory from './pages/QuoteHistory';
import QuoteDetail from './pages/QuoteDetail';
import TeamManager from './pages/TeamManager';
import DeveloperWorkspace from './pages/DeveloperWorkspace';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Services from './pages/Services';
import Reports from './pages/Reports';
import SetupCredentials from './pages/SetupCredentials';
import Recover from './pages/Recover';

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route path="/setup" element={<SetupCredentials />} />
        <Route path="/recover" element={<Recover />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/nueva-cotizacion" element={<NewQuote />} />
          <Route path="/cotizaciones" element={<QuoteHistory mode="active" />} />
          <Route path="/historial" element={<QuoteHistory mode="archived" />} />
          <Route path="/servicios" element={<Services />} />
          <Route path="/reportes" element={<Reports />} />
          <Route path="/cotizacion/:id" element={<QuoteDetail />} />
          <Route path="/mi-trabajo" element={<DeveloperWorkspace />} />
          <Route path="/notificaciones" element={<Notifications />} />
          <Route
            path="/equipo"
            element={
              <ProtectedRoute roles={['gerente', 'super_admin']}>
                <TeamManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracion"
            element={
              <ProtectedRoute roles={['super_admin']}>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
