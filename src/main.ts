import './style.css';
import { Application } from 'pixi.js';
import { AssetManager } from './rendering/AssetManager';
import { EventBus } from './core/EventBus';
import { GameLoop } from './core/GameLoop';
import { GameState } from './core/GameState';
import { Game } from './core/Game';
import { GasStationScene } from './scenes/GasStationScene';
import { HUD } from './ui/HUD';
import { detectBrowserCapabilities } from './platform/BrowserAdapter';
import { FocusController } from './core/FocusController';

const rootElement = document.querySelector<HTMLDivElement>('#game-root');
const hudElement = document.querySelector<HTMLDivElement>('#hud');
if (!rootElement || !hudElement) throw new Error('Не найдены корневые элементы интерфейса');
const root = rootElement;

const app = new Application();
const events = new EventBus();
const state = new GameState();
const hud = new HUD(hudElement);

async function start(): Promise<void> {
  await new AssetManager().preload();
  const capabilities = detectBrowserCapabilities();

  if (!capabilities.webgl) {
    root.replaceChildren();
    root.insertAdjacentHTML('beforeend', '<div class="fatal-error"><h1>WebGL недоступен</h1><p>Включите аппаратное ускорение и перезапустите браузер.</p></div>');
    return;
  }

  await app.init({
    width: 960,
    height: 540,
    background: '#10151d',
    antialias: true,
    preference: 'webgl',
  });

  root.appendChild(app.canvas);
  app.canvas.setAttribute('aria-label', 'Ночная заправка');

  const scene = new GasStationScene(app, events);
  const game = new Game(state, events, root);
  await game.load();

  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  root.appendChild(tooltip);

  events.on<{ text: string; visible: boolean }>('ui.tooltip', ({ text, visible }) => {
    tooltip.textContent = text;
    tooltip.classList.toggle('visible', visible);
  });

  events.on<{ event: { name: string } }>('game.event', ({ event }) => {
    tooltip.textContent = event.name;
    tooltip.classList.add('visible');
    window.setTimeout(() => tooltip.classList.remove('visible'), 2200);
  });

  const saveButton = document.createElement('button');
  saveButton.className = 'save-button';
  saveButton.textContent = 'Сохранить';
  saveButton.addEventListener('click', () => {
    void game.save();
    saveButton.textContent = 'Сохранено';
    window.setTimeout(() => { saveButton.textContent = 'Сохранить'; }, 1300);
  });
  root.appendChild(saveButton);

  const noticeboard = document.createElement('section');
  noticeboard.className = 'noticeboard-overlay';
  noticeboard.innerHTML = `
    <header><strong>ОБЪЯВЛЕНИЯ ДЛЯ НОЧНОГО ОПЕРАТОРА</strong><button data-action="visitor">Вернуться к посетителю</button></header>
    <article><b>ИНСТРУКЦИЯ №1</b><p>Сверяйте регистрационный номер с документами и данными базы.</p></article>
    <article><b>ИНСТРУКЦИЯ №2</b><p>Несовпадающие данные требуют дополнительного опроса.</p></article>
    <article><b>ПРЕДУПРЕЖДЕНИЕ</b><p>Не передавайте информацию о посетителях по личным каналам связи.</p></article>
    <article><b>НОВОЕ УКАЗАНИЕ</b><p>Повторный визит добавляется в историю и учитывается при решении.</p></article>`;
  root.appendChild(noticeboard);
  noticeboard.querySelector('[data-action="visitor"]')?.addEventListener('click', () => {
    events.emit('attention.mode', { mode: 'visitor' });
  });

  const backdrop = document.createElement('div');
  backdrop.className = 'focus-backdrop';
  root.appendChild(backdrop);

  root.dataset.focus = 'world';
  root.classList.remove('computer-focused', 'focus-transitioning');
  noticeboard.classList.remove('open');
  game.closeComputer();

  const focusController = new FocusController(root, (mode) => {
    noticeboard.classList.toggle('open', mode === 'bulletin-board');
    root.classList.toggle('computer-focused', mode === 'computer');
    if (mode === 'bulletin-board') {
      game.closeComputer();
      state.setActivity('Изучение инструкций');
    } else if (mode === 'computer') {
      state.setActivity('Работа за компьютером');
      game.openComputer();
    } else {
      game.closeComputer();
      state.setActivity('В основной игровой сцене');
      // Returning to the world is only a mode transition. It must not create or start dialogue.
    }
  });

  events.on<{ mode: 'computer' | 'noticeboard' | 'bulletin-board' | 'visitor' }>('attention.mode', ({ mode }) => {
    if (mode === 'noticeboard' || mode === 'bulletin-board') void focusController.focus('bulletin-board');
    else if (mode === 'computer') void focusController.focus('computer');
    else void focusController.focus('world');
  });

  root.addEventListener('attention.mode', (event) => {
    const mode = (event as CustomEvent<{ mode: 'computer' | 'noticeboard' | 'bulletin-board' | 'visitor' }>).detail.mode;
    if (mode === 'noticeboard' || mode === 'bulletin-board') void focusController.focus('bulletin-board');
    else if (mode === 'computer') void focusController.focus('computer');
    else void focusController.focus('world');
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      game.closeComputer();
      focusController.returnToWorld();
    }
  });

  let autoSaveElapsed = 0;
  let visitorArrivalElapsed = 0;
  const loop = new GameLoop((deltaSeconds) => {
    state.advanceTime(deltaSeconds);
    scene.update(deltaSeconds);
    game.update(deltaSeconds);
    visitorArrivalElapsed += deltaSeconds;
    if (visitorArrivalElapsed >= 8) {
      scene.setVisitorVisible(true);
      visitorArrivalElapsed = 8;
    }
    hud.update(state);
    autoSaveElapsed += deltaSeconds;
    if (autoSaveElapsed >= 30) {
      autoSaveElapsed = 0;
      void game.save();
    }
  });
  loop.start();

  events.on<{ npcId: string }>('visitor.interact', () => {
    if (focusController.state.target === 'world') {
      game.startDialogue();
    }
  });
}

start().catch((error: unknown) => {
  console.error(error);
  root.replaceChildren();
  root.insertAdjacentHTML('beforeend', '<div class="fatal-error"><h1>Не удалось запустить игру</h1><p>Браузер не смог инициализировать графику.</p></div>');
});
