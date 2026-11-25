import type { GameState } from '../core/GameState';

export class HUD {
  constructor(private readonly element: HTMLElement) {}

  update(state: GameState): void {
    const { night, money, shiftMinutes, activeActivity } = state.shift;
    const hours = Math.floor(shiftMinutes / 60) % 24;
    const minutes = Math.floor(shiftMinutes % 60);
    this.element.innerHTML = `
      <section class="hud-panel">
        <span>НОЧЬ ${night}</span>
        <time>${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}</time>
        <span>${money.toLocaleString('ru-RU')} ₽</span>
      </section>
      <section class="activity-panel">${activeActivity}</section>
    `;
  }
}
