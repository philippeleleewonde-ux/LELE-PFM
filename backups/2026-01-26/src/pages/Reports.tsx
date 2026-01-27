import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, TrendingUp, Users, DollarSign } from 'lucide-react';

const Reports = () => {
  const stats = [
    { icon: Users, label: 'Employés actifs', value: '247', change: '+12%' },
    { icon: TrendingUp, label: 'Performance moyenne', value: '87%', change: '+5%' },
    { icon: DollarSign, label: 'Coûts RH', value: '€1.2M', change: '-3%' },
    { icon: FileText, label: 'Rapports générés', value: '156', change: '+18%' },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Rapports & Analyses</h1>
          <p className="text-muted-foreground text-lg">
            Vue d'ensemble de vos données et métriques
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <stat.icon className="w-5 h-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <p className="text-xs text-primary">
                  {stat.change} vs. mois dernier
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reports Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Rapports Disponibles</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'Rapport de Performance',
                description: 'Analyse détaillée des performances par département',
                date: 'Dernière mise à jour: 15 Oct 2025'
              },
              {
                title: 'Analyse Financière',
                description: 'Revue des coûts et budgets RH',
                date: 'Dernière mise à jour: 14 Oct 2025'
              },
              {
                title: 'Rapport de Recrutement',
                description: 'Statistiques et métriques de recrutement',
                date: 'Dernière mise à jour: 12 Oct 2025'
              },
              {
                title: 'Engagement des Employés',
                description: 'Indicateurs de satisfaction et engagement',
                date: 'Dernière mise à jour: 10 Oct 2025'
              }
            ].map((report, index) => (
              <Card key={index} className="border-border bg-card hover:shadow-glow transition-smooth cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="mt-4">{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{report.date}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Reports;