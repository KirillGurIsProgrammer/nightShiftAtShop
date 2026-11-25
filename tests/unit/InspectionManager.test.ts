import { describe, expect, it } from 'vitest';
import { InspectionManager } from '../../src/systems/inspection/InspectionManager';
import type { NPCRecord } from '../../src/entities/NPC';
import type { IdentityDocument } from '../../src/entities/Document';

const npc: NPCRecord = {
  id: 'test', name: 'Тестовый Клиент', age: 40, residence: 'Тестово', profession: 'Тест', personality: 'Normal', appearance: 'Куртка',
  vehicle: { make: 'Volga', model: '3110', color: 'Blue', plate: 'А100АА', fuelType: 'petrol', tankCapacity: 55, fuelLevel: 10 },
  documents: { licenseCategory: 'B', licenseExpiry: '2028-01-01', insuranceExpiry: '2028-01-01' }, preferences: [], schedule: [1], appearanceChance: 1, history: '', storyFeatures: [], behaviorProfile: 'Normal',
};

const documents: IdentityDocument[] = [
  { id: 'l', type: 'license', ownerName: npc.name, plate: npc.vehicle.plate, vehicleModel: 'Volga 3110', licenseCategory: 'B', expiryDate: '2028-01-01', photoMatches: true },
  { id: 'r', type: 'registration', ownerName: npc.name, plate: npc.vehicle.plate, vehicleModel: 'Volga 3110', licenseCategory: 'B', expiryDate: '2028-01-01', photoMatches: true },
  { id: 'i', type: 'insurance', ownerName: npc.name, plate: npc.vehicle.plate, vehicleModel: 'Volga 3110', licenseCategory: 'B', expiryDate: '2028-01-01', photoMatches: true },
];

describe('InspectionManager', () => {
  it('approves fully matching documents', () => {
    const result = new InspectionManager().evaluate(npc, documents, 'approve');
    expect(result.correct).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('detects plate mismatch', () => {
    const mismatch = documents.map((document) => document.type === 'registration' ? { ...document, plate: 'Х000ХХ' } : document);
    const result = new InspectionManager().evaluate(npc, mismatch, 'approve');
    expect(result.issues).toContain('plate');
  });
});
