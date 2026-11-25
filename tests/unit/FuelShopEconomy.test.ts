import { describe, expect, it } from 'vitest';
import { FuelManager } from '../../src/systems/fuel/FuelManager';
import { ShopManager } from '../../src/systems/shop/ShopManager';
import { EconomyManager } from '../../src/systems/economy/EconomyManager';

describe('service systems', () => {
  it('calculates compatible fuel cost', () => {
    const fuel = new FuelManager([{ id: 1, fuelType: 'petrol', stock: 100, maxStock: 100, state: 'working', available: true }]);
    const result = fuel.dispense(1, 'petrol', 55, 10, 20);
    expect(result.success).toBe(true);
    expect(result.liters).toBe(20);
    expect(result.cost).toBe(1240);
  });

  it('rejects incompatible fuel', () => {
    const fuel = new FuelManager([{ id: 1, fuelType: 'diesel', stock: 100, maxStock: 100, state: 'working', available: true }]);
    const result = fuel.dispense(1, 'petrol', 55, 10, 20);
    expect(result.reason).toBe('wrong_fuel');
  });

  it('sells item and updates inventory', () => {
    const shop = new ShopManager([{ id: 'water', name: 'Вода', category: 'drink', purchasePrice: 20, salePrice: 55, stock: 2, maxStock: 10, description: '' }]);
    expect(shop.sell('water').cost).toBe(55);
    expect(shop.getItems()[0]?.stock).toBe(1);
  });

  it('updates economy balance', () => {
    const economy = new EconomyManager();
    economy.addRevenue(500);
    economy.addExpense('repairs', 100);
    expect(economy.record.balance).toBe(2900);
  });
});
