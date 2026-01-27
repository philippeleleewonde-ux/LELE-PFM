import { Building2, TrendingUp, Shield, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBankerCompanies } from '@/hooks/useBankerAccess';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function BankerDashboard() {
  const navigate = useNavigate();
  const { data: clientGrants, isLoading } = useBankerCompanies();

  const uniqueCompanies = clientGrants?.reduce((acc, grant) => {
    const companyId = grant.companies?.id;
    if (companyId && !acc.find(c => c.id === companyId)) {
      acc.push({
        id: companyId,
        name: grant.companies.name,
        industry: grant.companies.industry,
        employees_count: grant.companies.employees_count,
        modules: [grant.module_number],
      });
    } else if (companyId) {
      const company = acc.find(c => c.id === companyId);
      if (company && !company.modules.includes(grant.module_number)) {
        company.modules.push(grant.module_number);
      }
    }
    return acc;
  }, [] as any[]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Portfolio Clients</h1>
        <p className="text-muted-foreground">Gestion et suivi de vos clients entreprises</p>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCompanies?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Entreprises avec accès délégué
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modules Accessibles</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientGrants?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Accès aux modules 1 et 3
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sécurité</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">
              Accès sécurisés et vérifiés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table des clients */}
      <Card>
        <CardHeader>
          <CardTitle>Mes Clients</CardTitle>
          <CardDescription>
            Liste des entreprises dont vous pouvez consulter les rapports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!uniqueCompanies || uniqueCompanies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun client n'a partagé ses rapports avec vous pour le moment.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Secteur</TableHead>
                  <TableHead>Effectif</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uniqueCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.industry}</TableCell>
                    <TableCell>{company.employees_count || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {company.modules.map((mod: number) => (
                          <Badge key={mod} variant="secondary">
                            Module {mod}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/banker/company/${company.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir rapports
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </AppLayout>
  );
}
