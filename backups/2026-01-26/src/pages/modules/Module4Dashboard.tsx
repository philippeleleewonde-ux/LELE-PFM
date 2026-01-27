import { ModuleAccess } from '@/components/ModuleAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Star, TrendingUp, Trophy, Sparkles } from 'lucide-react';
import { MODULE_CONFIGS } from '@/types/modules';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerformanceCardAI } from '@/components/modules/PerformanceCardAI';
import { useAuth } from '@/hooks/useAuth';

export default function Module4Dashboard() {
  const module = MODULE_CONFIGS[4];
  const { user } = useAuth();

  return (
    <ModuleAccess moduleNumber={4} requiredPermissions={['read']}>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div 
              className="p-4 rounded-lg"
              style={{ backgroundColor: module.accentColor }}
            >
              <Award className="h-8 w-8" style={{ color: module.color }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{module.name}</h1>
              <p className="text-muted-foreground">{module.description}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ma Performance</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8.5/10</div>
                <p className="text-xs text-muted-foreground">+0.3 ce mois</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Classement</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">#12</div>
                <p className="text-xs text-muted-foreground">sur 167 employés</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Points Totaux</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2 450</div>
                <p className="text-xs text-muted-foreground">ce trimestre</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progression</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">+15%</div>
                <p className="text-xs text-muted-foreground">vs trimestre dernier</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs avec IA */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="leaderboard">Classement</TabsTrigger>
              <TabsTrigger value="ai-coaching">
                <Sparkles className="w-4 h-4 mr-2" />
                Coaching IA
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Ma Carte de Performance</CardTitle>
                    <CardDescription>Détail de votre évaluation mensuelle</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { criterion: 'Productivité', score: 9.0, max: 10, color: '#10B981' },
                        { criterion: 'Qualité du travail', score: 8.5, max: 10, color: '#3B82F6' },
                        { criterion: 'Collaboration', score: 8.2, max: 10, color: '#8B5CF6' },
                        { criterion: 'Ponctualité', score: 9.5, max: 10, color: '#F59E0B' },
                        { criterion: 'Initiative', score: 7.8, max: 10, color: '#EF4444' }
                      ].map((item) => (
                        <div key={item.criterion} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{item.criterion}</span>
                            <span className="font-bold">{item.score}/{item.max}</span>
                          </div>
                          <div className="h-3 bg-accent rounded-full overflow-hidden">
                            <div 
                              className="h-full transition-all"
                              style={{ 
                                width: `${(item.score / item.max) * 100}%`,
                                backgroundColor: item.color
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Mes Achievements</CardTitle>
                    <CardDescription>Badges et récompenses obtenus</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { title: 'Productif', icon: '💪', unlocked: true },
                        { title: 'Collaboratif', icon: '🤝', unlocked: true },
                        { title: 'Innovateur', icon: '💡', unlocked: true },
                        { title: 'Leader', icon: '👑', unlocked: false },
                        { title: 'Mentor', icon: '🎓', unlocked: false },
                        { title: 'Expert', icon: '🏆', unlocked: false }
                      ].map((achievement) => (
                        <div 
                          key={achievement.title}
                          className={`p-4 rounded-lg border text-center space-y-2 ${
                            achievement.unlocked ? 'bg-accent' : 'opacity-50 grayscale'
                          }`}
                        >
                          <div className="text-3xl">{achievement.icon}</div>
                          <div className="font-medium text-xs">{achievement.title}</div>
                          {achievement.unlocked && (
                            <div className="text-xs text-green-600 font-medium">✓</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="leaderboard" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performers du Mois</CardTitle>
                  <CardDescription>Classement des meilleures performances</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { rank: 1, name: 'Sophie Martin', department: 'Production', score: 9.5, badge: '🥇' },
                      { rank: 2, name: 'Thomas Dubois', department: 'Logistique', score: 9.2, badge: '🥈' },
                      { rank: 3, name: 'Marie Leroy', department: 'Qualité', score: 9.0, badge: '🥉' },
                      { rank: 4, name: 'Pierre Bernard', department: 'Maintenance', score: 8.8, badge: '⭐' },
                      { rank: 5, name: 'Julie Moreau', department: 'Production', score: 8.7, badge: '⭐' }
                    ].map((performer) => (
                      <div key={performer.rank} className="p-4 rounded-lg border hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{performer.badge}</span>
                            <div>
                              <div className="font-medium">{performer.name}</div>
                              <div className="text-sm text-muted-foreground">{performer.department}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg" style={{ color: module.color }}>
                              {performer.score}/10
                            </div>
                            <div className="text-xs text-muted-foreground">
                              #{performer.rank}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai-coaching" className="space-y-6">
              {user?.id && <PerformanceCardAI userId={user.id} />}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ModuleAccess>
  );
}
