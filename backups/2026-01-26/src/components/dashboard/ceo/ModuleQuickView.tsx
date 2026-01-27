import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, ArrowRight, AlertTriangle, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MODULE_CONFIGS } from '@/types/modules';
import type { ModulePreviewData } from '@/types/dashboard';

interface ModuleQuickViewProps {
  data: ModulePreviewData;
  disabled?: boolean; // Si CEO n'a pas accès (ex: Module 2)
  loading?: boolean;
}

export const ModuleQuickView = ({ data, disabled = false, loading }: ModuleQuickViewProps) => {
  const navigate = useNavigate();
  const config = MODULE_CONFIGS[data.moduleId];

  const handleClick = () => {
    if (!disabled) {
      navigate(config.route);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-12 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
            <div className="h-6 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`transition-all ${
        disabled
          ? 'opacity-60 cursor-not-allowed'
          : 'cursor-pointer hover:shadow-lg hover:scale-[1.02]'
      } ${data.alert ? 'ring-2 ring-red-300' : ''}`}
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        {/* Header avec icône */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: config.accentColor }}
          >
            <div className="text-2xl">
              {data.moduleId === 1 && '📈'}
              {data.moduleId === 2 && '😊'}
              {data.moduleId === 3 && '💰'}
              {data.moduleId === 4 && '🏆'}
            </div>
          </div>
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {config.name}
              {disabled && <Lock className="h-4 w-4 text-muted-foreground" />}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Score + Trend */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`text-3xl font-bold ${getScoreColor(data.score)}`}>
              {data.score}
            </div>
            <div className="text-muted-foreground">/100</div>
          </div>
          {getTrendIcon(data.trend)}
        </div>

        {/* Alerte si problème */}
        {data.alert && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <p className="text-xs text-red-700">Attention requise</p>
          </div>
        )}

        {/* Métrique clé */}
        {data.keyMetric && (
          <div className="mb-3 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">{data.keyMetric.label}</p>
            <p className="text-lg font-semibold">{data.keyMetric.value}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{data.lastUpdate}</span>
          {!disabled ? (
            <Button variant="link" size="sm" className="p-0 h-auto">
              Voir détails <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          ) : (
            <span className="text-xs">Accès restreint</span>
          )}
        </div>

        {/* Message si Module 2 (Satisfaction) et CEO */}
        {disabled && data.moduleId === 2 && (
          <div className="mt-3 text-xs text-muted-foreground text-center p-2 bg-muted/30 rounded">
            Contactez le RH Manager pour détails
          </div>
        )}
      </CardContent>
    </Card>
  );
};
