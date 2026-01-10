import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, CheckCircle } from 'lucide-react';
import { MODULE_CONFIGS } from '@/types/modules';

export default function Module3Report() {
  const module = MODULE_CONFIGS[3];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cette semaine</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2 150€</div>
            <p className="text-xs text-muted-foreground">économies réalisées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ce mois</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8 620€</div>
            <p className="text-xs text-muted-foreground">+12% vs mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cette année</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45 250€</div>
            <p className="text-xs text-muted-foreground">objectif: 60 000€</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Équipes actives</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">sur 12 équipes</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performances par Équipe</CardTitle>
            <CardDescription>
              Classement des équipes cette semaine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { team: 'Équipe Production A', leader: 'Jean Martin', savings: 580, trend: '+15%' },
                { team: 'Équipe Logistique', leader: 'Marie Dubois', savings: 420, trend: '+8%' },
                { team: 'Équipe Maintenance', leader: 'Pierre Leroy', savings: 380, trend: '+12%' },
                { team: 'Équipe Production B', leader: 'Sophie Bernard', savings: 350, trend: '+5%' }
              ].map((team, index) => (
                <div key={team.team} className="p-4 rounded-lg border space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
                        style={{ backgroundColor: module.color }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{team.team}</div>
                        <div className="text-sm text-muted-foreground">{team.leader}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{team.savings}€</div>
                      <div className="text-sm text-green-600">{team.trend}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analyses des Économies</CardTitle>
            <CardDescription>
              Répartition par source d'économie
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { source: 'Réduction gaspillage', amount: 950, percentage: 44 },
                { source: 'Optimisation process', amount: 620, percentage: 29 },
                { source: 'Amélioration qualité', amount: 380, percentage: 18 },
                { source: 'Réduction temps arrêt', amount: 200, percentage: 9 }
              ].map((item) => (
                <div key={item.source} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.source}</span>
                    <span className="text-muted-foreground">{item.amount}€ ({item.percentage}%)</span>
                  </div>
                  <div className="h-3 bg-accent rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: module.color 
                      }}
                    />
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
