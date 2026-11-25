export type GameLoopUpdate = (deltaSeconds: number, elapsedSeconds: number) => void;

export class GameLoop {
  private frameId = 0;
  private previousTime = 0;
  private elapsedSeconds = 0;
  private running = false;

  constructor(private readonly update: GameLoopUpdate) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.previousTime = performance.now();
    this.frameId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frameId);
  }

  private readonly tick = (timestamp: number): void => {
    if (!this.running) return;
    const rawDelta = (timestamp - this.previousTime) / 1000;
    const deltaSeconds = Math.min(Math.max(rawDelta, 0), 0.1);
    this.previousTime = timestamp;
    this.elapsedSeconds += deltaSeconds;
    this.update(deltaSeconds, this.elapsedSeconds);
    this.frameId = requestAnimationFrame(this.tick);
  };
}
