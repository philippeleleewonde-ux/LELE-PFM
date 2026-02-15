import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import type { UserRole } from '@/types/roles';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Si défini, seuls ces rôles peuvent accéder à la route */
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole(user?.id);

  // Attendre que l'auth soit résolue
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Non authentifié → login
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Si des rôles sont requis, attendre le chargement du rôle puis vérifier
  if (allowedRoles && allowedRoles.length > 0) {
    if (roleLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Vérification des accès...</p>
          </div>
        </div>
      );
    }

    if (!role || !allowedRoles.includes(role)) {
      // Rôle non autorisé → redirection vers le dashboard par défaut
      return <Navigate to="/profile" replace />;
    }
  }

  return <>{children}</>;
}
