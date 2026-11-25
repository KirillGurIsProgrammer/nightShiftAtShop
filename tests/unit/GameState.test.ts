import { describe, expect, it } from 'vitest';
import { GameState } from '../../src/core/GameState';

describe('GameState', () => {
  it('starts at night one', () => {
    const state = new GameState();
    expect(state.shift.night).toBe(1);
  });

  it('advances shift time using real delta time', () => {
    const state = new GameState();
    const initial = state.shift.shiftMinutes;

    state.advanceTime(100);

    expect(state.shift.shiftMinutes).toBeCloseTo(initial + 35);
  });

  it('updates active activity', () => {
    const state = new GameState();
    state.setActivity('Проверка документов');
    expect(state.shift.activeActivity).toBe('Проверка документов');
  });
});
