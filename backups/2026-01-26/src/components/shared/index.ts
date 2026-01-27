/**
 * Shared Components - Composants partagés entre les modules LELE HCM
 */

// Calendrier fiscal
export {
  FiscalCalendarWidget,
  generateFiscalYears,
  getCurrentPeriod,
  formatDateRange,
  getDaysUntil,
} from './FiscalCalendarWidget';

export type {
  FiscalPeriod,
  FiscalYear,
  FiscalCalendarWidgetProps,
} from './FiscalCalendarWidget';

// Pont Calendar ↔ Cost Savings (Mission 3)
export {
  CalendarPeriodSelector,
  useCalendarPeriod,
} from './CalendarPeriodSelector';

export type {
  PeriodSelection,
  WeekWithData,
} from './CalendarPeriodSelector';

export {
  CalendarPerformanceTracker,
} from './CalendarPerformanceTracker';
