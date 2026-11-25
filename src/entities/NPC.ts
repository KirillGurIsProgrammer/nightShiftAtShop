export type BehaviorProfile = 'Normal' | 'Friendly' | 'Nervous' | 'Aggressive' | 'Suspicious' | 'Unusual';

export interface NPCRecord {
  id: string;
  name: string;
  age: number;
  residence: string;
  profession: string;
  personality: string;
  appearance: string;
  vehicle: { make: string; model: string; color: string; plate: string; fuelType: 'petrol' | 'diesel'; tankCapacity: number; fuelLevel: number };
  documents: { licenseCategory: string; licenseExpiry: string; insuranceExpiry: string };
  preferences: string[];
  schedule: number[];
  appearanceChance: number;
  history: string;
  storyFeatures: string[];
  behaviorProfile: BehaviorProfile;
}

export interface NPCState {
  npcId: string;
  trust: number;
  suspicion: number;
  mood: number;
  relationship: number;
  visitCount: number;
  knownFacts: string[];
  storyFlags: string[];
  interactionHistory: string[];
}
