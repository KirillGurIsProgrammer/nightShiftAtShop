export interface DialogueCondition {
  type: 'visitCountMin' | 'knownFact' | 'storyFlag' | 'relationshipMin' | 'hasAsked';
  value: string | number;
}

export interface DialogueEffect {
  type: 'relationship' | 'trust' | 'suspicion' | 'knownFact' | 'storyFlag' | 'usedQuestion';
  value: number | string;
}

export interface DialogueChoice {
  id: string;
  text: string;
  conditions?: DialogueCondition[];
  effects?: DialogueEffect[];
  nextNodeId?: string;
  isEnding?: boolean;
}

export interface DialogueNode {
  id: string;
  npcText: string;
  choices: DialogueChoice[];
  isEnding?: boolean;
}

export interface DialogueRuntimeState {
  visitCount: number;
  relationship: number;
  trust: number;
  suspicion: number;
  knownFacts: string[];
  storyFlags: string[];
  usedQuestions: string[];
}

export class DialogueManager {
  private readonly nodes: Record<string, DialogueNode> = {
    greeting: {
      id: 'greeting', npcText: 'Добрый вечер. Нужно немного топлива и воды в дорогу.',
      choices: [
        { id: 'purpose', text: 'Куда направляетесь?', effects: [{ type: 'usedQuestion', value: 'purpose' }], nextNodeId: 'destination' },
        { id: 'repeat', text: 'Вы уже бывали здесь?', conditions: [{ type: 'visitCountMin', value: 1 }], effects: [{ type: 'usedQuestion', value: 'repeat' }], nextNodeId: 'repeatVisit' },
        { id: 'documents', text: 'Предъявите документы.', effects: [{ type: 'usedQuestion', value: 'documents' }, { type: 'suspicion', value: 2 }], nextNodeId: 'documents' },
      ],
    },
    destination: {
      id: 'destination', npcText: 'До Сосновки. Машина стала слишком долго держать холостые обороты.',
      choices: [
        { id: 'documents', text: 'Предъявите документы.', effects: [{ type: 'usedQuestion', value: 'documents' }], nextNodeId: 'documents' },
        { id: 'repeat', text: 'Когда вы здесь были в последний раз?', conditions: [{ type: 'visitCountMin', value: 1 }], nextNodeId: 'repeatVisit' },
        { id: 'behaviour', text: 'Почему вы смотрите на дверь?', effects: [{ type: 'suspicion', value: 3 }, { type: 'relationship', value: -2 }], nextNodeId: 'behaviour' },
      ],
    },
    repeatVisit: {
      id: 'repeatVisit', npcText: 'Не помню точно. Кажется, я ездил здесь два раза этой зимой.',
      choices: [
        { id: 'base', text: 'Сверю это с базой.', effects: [{ type: 'knownFact', value: 'Посетитель не уверен в количестве визитов' }], nextNodeId: 'baseCheck' },
        { id: 'documents', text: 'Предъявите документы.', nextNodeId: 'documents' },
      ],
    },
    behaviour: {
      id: 'behaviour', npcText: 'Просто дождь за окном мешает.',
      choices: [
        { id: 'documents', text: 'Тогда предъявите документы.', nextNodeId: 'documents' },
        { id: 'dismiss', text: 'Хорошо, продолжим.', effects: [{ type: 'relationship', value: 1 }], nextNodeId: 'destination' },
      ],
    },
    baseCheck: {
      id: 'baseCheck', npcText: 'Проверьте, если хотите. Я могу подождать.',
      choices: [
        { id: 'database', text: 'Открыть базу данных.', effects: [{ type: 'usedQuestion', value: 'database' }], nextNodeId: 'documents' },
        { id: 'documents', text: 'Запросить документы сразу.', nextNodeId: 'documents' },
      ],
    },
    documents: {
      id: 'documents', npcText: 'Конечно. Вот документы и регистрация автомобиля.',
      choices: [
        { id: 'back', text: 'Вернуться к базе данных.', nextNodeId: 'documents' },
        { id: 'end', text: 'Перейти к проверке.', isEnding: true, nextNodeId: 'documents' },
      ],
      isEnding: true,
    },
  };

  getNode(id: string): DialogueNode | undefined {
    return this.nodes[id];
  }

  getAvailableChoices(nodeId: string, state: DialogueRuntimeState): DialogueChoice[] {
    const node = this.nodes[nodeId];
    if (!node) return [];
    return node.choices.filter((choice) => (choice.conditions ?? []).every((condition) => this.matches(condition, state)));
  }

  applyChoice(choice: DialogueChoice, state: DialogueRuntimeState): void {
    for (const effect of choice.effects ?? []) {
      if (effect.type === 'relationship') state.relationship += Number(effect.value);
      if (effect.type === 'trust') state.trust += Number(effect.value);
      if (effect.type === 'suspicion') state.suspicion += Number(effect.value);
      if (effect.type === 'knownFact') state.knownFacts.push(String(effect.value));
      if (effect.type === 'storyFlag') state.storyFlags.push(String(effect.value));
      if (effect.type === 'usedQuestion') state.usedQuestions.push(String(effect.value));
    }
  }

  private matches(condition: DialogueCondition, state: DialogueRuntimeState): boolean {
    if (condition.type === 'visitCountMin') return state.visitCount >= Number(condition.value);
    if (condition.type === 'knownFact') return state.knownFacts.includes(String(condition.value));
    if (condition.type === 'storyFlag') return state.storyFlags.includes(String(condition.value));
    if (condition.type === 'relationshipMin') return state.relationship >= Number(condition.value);
    if (condition.type === 'hasAsked') return state.usedQuestions.includes(String(condition.value));
    return true;
  }
}
