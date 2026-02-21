/**
 * Calendar Event Bus
 * Pub/Sub pattern for application-wide events
 */

export type EventType =
  | 'TransactionCreated'
  | 'TransactionUpdated'
  | 'TransactionDeleted'
  | 'WeekLocked'
  | 'WeekUnlocked'
  | 'PerformanceRecalculated'
  | 'SyncCompleted'
  | 'SyncFailed'
  | 'WaterfallUpdated';

type Listener = (payload: unknown) => void;

export class CalendarEventBus {
  private static listeners: Map<EventType, Set<Listener>> = new Map();

  /**
   * Subscribe to an event
   * @param event Event type to listen for
   * @param callback Function to call when event is emitted
   * @returns Unsubscribe function
   */
  static on(event: EventType, callback: Listener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Emit an event to all subscribers
   * @param event Event type to emit
   * @param payload Data to pass to listeners
   */
  static emit(event: EventType, payload: unknown): void {
    if (!this.listeners.has(event)) {
      return;
    }

    this.listeners.get(event)!.forEach((callback) => {
      try {
        callback(payload);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Unsubscribe from an event
   * @param event Event type to unsubscribe from
   * @param callback Function to remove
   */
  static off(event: EventType, callback: Listener): void {
    if (!this.listeners.has(event)) {
      return;
    }

    this.listeners.get(event)!.delete(callback);

    // Clean up empty sets
    if (this.listeners.get(event)!.size === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * Clear all listeners for a specific event or all events
   * @param event Optional event type to clear. If not provided, clears all events
   */
  static clear(event?: EventType): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get listener count for an event
   * @param event Event type to check
   * @returns Number of listeners
   */
  static getListenerCount(event: EventType): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
