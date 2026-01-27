import { ReactNode, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { ModuleNumber, ModulePermission, MODULE_CONFIGS } from '@/types/modules';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { HCMLoader } from '@/components/ui/HCMLoader';

interface ModuleAccessProps {
  moduleNumber: ModuleNumber;
  requiredPermissions: ModulePermission[];
  children: ReactNode;
  fallback?: ReactNode;
  redirectOnDenied?: boolean;
}

export function ModuleAccess({
  moduleNumber,
  requiredPermissions,
  children,
  fallback,
  redirectOnDenied = false
}: ModuleAccessProps) {
  const { canRead, canWrite, canAdmin, loading: hookLoading } = useModuleAccess(moduleNumber);
  const moduleConfig = MODULE_CONFIGS[moduleNumber];
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    // Délai minimum réduit à 800ms pour une meilleure UX
    // L'animation est visible mais ne bloque pas l'utilisateur
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const isLoading = hookLoading || showLoader;

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background overflow-hidden">
        <HCMLoader
          text="Vérification des permissions..."
        />
      </div>
    );
  }

  // Check if user has required permissions
  const hasAccess = requiredPermissions.every(permission => {
    switch (permission) {
      case 'read':
        return canRead;
      case 'write':
        return canWrite;
      case 'admin':
        return canAdmin;
      default:
        return false;
    }
  });

  if (!hasAccess) {
    if (redirectOnDenied) {
      return <Navigate to="/dashboard" replace />;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Accès refusé</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Vous n'avez pas les permissions nécessaires pour accéder au module{' '}
              <strong>{moduleConfig.name}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              Contactez votre administrateur si vous pensez que c'est une erreur.
            </p>
            <Button asChild className="w-full">
              <Link to="/dashboard">Retour au tableau de bord</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
