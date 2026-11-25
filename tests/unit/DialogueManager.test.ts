import { describe, expect, it } from 'vitest';
import { DialogueManager } from '../../src/systems/dialogue/DialogueManager';

describe('DialogueManager', () => {
  const state = {
    visitCount: 1,
    relationship: 50,
    trust: 50,
    suspicion: 20,
    knownFacts: [] as string[],
    storyFlags: [] as string[],
    usedQuestions: [] as string[],
  };

  it('returns repeat-question choice for repeat visitors', () => {
    const manager = new DialogueManager();
    const choices = manager.getAvailableChoices('greeting', state);
    expect(choices.some((choice) => choice.id === 'repeat')).toBe(true);
  });

  it('applies choice effects to dialogue state', () => {
    const manager = new DialogueManager();
    manager.applyChoice({ id: 'test', text: 'Тест', effects: [{ type: 'relationship', value: 5 }, { type: 'usedQuestion', value: 'documents' }] }, state);
    expect(state.relationship).toBe(55);
    expect(state.usedQuestions).toContain('documents');
  });

  it('does not offer repeat choices for a first visit', () => {
    const manager = new DialogueManager();
    const choices = manager.getAvailableChoices('greeting', { ...state, visitCount: 0 });
    expect(choices.some((choice) => choice.id === 'repeat')).toBe(false);
  });
});
