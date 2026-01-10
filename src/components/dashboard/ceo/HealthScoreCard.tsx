import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { MODULE_CONFIGS } from '@/types/modules';
import type { HealthScoreData } from '@/types/dashboard';

interface HealthScoreCardProps {
  data: HealthScoreData;
  loading?: boolean;
}

export const HealthScoreCard = ({ data, loading }: HealthScoreCardProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Santé Globale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-full w-32 mx-auto" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 75) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      case 'stable':
        return <Minus className="h-5 w-5 text-gray-600" />;
    }
  };

  const getModuleIcon = (moduleId: number) => {
    const config = MODULE_CONFIGS[moduleId as 1 | 2 | 3 | 4];
    return config?.icon || 'Activity';
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🎯 Santé Globale de l'Entreprise</span>
          {getTrendIcon(data.trend)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Global */}
        <div className="flex flex-col items-center">
          <div
            className={`relative w-32 h-32 rounded-full border-8 flex items-center justify-center ${getScoreBgColor(
              data.overall
            )}`}
          >
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(data.overall)}`}>
                {data.overall}
              </div>
              <div className="text-xs text-muted-foreground">/ 100</div>
            </div>
          </div>
        </div>

        {/* Scores par Module */}
        <div className="space-y-3">
          {Object.entries(data.modules).map(([moduleId, moduleData]) => {
            const config = MODULE_CONFIGS[Number(moduleId) as 1 | 2 | 3 | 4];
            const iconColor = moduleData.alert ? 'text-red-600' : config.color;

            return (
              <div
                key={moduleId}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-md ${
                  moduleData.alert ? 'border-red-200 bg-red-50' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  {moduleData.alert && (
                    <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  )}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: config.accentColor }}
                  >
                    <div className="text-xl" style={{ color: config.color }}>
                      {moduleId === '1' && '📈'}
                      {moduleId === '2' && '😊'}
                      {moduleId === '3' && '💰'}
                      {moduleId === '4' && '🏆'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{config.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {config.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getTrendIcon(moduleData.trend)}
                  <div className={`text-xl font-bold ${getScoreColor(moduleData.score)}`}>
                    {moduleData.score}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Légende */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-4 border-t">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Excellent (&gt;75)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Correct (60-75)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Attention (&lt;60)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
