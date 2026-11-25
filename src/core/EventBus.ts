export type EventHandler<T = unknown> = (payload: T) => void;

export class EventBus {
  private readonly handlers = new Map<string, Set<EventHandler<never>>>();

  on<T>(event: string, handler: EventHandler<T>): () => void {
    const set = (this.handlers.get(event) ?? new Set()) as Set<EventHandler<T>>;
    this.handlers.set(event, set as Set<EventHandler<never>>);
    set.add(handler);
    return () => set.delete(handler);
  }

  emit<T>(event: string, payload: T): void {
    const set = this.handlers.get(event) as Set<EventHandler<T>> | undefined;
    set?.forEach((handler) => handler(payload));
  }

  clear(): void {
    this.handlers.clear();
  }
}
