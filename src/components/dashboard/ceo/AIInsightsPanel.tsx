import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Sparkles, Info, X } from 'lucide-react';
import { useState } from 'react';
import type { AIInsight } from '@/types/dashboard';

interface AIInsightsPanelProps {
  insights: AIInsight[];
  onDismiss?: (insightId: string) => void;
  onActionClick?: (insightId: string, actionId: string) => void;
  loading?: boolean;
}

export const AIInsightsPanel = ({
  insights,
  onDismiss,
  onActionClick,
  loading
}: AIInsightsPanelProps) => {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const handleDismiss = (insightId: string) => {
    setDismissedIds(prev => new Set(prev).add(insightId));
    onDismiss?.(insightId);
  };

  const visibleInsights = insights.filter(insight => !dismissedIds.has(insight.id));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🤖 LELE IA - Insights Automatiques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (visibleInsights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🤖 LELE IA - Insights Automatiques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun insight détecté pour le moment.</p>
            <p className="text-sm mt-2">L'IA surveille vos données en temps réel.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          🤖 LELE IA - Insights Automatiques
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {visibleInsights.map(insight => (
          <AIInsightCard
            key={insight.id}
            insight={insight}
            onDismiss={() => handleDismiss(insight.id)}
            onActionClick={actionId => onActionClick?.(insight.id, actionId)}
          />
        ))}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// AI Insight Card Component
// ============================================================================

interface AIInsightCardProps {
  insight: AIInsight;
  onDismiss: () => void;
  onActionClick: (actionId: string) => void;
}

const AIInsightCard = ({ insight, onDismiss, onActionClick }: AIInsightCardProps) => {
  const getInsightIcon = () => {
    switch (insight.type) {
      case 'alert':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'opportunity':
        return <Sparkles className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getInsightBorderColor = () => {
    switch (insight.type) {
      case 'alert':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50';
      case 'opportunity':
        return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/50';
      case 'info':
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50';
    }
  };

  const getPriorityBadge = () => {
    const colors = {
      high: 'bg-red-100 text-red-700 border-red-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-gray-100 text-gray-700 border-gray-200'
    };

    const labels = {
      high: 'Urgent',
      medium: 'Important',
      low: 'À noter'
    };

    return (
      <span
        className={`text-xs px-2 py-1 rounded-full border ${colors[insight.priority]}`}
      >
        {labels[insight.priority]}
      </span>
    );
  };

  return (
    <div
      className={`relative border-2 rounded-lg p-4 transition-all hover:shadow-md ${getInsightBorderColor()}`}
    >
      {/* Dismiss Button */}
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/50 transition-colors"
        aria-label="Ignorer"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 mt-0.5">{getInsightIcon()}</div>
        <div className="flex-1 pr-6">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm">{insight.title}</h4>
            {getPriorityBadge()}
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {insight.description}
          </p>
        </div>
      </div>

      {/* Recommendation */}
      <div className="ml-8 mb-3 p-3 bg-background/50 rounded-lg border">
        <p className="text-xs font-medium text-muted-foreground mb-1">
          💡 Recommandation
        </p>
        <p className="text-sm">{insight.recommendation}</p>
      </div>

      {/* Actions */}
      {insight.actions.length > 0 && (
        <div className="ml-8 flex flex-wrap gap-2">
          {insight.actions.map(action => (
            <Button
              key={action.action}
              onClick={() => onActionClick(action.action)}
              variant={action.type === 'primary' ? 'default' : 'outline'}
              size="sm"
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* Module Link (if any) */}
      {insight.moduleId && (
        <div className="ml-8 mt-2">
          <a
            href={`/modules/module${insight.moduleId}`}
            className="text-xs text-primary hover:underline"
          >
            → Voir Module {insight.moduleId}
          </a>
        </div>
      )}
    </div>
  );
};
