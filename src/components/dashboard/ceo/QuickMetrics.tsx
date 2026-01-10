import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { QuickMetricsData } from '@/types/dashboard';

interface QuickMetricsProps {
  data: QuickMetricsData;
  loading?: boolean;
}

export const QuickMetrics = ({ data, loading }: QuickMetricsProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 Métriques Clés (30 derniers jours)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      key: 'turnover',
      data: data.turnover,
      icon: '📉',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      key: 'engagement',
      data: data.engagement,
      icon: '❤️',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    },
    {
      key: 'costPerEmployee',
      data: data.costPerEmployee,
      icon: '💰',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      key: 'avgPerformance',
      data: data.avgPerformance,
      icon: '🎯',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>📊 Métriques Clés (30 derniers jours)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map(metric => (
            <MetricCard key={metric.key} metric={metric.data} icon={metric.icon} color={metric.color} bgColor={metric.bgColor} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// Metric Card Component
// ============================================================================

interface MetricCardProps {
  metric: {
    label: string;
    value: string | number;
    unit?: string;
    trend: 'up' | 'down' | 'stable';
    change?: string;
    good: boolean;
  };
  icon: string;
  color: string;
  bgColor: string;
}

const MetricCard = ({ metric, icon, color, bgColor }: MetricCardProps) => {
  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up':
        return <TrendingUp className={`h-4 w-4 ${metric.good ? 'text-green-600' : 'text-red-600'}`} />;
      case 'down':
        return <TrendingDown className={`h-4 w-4 ${metric.good ? 'text-green-600' : 'text-red-600'}`} />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    if (metric.trend === 'stable') return 'text-gray-600';
    return metric.good ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${bgColor} border-opacity-50 transition-all hover:shadow-md hover:scale-105`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {getTrendIcon()}
      </div>

      {/* Value */}
      <div className={`text-2xl font-bold ${color} mb-1`}>
        {metric.value}
        {metric.unit && <span className="text-lg ml-1">{metric.unit}</span>}
      </div>

      {/* Label */}
      <div className="text-sm font-medium text-foreground/80 mb-1">{metric.label}</div>

      {/* Change */}
      {metric.change && (
        <div className={`text-xs font-medium ${getTrendColor()}`}>
          {metric.change} vs mois précédent
        </div>
      )}
    </div>
  );
};
