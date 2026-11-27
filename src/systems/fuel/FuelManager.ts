import type { FuelPumpState } from '../../entities/FuelPump';

export interface FuelResult {
  success: boolean;
  liters: number;
  cost: number;
  reason?: 'broken' | 'unavailable' | 'wrong_fuel' | 'no_fuel';
}

export class FuelManager {
  constructor(private readonly pumps: FuelPumpState[]) {}

  getPumps(): FuelPumpState[] { return this.pumps; }

  getPump(id: number): FuelPumpState | undefined { return this.pumps.find((pump) => pump.id === id); }

  selectPumpForFuelType(fuelType: FuelPumpState['fuelType'], seed: number): FuelPumpState {
    const compatiblePumps = this.pumps.filter((pump) =>
      pump.fuelType === fuelType && pump.available && pump.state === 'working' && pump.stock > 0,
    );
    if (compatiblePumps.length === 0) {
      throw new Error(`Нет доступных колонок с топливом типа "${fuelType}"`);
    }

    const index = ((Math.trunc(seed) % compatiblePumps.length) + compatiblePumps.length) % compatiblePumps.length;
    return compatiblePumps[index]!;
  }

  dispense(pumpId: number, vehicleFuelType: 'petrol' | 'diesel', tankCapacity: number, fuelLevel: number, requestedLiters: number): FuelResult {
    const pump = this.getPump(pumpId);
    if (!pump || !pump.available) return { success: false, liters: 0, cost: 0, reason: 'unavailable' };
    if (pump.state === 'broken') return { success: false, liters: 0, cost: 0, reason: 'broken' };
    if (pump.fuelType !== vehicleFuelType) return { success: false, liters: 0, cost: 0, reason: 'wrong_fuel' };
    if (pump.stock <= 0) return { success: false, liters: 0, cost: 0, reason: 'no_fuel' };

    const tankRoom = Math.max(0, tankCapacity - fuelLevel);
    const liters = Math.min(requestedLiters, tankRoom, pump.stock);
    pump.stock -= liters;
    const pricePerLiter = pump.fuelType === 'diesel' ? 58 : 62;
    return { success: liters > 0, liters, cost: Math.round(liters * pricePerLiter) };
  }

  refuel(pumpId: number, liters: number): boolean {
    const pump = this.getPump(pumpId);
    if (!pump) return false;
    pump.stock = Math.min(pump.maxStock, pump.stock + liters);
    return true;
  }
}
