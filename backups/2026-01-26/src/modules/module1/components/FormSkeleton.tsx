'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * FormSkeleton Component
 * Loading skeleton for form sections
 */
export function FormSkeleton() {
  return (
    <div className="form-container space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4 mx-auto" />
        <Skeleton className="h-6 w-1/2 mx-auto" />
      </div>

      {/* Form Section Skeleton */}
      <div className="form-section space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="form-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Skeleton */}
      <div className="flex justify-between pt-6 border-t border-border">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

/**
 * FieldSkeleton Component
 * Loading skeleton for individual fields
 */
export function FieldSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </>
  );
}
