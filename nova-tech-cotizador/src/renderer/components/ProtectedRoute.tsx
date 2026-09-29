import React from 'react';
import { Link, Navigate, Outlet } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../store/auth';
import { Button } from './ui';

export interface ProtectedRouteProps {
  roles?: string[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roles, children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (roles && roles.length > 0 && (!user || !roles.includes(user.role))) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-12 h-12 rounded-full bg-[#10233E] border border-[#1C3557] flex items-center justify-center mb-4">
          <Lock className="h-6 w-6 text-[#5B7295]" />
        </div>
        <h1 className="font-display text-xl font-bold uppercase tracking-[0.08em] text-white">
          Acceso Restringido
        </h1>
        <p className="text-sm text-[#8FA6C4] mt-2 max-w-md">
          Tu rol no tiene permisos para ver esta sección. Si crees que esto es un error, contacta al
          administrador del sistema.
        </p>
        <div className="mt-6">
          <Link to="/dashboard">
            <Button variant="secondary">Volver al Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children ?? <Outlet />}</>;
};

export default ProtectedRoute;
