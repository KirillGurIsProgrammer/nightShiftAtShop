export type ComputerApp = 'desktop' | 'database' | 'messenger' | 'cash';

export class ComputerShell {
  readonly element: HTMLElement;

  constructor(private readonly root: HTMLElement, private readonly getState: () => { night: number; money: number; shiftMinutes: number }) {
    this.element = document.createElement('section');
    this.element.className = 'computer-shell';
    this.element.setAttribute('aria-label', 'Компьютер оператора');
    this.close();
    root.appendChild(this.element);
  }

  open(view: ComputerApp = 'desktop'): void {
    this.element.classList.add('open');
    this.element.classList.toggle('focused', view !== 'desktop');
    this.element.setAttribute('data-app', view);
  }

  close(): void {
    this.element.classList.remove('open');
    this.element.classList.remove('focused');
  }

  isOpen(): boolean {
    return this.element.classList.contains('open');
  }

  setContent(title: string, body: string): void {
    this.element.classList.add('open');
    this.element.classList.add('focused');
    this.element.innerHTML = `
      <header class="computer-titlebar">
        <span>${title}</span>
        <nav>
          <button data-app="desktop" title="Рабочий стол">_</button>
          <button data-action="close" title="Свернуть">×</button>
        </nav>
      </header>
      <main class="computer-content">${body}</main>
      <footer class="computer-status"><span>СТАНЦИЯ 04</span><span data-status-time></span><span>ON-LINE</span></footer>`;
    this.element.querySelector('[data-action="close"]')?.addEventListener('click', () => {
      this.close();
      this.root.dispatchEvent(new CustomEvent('attention.mode', { detail: { mode: 'visitor' } }));
    });
    this.element.querySelector('[data-app="desktop"]')?.addEventListener('click', () => this.renderDesktop());
    this.updateStatus();
  }

  renderDesktop(): void {
    this.element.classList.add('open');
    this.element.classList.add('focused');
    const state = this.getState();
    const hours = Math.floor(state.shiftMinutes / 60) % 24;
    const minutes = Math.floor(state.shiftMinutes % 60);
    this.element.innerHTML = `
      <header class="computer-desktop-header">
        <div><strong>STATION OS</strong><span>ЗАПРАВКА №04</span></div>
        <time>${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}</time>
        <button data-action="close-desktop" title="Закрыть компьютер" aria-label="Закрыть компьютер">×</button>
      </header>
      <main class="computer-desktop">
        <aside class="computer-system">
          <b>НОЧЬ ${state.night}</b>
          <span>БАЛАНС</span>
          <strong>${state.money.toLocaleString('ru-RU')} ₽</strong>
          <div class="system-state"><i></i> СИСТЕМА АКТИВНА</div>
          <p>Новый посетитель ожидает обслуживания.</p>
        </aside>
        <section class="computer-icons">
          <button data-app="database"><span class="icon-face">▦</span><b>База данных</b><em>LOCAL_DB</em></button>
          <button data-app="messenger"><span class="icon-face">✉</span><b>Сообщения</b><em>Чат</em></button>
          <button data-app="cash"><span class="icon-face">₽</span><b>Касса</b><em>Операции</em></button>
        </section>
      </main>
      <footer class="computer-status"><span>СТАНЦИЯ 04</span><span data-status-time></span><span>ON-LINE</span></footer>`;

    this.element.querySelectorAll<HTMLButtonElement>('[data-app]').forEach((button) => {
      button.addEventListener('click', () => {
        const app = button.dataset.app;
        if (app) this.root.dispatchEvent(new CustomEvent('computer.app', { detail: { app } }));
      });
    });
    this.element.querySelector('[data-action="close-desktop"]')?.addEventListener('click', () => {
      this.close();
      this.root.dispatchEvent(new CustomEvent('attention.mode', { detail: { mode: 'visitor' } }));
    });
    this.updateStatus();
  }

  private updateStatus(): void {
    const time = this.element.querySelector('[data-status-time]');
    if (!time) return;
    const state = this.getState();
    const hours = Math.floor(state.shiftMinutes / 60) % 24;
    const minutes = Math.floor(state.shiftMinutes % 60);
    time.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
}
