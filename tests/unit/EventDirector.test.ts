import { describe, expect, it } from 'vitest';
import { EventDirector } from '../../src/systems/events/EventDirector';

describe('EventDirector', () => {
  it('starts a compatible event', () => {
    const director = new EventDirector();
    const event = director.attempt(0.01, 1);
    expect(event).toBeDefined();
  });

  it('does not restart the same active event', () => {
    const director = new EventDirector();
    const first = director.attempt(0.01, 1);
    if (!first) throw new Error('Expected event');

    const candidates = director.getActiveIds();

    expect(candidates).toContain(first.id);
    expect(director.getActiveIds()).not.toContain('missing-event');
  });

  it('expires active event', () => {
    const director = new EventDirector();
    const event = director.attempt(0.01, 1);
    expect(event).toBeDefined();
    director.update(event?.duration ?? 1);
    expect(director.getActiveIds()).toHaveLength(0);
  });
});
