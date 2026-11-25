import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '../../src/core/EventBus';

describe('EventBus', () => {
  it('delivers typed payloads to subscribers', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on<{ panel: string }>('ui.open', handler);

    bus.emit('ui.open', { panel: 'computer' });

    expect(handler).toHaveBeenCalledWith({ panel: 'computer' });
  });

  it('supports unsubscribing', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    const unsubscribe = bus.on('test', handler);

    unsubscribe();
    bus.emit('test', {});

    expect(handler).not.toHaveBeenCalled();
  });

  it('clear removes all listeners', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('test', handler);

    bus.clear();
    bus.emit('test', {});

    expect(handler).not.toHaveBeenCalled();
  });
});
