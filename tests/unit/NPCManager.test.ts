import { describe, expect, it } from 'vitest';
import { NPCManager } from '../../src/systems/npc/NPCManager';

describe('NPCManager', () => {
  it('consumes fuel between visits, including when a vehicle was full', () => {
    const manager = new NPCManager();
    const vehicle = manager.getRecord('npc_maria')?.vehicle;
    expect(vehicle).toBeDefined();
    if (!vehicle) throw new Error('Test NPC is missing');

    const originalFuelLevel = vehicle.fuelLevel;
    try {
      vehicle.fuelLevel = vehicle.tankCapacity;
      manager.consumeFuelForTravel('npc_maria');

      expect(vehicle.fuelLevel).toBeLessThan(vehicle.tankCapacity);
      expect(vehicle.tankCapacity - vehicle.fuelLevel).toBeGreaterThan(0);

      vehicle.fuelLevel = 1;
      manager.consumeFuelForTravel('npc_maria');
      expect(vehicle.fuelLevel).toBe(0);
    } finally {
      vehicle.fuelLevel = originalFuelLevel;
    }
  });

  it('reports an unknown NPC when consuming travel fuel', () => {
    const manager = new NPCManager();

    expect(() => manager.consumeFuelForTravel('missing')).toThrow('NPC не найден: missing');
  });
});
