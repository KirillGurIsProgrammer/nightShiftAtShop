import { createApp, reactive } from 'vue';
import './style.css';
import { Application } from 'pixi.js';
import { AssetManager } from './rendering/AssetManager';
import { EventBus } from './core/EventBus';
import { GameLoop } from './core/GameLoop';
import { GameState } from './core/GameState';
import { Game } from './core/Game';
import { GasStationScene } from './scenes/GasStationScene';
import { detectBrowserCapabilities } from './platform/BrowserAdapter';
import { FocusController } from './core/FocusController';
import App from './ui/App.vue';
import { createGameUIState } from './ui/MenuState';

const ui = reactive(createGameUIState());
createApp(App, { ui }).mount('#mount');

const rootElement = document.querySelector<HTMLDivElement>('#game-root');
const canvasHost = document.querySelector<HTMLDivElement>('#canvas-host');
if (!rootElement || !canvasHost) throw new Error('Не найдены корневые элементы интерфейса');
const root = rootElement;
const canvasContainer = canvasHost;

const app = new Application();
const events = new EventBus();
const state = new GameState();

async function start(): Promise<void> {
  await new AssetManager().preload();
  const capabilities = detectBrowserCapabilities();

  if (!capabilities.webgl) {
    ui.fatalError = 'Включите аппаратное ускорение и перезапустите приложение.';
    return;
  }

  await app.init({
    width: 960,
    height: 540,
    background: '#10151d',
    antialias: true,
    preference: 'webgl',
  });

  canvasContainer.appendChild(app.canvas);
  app.canvas.setAttribute('aria-label', 'Ночная заправка');

  const scene = new GasStationScene(app, events);
  const game = new Game(state, events, ui);
  await game.load();

  root.dataset.focus = 'world';
  root.classList.remove('computer-focused', 'focus-transitioning');
  ui.noticeboardOpen = false;
  game.closeComputer();

  const focusController = new FocusController(root, (mode) => {
    ui.noticeboardOpen = mode === 'bulletin-board';
    ui.computerFocused = mode === 'computer';
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
    }
  });

  events.on<{ mode: 'computer' | 'noticeboard' | 'bulletin-board' | 'visitor' | 'outside' }>('attention.mode', ({ mode }) => {
    if (mode === 'noticeboard' || mode === 'bulletin-board') void focusController.focus('bulletin-board');
    else if (mode === 'computer') void focusController.focus('computer');
    else void focusController.focus('world');
  });

  events.on<{ text: string; visible: boolean }>('ui.tooltip', ({ text, visible }) => {
    ui.tooltip = text;
    ui.tooltipVisible = visible;
  });

  events.on<{ event: { name: string } }>('game.event', ({ event }) => {
    ui.tooltip = event.name;
    ui.tooltipVisible = true;
    window.setTimeout(() => { ui.tooltipVisible = false; }, 2200);
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
    const hours = Math.floor(state.shift.shiftMinutes / 60) % 24;
    const minutes = Math.floor(state.shift.shiftMinutes % 60);
    ui.hud.night = state.shift.night;
    ui.hud.money = state.shift.money;
    ui.hud.time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    ui.hud.activity = state.shift.activeActivity;
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
  ui.fatalError = 'Браузер не смог инициализировать графику.';
});
