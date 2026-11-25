export interface ShiftState {
  night: number;
  money: number;
  shiftMinutes: number;
  activeActivity: string;
}

export class GameState {
  readonly shift: ShiftState = {
    night: 1,
    money: 0,
    shiftMinutes: 22 * 60 + 0,
    activeActivity: 'Ожидание посетителя',
  };

  advanceTime(realDeltaSeconds: number): void {
    this.shift.shiftMinutes += realDeltaSeconds * 0.35;
  }

  setActivity(activity: string): void {
    this.shift.activeActivity = activity;
  }
}
