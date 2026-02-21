import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Phase {
  id: number;
  label: string;
  description?: string;
}

interface PhaseProgressIndicatorProps {
  phases: Phase[];
  currentPhase: number;
  onPhaseClick?: (phaseIndex: number) => void;
}

export function PhaseProgressIndicator({
  phases,
  currentPhase,
  onPhaseClick,
}: PhaseProgressIndicatorProps) {
  return (
    <div className="w-full px-4 py-6">
      <div className="flex items-start justify-center">
        {phases.map((phase, index) => {
          const isCompleted = index < currentPhase;
          const isCurrent = index === currentPhase;
          const isFuture = index > currentPhase;
          const isClickable = isCompleted && !!onPhaseClick;
          const isLastPhase = index === phases.length - 1;

          return (
            <div
              key={phase.id}
              className="flex items-start flex-1 last:flex-initial"
            >
              {/* Phase circle + label column */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onPhaseClick(index)}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    'text-sm font-semibold transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                    isCompleted && 'bg-blue-600 text-white',
                    isCompleted && isClickable && 'cursor-pointer hover:bg-blue-700',
                    isCompleted && !isClickable && 'cursor-default',
                    isCurrent && 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-500/20',
                    isCurrent && 'cursor-default',
                    isFuture && 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
                    isFuture && 'cursor-default'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`${phase.label}${isCompleted ? ' (terminée)' : isCurrent ? ' (en cours)' : ''}`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <span>{phase.id}</span>
                  )}
                </button>

                <span
                  className={cn(
                    'mt-2 text-xs font-medium text-center max-w-[100px] transition-colors duration-200',
                    (isCompleted || isCurrent) && 'text-blue-600 dark:text-blue-400',
                    isFuture && 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  {phase.label}
                </span>

                {phase.description && (
                  <span className="mt-0.5 text-xs text-slate-400 dark:text-slate-500 text-center max-w-[120px]">
                    {phase.description}
                  </span>
                )}
              </div>

              {/* Connector line */}
              {!isLastPhase && (
                <div className="flex-1 flex items-center pt-5">
                  <div
                    className={cn(
                      'h-0.5 w-full transition-all duration-200',
                      index < currentPhase
                        ? 'bg-blue-600'
                        : 'bg-slate-200 dark:bg-slate-700'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
