import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Target, DollarSign, Calendar } from 'lucide-react';
import { MODULE_CONFIGS } from '@/types/modules';

export default function Module1Report() {
  const module = MODULE_CONFIGS[1];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absentéisme</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-15%</div>
            <p className="text-xs text-muted-foreground">vs mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Défauts Qualité</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-8%</div>
            <p className="text-xs text-muted-foreground">vs mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Économies Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45 250€</div>
            <p className="text-xs text-muted-foreground">cette année</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Semaine en cours</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Semaine 21</div>
            <p className="text-xs text-muted-foreground">2025</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>5 Indicateurs de Performance</CardTitle>
            <CardDescription>
              Suivi hebdomadaire des indicateurs clés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Absentéisme', value: '2.3%', target: '3%', status: 'success' },
                { name: 'Défauts qualité', value: '1.1%', target: '1.5%', status: 'success' },
                { name: 'Accidents travail', value: '0.2%', target: '0.5%', status: 'success' },
                { name: 'Écart productivité', value: '5.8%', target: '7%', status: 'success' },
                { name: 'Écart savoir-faire', value: '4.2%', target: '5%', status: 'success' }
              ].map((indicator) => (
                <div key={indicator.name} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                  <span className="font-medium">{indicator.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      Cible: {indicator.target}
                    </span>
                    <span className="font-bold text-lg">{indicator.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Planification 3 ans</CardTitle>
            <CardDescription>
              Projection des économies futures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { year: '2025', amount: '45 250€', status: 'En cours' },
                { year: '2026', amount: '52 800€', status: 'Planifié' },
                { year: '2027', amount: '61 200€', status: 'Planifié' }
              ].map((plan) => (
                <div key={plan.year} className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <div className="font-bold text-lg">{plan.year}</div>
                    <div className="text-sm text-muted-foreground">{plan.status}</div>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: module.color }}>
                    {plan.amount}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
