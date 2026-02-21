import { useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLeLeAI } from '../providers/LeLeAIProvider';
import { fetchContextInsight } from '../services/ai-orchestrator';
import type { AIKeyMetric } from '../types/lele-ai.types';

interface LeLeAIContextBarProps {
  moduleId: string;
  companyId?: string;
}

const TREND_ICONS = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const TREND_COLORS = {
  up: 'text-green-600 dark:text-green-400',
  down: 'text-red-600 dark:text-red-400',
  stable: 'text-muted-foreground',
};

/**
 * Barre contextuelle d'insight IA affichée en haut de chaque module.
 * Affiche un résumé narratif + métriques clés.
 */
export function LeLeAIContextBar({ moduleId, companyId }: LeLeAIContextBarProps) {
  const { state, dispatch, userRole, pageContext } = useLeLeAI();
  const insight = state.contextInsight;

  // Charger l'insight pour ce module
  useEffect(() => {
    if (!userRole || !companyId) return;

    let cancelled = false;

    async function loadInsight() {
      const result = await fetchContextInsight({
        companyId: companyId!,
        role: userRole!,
        moduleId,
        language: state.language,
      });
      if (!cancelled && result) {
        dispatch({ type: 'SET_CONTEXT_INSIGHT', payload: result });
      }
    }

    loadInsight();
    return () => { cancelled = true; };
  }, [moduleId, companyId, userRole]);

  if (!insight || insight.moduleId !== moduleId) return null;

  const TrendIcon = TREND_ICONS[insight.trend];

  return (
    <div className="mb-4 rounded-lg border border-primary/10 bg-primary/5 px-4 py-3 animate-in fade-in duration-300">
      <div className="flex items-start gap-3">
        {/* Icon IA */}
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Narration */}
          <p className="text-sm leading-relaxed">{insight.summary}</p>

          {/* Métriques clés */}
          {insight.keyMetrics.length > 0 && (
            <div className="flex flex-wrap gap-4 mt-2">
              {insight.keyMetrics.map((metric, i) => (
                <MetricChip key={i} metric={metric} />
              ))}
            </div>
          )}
        </div>

        {/* Tendance globale */}
        <TrendIcon className={cn('w-5 h-5 shrink-0', TREND_COLORS[insight.trend])} />
      </div>
    </div>
  );
}

function MetricChip({ metric }: { metric: AIKeyMetric }) {
  const direction = metric.direction ?? 'stable';
  const TrendIcon = TREND_ICONS[direction];

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-muted-foreground">{metric.label} :</span>
      <span className="font-semibold">{metric.value}</span>
      {metric.change && (
        <span className={cn('flex items-center gap-0.5', TREND_COLORS[direction])}>
          <TrendIcon className="w-3 h-3" />
          {metric.change}
        </span>
      )}
    </div>
  );
}
