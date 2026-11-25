import npcData from '../../data/npcs/npcs.json';
import type { NPCRecord, NPCState } from '../../entities/NPC';

export class NPCManager {
  private readonly records = npcData as NPCRecord[];
  private readonly states = new Map<string, NPCState>();

  getRecord(id: string): NPCRecord | undefined {
    return this.records.find((npc) => npc.id === id);
  }

  getState(id: string): NPCState {
    const existing = this.states.get(id);
    if (existing) return existing;
    const created: NPCState = {
      npcId: id, trust: 50, suspicion: 20, mood: 50, relationship: 50,
      visitCount: 0, knownFacts: [], storyFlags: [], interactionHistory: [],
    };
    this.states.set(id, created);
    return created;
  }

  selectVisitor(night: number, seedOffset = 0): NPCRecord {
    const candidates = this.records.filter((npc) => npc.schedule.includes(night) || npc.schedule.includes(((night - 1) % 5) + 1));
    const pool = candidates.length > 0 ? candidates : this.records;
    const index = Math.abs(seedOffset + night * 3) % pool.length;
    const record = pool[index];
    if (!record) throw new Error('Нет доступных NPC');
    this.getState(record.id).visitCount += 1;
    return record;
  }

  recordInteraction(id: string, message: string): void {
    const state = this.getState(id);
    state.interactionHistory.push(message);
  }

  adjustRelationship(id: string, amount: number): void {
    const state = this.getState(id);
    state.relationship = Math.max(0, Math.min(100, state.relationship + amount));
  }

  exportStates(): NPCState[] {
    return [...this.states.values()].map((state) => ({ ...state, knownFacts: [...state.knownFacts], storyFlags: [...state.storyFlags], interactionHistory: [...state.interactionHistory] }));
  }

  restoreStates(states: NPCState[]): void {
    this.states.clear();
    states.forEach((state) => this.states.set(state.npcId, { ...state, knownFacts: [...state.knownFacts], storyFlags: [...state.storyFlags], interactionHistory: [...state.interactionHistory] }));
  }
}
