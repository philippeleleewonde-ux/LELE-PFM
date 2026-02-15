import { X, AlertTriangle, TrendingUp, Clock, Info, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLeLeAI } from '../providers/LeLeAIProvider';
import { useNavigate } from 'react-router-dom';
import type { AIMorningHighlight } from '../types/lele-ai.types';

const PRIORITY_ICONS = {
  alert: AlertTriangle,
  positive: TrendingUp,
  pending: Clock,
  info: Info,
};

const PRIORITY_COLORS = {
  critical: 'text-destructive bg-destructive/10 border-destructive/20',
  high: 'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950 dark:border-orange-800',
  medium: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800',
  low: 'text-muted-foreground bg-muted border-border',
};

/**
 * Composant Morning Brief affiché à la connexion.
 * Résumé personnalisé des événements depuis la dernière visite.
 */
export function LeLeAIMorningBrief() {
  const { state, dispatch } = useLeLeAI();
  const navigate = useNavigate();

  const brief = state.morningBrief;

  if (!brief || state.morningBriefDismissed) return null;

  return (
    <Card className="mb-6 border-primary/20 shadow-md animate-in fade-in slide-in-from-top-2 duration-500">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold">{brief.greeting}</h3>
            <p className="text-xs text-muted-foreground">
              Depuis votre dernière visite ({brief.sinceLast})
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 -mt-1 -mr-1"
            onClick={() => dispatch({ type: 'DISMISS_MORNING_BRIEF' })}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Highlights */}
        <div className="space-y-2 mb-3">
          {brief.highlights.map((highlight, i) => (
            <HighlightItem key={i} highlight={highlight} onNavigate={navigate} />
          ))}
        </div>

        {/* Recommendation */}
        {brief.recommendation && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
            <span className="font-medium">Recommandation :</span> {brief.recommendation}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HighlightItem({
  highlight,
  onNavigate,
}: {
  highlight: AIMorningHighlight;
  onNavigate: (path: string) => void;
}) {
  const Icon = PRIORITY_ICONS[highlight.type];
  const colorClass = PRIORITY_COLORS[highlight.priority];

  return (
    <div className={cn('flex items-center gap-3 rounded-lg border px-3 py-2', colorClass)}>
      <Icon className="w-4 h-4 shrink-0" />
      <span className="text-xs flex-1">{highlight.text}</span>
      {highlight.actionRoute && (
        <button
          onClick={() => onNavigate(highlight.actionRoute!)}
          className="flex items-center gap-0.5 text-xs font-medium hover:underline shrink-0"
        >
          {highlight.action ?? 'Voir'}
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
