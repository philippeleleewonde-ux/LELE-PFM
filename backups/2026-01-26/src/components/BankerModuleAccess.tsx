import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useBankerAccess } from '@/hooks/useBankerAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BankerModuleAccessProps {
  companyId: string;
  moduleNumber: 1 | 3;
  children: ReactNode;
}

export function BankerModuleAccess({ companyId, moduleNumber, children }: BankerModuleAccessProps) {
  const { user } = useAuth();
  const { role } = useUserRole(user?.id);
  const { hasAccess, isExpired, isLoading } = useBankerAccess(companyId, moduleNumber);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Vérification des accès...</div>
      </div>
    );
  }

  if (role !== 'BANQUIER') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Accès refusé</AlertTitle>
        <AlertDescription>
          Cette section est réservée aux utilisateurs avec le profil Banquier.
        </AlertDescription>
      </Alert>
    );
  }

  if (!hasAccess) {
    return (
      <Card className="border-warning bg-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <AlertCircle className="h-5 w-5" />
            Accès non autorisé
          </CardTitle>
          <CardDescription>
            Cette entreprise ne vous a pas accordé l'accès aux rapports du Module {moduleNumber}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Contactez le dirigeant de l'entreprise pour demander l'accès à ce module.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isExpired) {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Clock className="h-5 w-5" />
            Accès expiré
          </CardTitle>
          <CardDescription>
            Votre accès au Module {moduleNumber} pour cette entreprise a expiré.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Veuillez contacter le dirigeant de l'entreprise pour renouveler votre accès.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
