'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FormNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
}

export function FormNavigation({ 
  currentStep, 
  totalSteps, 
  onPrevious, 
  onNext, 
  canGoNext = true, 
  canGoPrevious = true 
}: FormNavigationProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 pt-6 border-t border-border">
      <Button
        onClick={onPrevious}
        disabled={isFirstStep || !canGoPrevious}
        variant="default"
        size="default"
        className="w-full sm:w-auto !text-slate-900 dark:!text-slate-900"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="text-sm sm:text-base">Previous</span>
      </Button>

      <div className="text-center order-first sm:order-none">
        <span className="text-muted-foreground text-xs sm:text-sm font-medium">
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>

      <Button
        onClick={onNext}
        disabled={isLastStep || !canGoNext}
        variant="default"
        size="default"
        className="w-full sm:w-auto !text-slate-900 dark:!text-slate-900"
      >
        <span className="text-sm sm:text-base">Next</span>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
