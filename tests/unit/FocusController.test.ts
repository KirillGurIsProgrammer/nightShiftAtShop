import { describe, expect, it, vi } from 'vitest';
import { FocusController } from '../../src/core/FocusController';

function fakeRoot(): HTMLElement {
  return {
    classList: { add: vi.fn(), remove: vi.fn() },
    dataset: {},
  } as unknown as HTMLElement;
}

describe('FocusController', () => {
  it('starts in world mode and switches to computer', async () => {
    const root = fakeRoot();
    const emit = vi.fn();
    const controller = new FocusController(root, emit);

    expect(controller.state.target).toBe('world');
    await controller.focus('computer');

    expect(controller.state.target).toBe('computer');
    expect(root.dataset.focus).toBe('computer');
    expect(emit).toHaveBeenCalledWith('computer');
  });

  it('returns to world independently of a computer or board view', async () => {
    const root = fakeRoot();
    const emit = vi.fn();
    const controller = new FocusController(root, emit);

    await controller.focus('computer');
    await controller.focus('world');

    expect(controller.state.target).toBe('world');
    expect(root.dataset.focus).toBe('world');
    expect(emit).toHaveBeenLastCalledWith('world');
  });

  it('does not switch while a transition is active', () => {
    const root = fakeRoot();
    const controller = new FocusController(root, vi.fn());
    void controller.focus('bulletin-board');

    void controller.focus('computer');

    expect(controller.state.isTransitioning).toBe(true);
  });
});
