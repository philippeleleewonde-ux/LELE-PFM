'use client';

import { FormStep } from '@/modules/module1/types';
import { Check } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface StepIndicatorProps {
  steps: FormStep[];
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const btn = btnRefs.current[currentStep];
    if (btn && containerRef.current) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentStep]);

  const resultSteps = steps.filter((s) => s.id >= 7);

  return (
    <div className="space-y-3 mb-8">
      {/* Horizontal, scrollable stepper */}
      <div className="relative">
        <div ref={containerRef} className="overflow-x-auto px-2">
          <div className="flex items-center gap-4 min-w-max py-1">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center snap-start">
                {/* Step Circle */}
                <button
                  ref={(el) => { btnRefs.current[index] = el; }}
                  onClick={() => onStepClick(index)}
                  className={`step-indicator transition-all duration-200 shrink-0 ${
                    step.isCompleted
                      ? 'completed bg-green-600 border-green-600 text-white'
                      : step.isActive
                        ? 'active bg-cfo-accent border-cfo-accent text-white'
                        : 'border-cfo-border text-cfo-muted hover:border-cfo-accent hover:text-cfo-accent'
                  }`}
                  title={step.description}
                  aria-current={step.isActive ? 'step' : undefined}
                >
                  {step.isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </button>

                {/* Step Label */}
                <div className="ml-3 hidden md:block max-w-[360px]">
                  <p className={`text-sm font-medium truncate ${
                    step.isActive ? 'text-cfo-text' : 'text-cfo-muted'
                  }`}>
                    {step.title}
                  </p>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`h-px mx-4 w-12 sm:w-16 md:w-20 ${
                      steps[index + 1].isCompleted || currentStep > index
                        ? 'bg-cfo-accent'
                        : 'bg-cfo-border'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick jump chips (appear once results are available) */}
      {resultSteps.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-2">
          <span className="text-xs text-gray-400">Quick jump:</span>
          {resultSteps.map((s) => {
            const idx = steps.findIndex((x) => x.id === s.id);
            const active = idx === currentStep;
            return (
              <button
                key={`quick-${s.id}`}
                onClick={() => onStepClick(idx)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  active
                    ? 'border-cfo-accent bg-cfo-accent/10 text-cfo-text'
                    : 'border-cfo-border text-cfo-muted hover:border-cfo-accent hover:text-cfo-accent'
                }`}
                title={s.title}
              >
                Step {s.id}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
