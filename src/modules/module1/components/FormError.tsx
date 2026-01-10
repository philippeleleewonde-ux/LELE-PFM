'use client';

import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface FormErrorProps {
  message?: string;
  className?: string;
  onDismiss?: () => void;
}

/**
 * FormError Component
 * Displays validation errors with consistent styling using shadcn/ui Alert
 */
export function FormError({ message, className = '', onDismiss }: FormErrorProps) {
  if (!message) return null;

  return (
    <Alert variant="destructive" className={`flex items-start gap-2 ${className}`}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex-1">{message}</AlertDescription>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="h-6 w-6 p-0 hover:bg-destructive/20"
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  );
}

interface FieldErrorProps {
  error?: string;
  className?: string;
}

/**
 * FieldError Component
 * Displays inline field validation errors
 */
export function FieldError({ error, className = '' }: FieldErrorProps) {
  if (!error) return null;

  return (
    <p className={`error-message ${className}`} role="alert">
      {error}
    </p>
  );
}
