export interface GameEventDefinition {
  id: string;
  name: string;
  category: 'atmospheric' | 'technical' | 'social' | 'mystery' | 'critical';
  probability: number;
  cooldown: number;
  duration: number;
  incompatible?: string[];
}

export class EventDirector {
  private readonly events: GameEventDefinition[] = [
    { id: 'light_flicker', name: 'Моргание света', category: 'atmospheric', probability: 0.45, cooldown: 120, duration: 8 },
    { id: 'camera_noise', name: 'Помехи камеры', category: 'technical', probability: 0.30, cooldown: 180, duration: 20, incompatible: ['power_outage'] },
    { id: 'phone_ring', name: 'Телефонный звонок', category: 'social', probability: 0.35, cooldown: 240, duration: 30 },
    { id: 'power_outage', name: 'Отключение электричества', category: 'technical', probability: 0.12, cooldown: 360, duration: 45, incompatible: ['camera_noise'] },
  ];
  private readonly active = new Map<string, number>();
  private readonly cooldowns = new Map<string, number>();

  update(deltaSeconds: number): string[] {
    const expired: string[] = [];
    this.active.forEach((remaining, id) => {
      const next = remaining - deltaSeconds;
      if (next <= 0) { this.active.delete(id); expired.push(id); }
      else this.active.set(id, next);
    });
    this.cooldowns.forEach((remaining, id) => {
      if (remaining <= deltaSeconds) this.cooldowns.delete(id);
      else this.cooldowns.set(id, remaining - deltaSeconds);
    });
    return expired;
  }

  attempt(randomValue: number, anomalyLevel: number): GameEventDefinition | undefined {
    const candidates = this.events.filter((event) => {
      if (this.cooldowns.has(event.id) || this.active.has(event.id)) return false;
      return !event.incompatible?.some((id) => this.active.has(id));
    });
    const adjusted = candidates.find((event) => randomValue < Math.min(0.9, event.probability * (1 + anomalyLevel * 0.15)));
    if (!adjusted) return undefined;
    this.active.set(adjusted.id, adjusted.duration);
    this.cooldowns.set(adjusted.id, adjusted.cooldown);
    return adjusted;
  }

  getActiveIds(): string[] { return [...this.active.keys()]; }
}
