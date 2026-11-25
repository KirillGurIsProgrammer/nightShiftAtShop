export type FocusTarget = 'world' | 'computer' | 'bulletin-board';

export interface FocusState {
  target: FocusTarget;
  isTransitioning: boolean;
}

export class FocusController {
  readonly state: FocusState = { target: 'world', isTransitioning: false };
  private readonly root: HTMLElement;
  private readonly emit: (mode: FocusTarget) => void;

  constructor(root: HTMLElement, emit: (mode: FocusTarget) => void) {
    this.root = root;
    this.emit = emit;
  }

  async focus(target: FocusTarget): Promise<void> {
    if (this.state.isTransitioning || this.state.target === target) return;
    this.state.isTransitioning = true;
    this.root.classList.add('focus-transitioning');

    await new Promise<void>((resolve) => setTimeout(resolve, 180));
    this.state.target = target;
    this.root.dataset.focus = target;
    this.emit(target);

    await new Promise<void>((resolve) => setTimeout(resolve, 220));
    this.root.classList.remove('focus-transitioning');
    this.state.isTransitioning = false;
  }

  returnToWorld(): void {
    void this.focus('world');
  }

  returnToVisitor(): void {
    this.returnToWorld();
  }
}
