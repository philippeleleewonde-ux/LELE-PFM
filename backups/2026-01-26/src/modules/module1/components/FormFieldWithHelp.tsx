'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';

interface FormFieldWithHelpProps {
  label: string;
  helpText?: string;
  required?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
}

/**
 * FormFieldWithHelp Component
 * Form field with optional help tooltip
 */
export function FormFieldWithHelp({
  label,
  helpText,
  required = false,
  children,
  htmlFor,
}: FormFieldWithHelpProps) {
  return (
    <div className="form-field space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={htmlFor} className="form-label m-0">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {helpText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="More information"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-sm">{helpText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {children}
    </div>
  );
}
