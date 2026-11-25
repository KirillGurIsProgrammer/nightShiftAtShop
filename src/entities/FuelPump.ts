export interface FuelPumpState {
  id: number;
  fuelType: 'petrol' | 'diesel';
  stock: number;
  maxStock: number;
  state: 'working' | 'broken';
  available: boolean;
}
