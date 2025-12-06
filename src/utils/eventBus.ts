export type EventType = 'error:log' | 'warn:log' | 'info:log';

export interface LogEvent {
  message: string;
  source?: string;
  timestamp: number;
  data?: any;
}

type Listener = (payload: LogEvent) => void;

class TypedEventBus {
  private listeners: Map<EventType, Set<Listener>> = new Map();

  emit(event: EventType, payload: LogEvent): boolean {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(payload));
      return true;
    }
    return false;
  }

  on(event: EventType, listener: Listener): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return this;
  }

  off(event: EventType, listener: Listener): this {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(listener);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
    return this;
  }
}

export const eventBus = new TypedEventBus();
