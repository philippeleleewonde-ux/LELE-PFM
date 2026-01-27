/**
 * ============================================
 * CalendarEventBus - Bus d'événements pour synchronisation calendrier
 * ============================================
 *
 * Système de notification temps réel entre les composants calendrier
 * de la plateforme LELE HCM.
 *
 * UTILISATION:
 * - Émettre un événement: calendarEventBus.emit({ type: 'CONFIG_UPDATED', payload: config })
 * - S'abonner: const unsubscribe = calendarEventBus.subscribe('CONFIG_UPDATED', callback)
 * - Se désabonner: unsubscribe()
 *
 * @author LELE HCM Platform
 * @version 1.0.0
 */

import type { LaunchConfig, DateProjection, QuarterProjection, WeekProjection } from './LaunchDateService';

// ============================================
// TYPES D'ÉVÉNEMENTS
// ============================================

/**
 * Configuration mise à jour (date de lancement, durée, etc.)
 */
export interface ConfigUpdatedEvent {
  type: 'CONFIG_UPDATED';
  payload: {
    config: LaunchConfig;
    projections: DateProjection[];
    quarters: QuarterProjection[];
  };
}

/**
 * Période verrouillée/déverrouillée
 */
export interface PeriodLockedEvent {
  type: 'PERIOD_LOCKED';
  payload: {
    periodKey: string; // ex: "year_1", "quarter_1_2", "week_1_15"
    isLocked: boolean;
    lockedDate?: Date;
    cascadeMode: boolean;
  };
}

/**
 * Données de coûts enregistrées pour une période
 */
export interface DataEnteredEvent {
  type: 'DATA_ENTERED';
  payload: {
    periodStart: string; // Format: YYYY-MM-DD
    periodEnd: string;   // Format: YYYY-MM-DD
    kpiType: string;     // 'abs', 'qd', 'oa', 'ddp'
    amount: number;
    entryCount: number;
  };
}

/**
 * Période sélectionnée pour saisie de données
 */
export interface PeriodSelectedEvent {
  type: 'PERIOD_SELECTED';
  payload: {
    periodStart: string;
    periodEnd: string;
    yearOffset: number;
    weekNumber?: number;
    monthNumber?: number;
    isLocked: boolean;
  };
}

/**
 * Demande de rafraîchissement des données
 */
export interface RefreshRequestedEvent {
  type: 'REFRESH_REQUESTED';
  payload: {
    source: string; // Composant qui demande le rafraîchissement
    scope: 'all' | 'config' | 'data' | 'locks';
  };
}

/**
 * Union de tous les types d'événements
 */
export type CalendarEvent =
  | ConfigUpdatedEvent
  | PeriodLockedEvent
  | DataEnteredEvent
  | PeriodSelectedEvent
  | RefreshRequestedEvent;

/**
 * Type d'événement (pour filtrage)
 */
export type CalendarEventType = CalendarEvent['type'];

/**
 * Callback de listener
 */
export type CalendarEventCallback<T extends CalendarEvent = CalendarEvent> = (event: T) => void;

// ============================================
// CLASSE EVENT BUS
// ============================================

class CalendarEventBusClass {
  private listeners: Map<CalendarEventType, Set<CalendarEventCallback>>;
  private globalListeners: Set<CalendarEventCallback>;
  private eventHistory: CalendarEvent[];
  private maxHistorySize: number;

  constructor(maxHistorySize = 100) {
    this.listeners = new Map();
    this.globalListeners = new Set();
    this.eventHistory = [];
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * S'abonner à un type d'événement spécifique
   * @returns Fonction de désabonnement
   */
  subscribe<T extends CalendarEventType>(
    type: T,
    callback: CalendarEventCallback<Extract<CalendarEvent, { type: T }>>
  ): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    const typeListeners = this.listeners.get(type)!;
    typeListeners.add(callback as CalendarEventCallback);

    // Retourner la fonction de désabonnement
    return () => {
      typeListeners.delete(callback as CalendarEventCallback);
      if (typeListeners.size === 0) {
        this.listeners.delete(type);
      }
    };
  }

  /**
   * S'abonner à TOUS les événements
   * @returns Fonction de désabonnement
   */
  subscribeAll(callback: CalendarEventCallback): () => void {
    this.globalListeners.add(callback);

    return () => {
      this.globalListeners.delete(callback);
    };
  }

  /**
   * Émettre un événement
   */
  emit(event: CalendarEvent): void {
    // Ajouter à l'historique
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notifier les listeners globaux
    this.globalListeners.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('[CalendarEventBus] Error in global listener:', error);
      }
    });

    // Notifier les listeners spécifiques au type
    const typeListeners = this.listeners.get(event.type);
    if (typeListeners) {
      typeListeners.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error(`[CalendarEventBus] Error in listener for ${event.type}:`, error);
        }
      });
    }
  }

  /**
   * Émettre un événement de configuration mise à jour
   */
  emitConfigUpdate(
    config: LaunchConfig,
    projections: DateProjection[],
    quarters: QuarterProjection[]
  ): void {
    this.emit({
      type: 'CONFIG_UPDATED',
      payload: { config, projections, quarters },
    });
  }

  /**
   * Émettre un événement de verrouillage de période
   */
  emitPeriodLocked(
    periodKey: string,
    isLocked: boolean,
    lockedDate?: Date,
    cascadeMode = true
  ): void {
    this.emit({
      type: 'PERIOD_LOCKED',
      payload: { periodKey, isLocked, lockedDate, cascadeMode },
    });
  }

  /**
   * Émettre un événement de données enregistrées
   */
  emitDataEntered(
    periodStart: string,
    periodEnd: string,
    kpiType: string,
    amount: number,
    entryCount: number
  ): void {
    this.emit({
      type: 'DATA_ENTERED',
      payload: { periodStart, periodEnd, kpiType, amount, entryCount },
    });
  }

  /**
   * Émettre un événement de sélection de période
   */
  emitPeriodSelected(
    periodStart: string,
    periodEnd: string,
    yearOffset: number,
    isLocked: boolean,
    weekNumber?: number,
    monthNumber?: number
  ): void {
    this.emit({
      type: 'PERIOD_SELECTED',
      payload: { periodStart, periodEnd, yearOffset, weekNumber, monthNumber, isLocked },
    });
  }

  /**
   * Émettre une demande de rafraîchissement
   */
  emitRefreshRequest(source: string, scope: 'all' | 'config' | 'data' | 'locks' = 'all'): void {
    this.emit({
      type: 'REFRESH_REQUESTED',
      payload: { source, scope },
    });
  }

  /**
   * Obtenir l'historique des événements
   */
  getHistory(): readonly CalendarEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Obtenir le dernier événement d'un type donné
   */
  getLastEvent<T extends CalendarEventType>(
    type: T
  ): Extract<CalendarEvent, { type: T }> | null {
    for (let i = this.eventHistory.length - 1; i >= 0; i--) {
      if (this.eventHistory[i].type === type) {
        return this.eventHistory[i] as Extract<CalendarEvent, { type: T }>;
      }
    }
    return null;
  }

  /**
   * Vider l'historique
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Supprimer tous les listeners
   */
  clear(): void {
    this.listeners.clear();
    this.globalListeners.clear();
    this.eventHistory = [];
  }

  /**
   * Nombre de listeners actifs
   */
  get listenerCount(): number {
    let count = this.globalListeners.size;
    this.listeners.forEach((set) => {
      count += set.size;
    });
    return count;
  }
}

// ============================================
// INSTANCE SINGLETON
// ============================================

/**
 * Instance singleton du bus d'événements calendrier
 * À utiliser dans toute l'application pour la synchronisation
 */
export const calendarEventBus = new CalendarEventBusClass();

// ============================================
// HOOK REACT
// ============================================

import { useEffect, useCallback, useState } from 'react';

/**
 * Hook React pour s'abonner aux événements du calendrier
 *
 * @example
 * ```tsx
 * // S'abonner à un type spécifique
 * useCalendarEvent('CONFIG_UPDATED', (event) => {
 *   console.log('Config updated:', event.payload.config);
 * });
 *
 * // S'abonner à tous les événements
 * useCalendarEvent('*', (event) => {
 *   console.log('Event:', event.type);
 * });
 * ```
 */
export function useCalendarEvent<T extends CalendarEventType>(
  type: T,
  callback: CalendarEventCallback<Extract<CalendarEvent, { type: T }>>,
  deps: React.DependencyList = []
): void {
  const memoizedCallback = useCallback(callback, deps);

  useEffect(() => {
    const unsubscribe = calendarEventBus.subscribe(type, memoizedCallback);
    return unsubscribe;
  }, [type, memoizedCallback]);
}

/**
 * Hook pour s'abonner à tous les événements du calendrier
 */
export function useAllCalendarEvents(
  callback: CalendarEventCallback,
  deps: React.DependencyList = []
): void {
  const memoizedCallback = useCallback(callback, deps);

  useEffect(() => {
    const unsubscribe = calendarEventBus.subscribeAll(memoizedCallback);
    return unsubscribe;
  }, [memoizedCallback]);
}

/**
 * Hook pour obtenir le dernier événement d'un type
 * Se met à jour automatiquement quand un nouvel événement arrive
 */
export function useLastCalendarEvent<T extends CalendarEventType>(
  type: T
): Extract<CalendarEvent, { type: T }> | null {
  const [lastEvent, setLastEvent] = useState<Extract<CalendarEvent, { type: T }> | null>(
    () => calendarEventBus.getLastEvent(type)
  );

  useEffect(() => {
    const unsubscribe = calendarEventBus.subscribe(type, (event) => {
      setLastEvent(event as Extract<CalendarEvent, { type: T }>);
    });
    return unsubscribe;
  }, [type]);

  return lastEvent;
}

// ============================================
// EXPORT PAR DÉFAUT
// ============================================

export default calendarEventBus;
