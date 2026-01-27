/**
 * ============================================
 * Fiscal Library - Module de Gestion Fiscale et Temporelle
 * ============================================
 *
 * Ce module fournit les outils pour:
 * 1. Gérer le calendrier fiscal (FiscalCalendarEngine)
 * 2. Partager les métriques entre modules (CalculatedMetricsService)
 *
 * @author LELE HCM Platform
 * @version 1.0.0
 */

// Fiscal Calendar Engine
export {
  FiscalCalendarEngine,
  fiscalCalendar,
} from './FiscalCalendarEngine';

export type {
  PeriodType,
  FiscalPeriod,
  CurrentPeriodInfo,
  FiscalCalendarConfig,
} from './FiscalCalendarEngine';

// Calculated Metrics Service
export {
  CalculatedMetricsService,
  createMetricsService,
} from './CalculatedMetricsService';

export type {
  MetricType,
  Indicator,
  CalculatedMetric,
  PriorityActionDistribution,
  SaveMetricsResult,
} from './CalculatedMetricsService';

// Launch Date Service (NEW - Calendrier Intelligent)
export {
  LaunchDateService,
  launchDateService,
  useLaunchDate,
} from './LaunchDateService';

export type {
  LaunchConfig,
  DateProjection,
  QuarterProjection,
  WeekProjection,
  CountdownInfo,
} from './LaunchDateService';

// Calendar Event Bus (NEW - Synchronisation temps réel)
export {
  calendarEventBus,
  useCalendarEvent,
  useAllCalendarEvents,
  useLastCalendarEvent,
} from './CalendarEventBus';

export type {
  CalendarEvent,
  CalendarEventType,
  CalendarEventCallback,
  ConfigUpdatedEvent,
  PeriodLockedEvent,
  DataEnteredEvent,
  PeriodSelectedEvent,
  RefreshRequestedEvent,
} from './CalendarEventBus';
