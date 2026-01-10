import { useState, useEffect, useRef } from 'react';

/**
 * Hook to ensure a minimum loading time for better UX
 * Prevents loader from disappearing too quickly before user can see the HCM logo
 *
 * @param isDataLoading - The actual loading state from data fetching
 * @param minimumMs - Minimum time to show the loader (default: 800ms)
 * @returns boolean - Combined loading state that respects minimum display time
 *
 * Usage:
 * ```tsx
 * const [dataLoading, setDataLoading] = useState(true);
 * const showLoader = useMinimumLoading(dataLoading, 800);
 *
 * if (showLoader) {
 *   return <HCMLoader text="Chargement..." />;
 * }
 * ```
 */
export function useMinimumLoading(isDataLoading: boolean, minimumMs: number = 800): boolean {
  const [minimumTimePassed, setMinimumTimePassed] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Reset timer when loading starts
    if (isDataLoading) {
      startTimeRef.current = Date.now();
      setMinimumTimePassed(false);
    }
  }, [isDataLoading]);

  useEffect(() => {
    // Start minimum timer on mount
    const timer = setTimeout(() => {
      setMinimumTimePassed(true);
    }, minimumMs);

    return () => clearTimeout(timer);
  }, [minimumMs]);

  // Show loader if data is still loading OR minimum time hasn't passed
  return isDataLoading || !minimumTimePassed;
}

export default useMinimumLoading;
