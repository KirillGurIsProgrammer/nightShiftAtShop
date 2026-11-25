import type { DialogueChoice, DialogueNode } from '../systems/dialogue/DialogueManager';

export class VisitorDialogueUI {
  readonly element: HTMLElement;

  constructor(root: HTMLElement) {
    this.element = document.createElement('section');
    this.element.className = 'visitor-dialogue';
    root.appendChild(this.element);
  }

  open(node: DialogueNode, npcName: string, history: string[], onChoice: (choice: DialogueChoice) => void): void {
    this.element.classList.add('open');
    this.element.innerHTML = `
      <header><span>${npcName}</span><button data-action="close" aria-label="Закрыть диалог">×</button></header>
      <div class="dialogue-history">${history.slice(-3).map((line) => `<span>${line}</span>`).join('')}</div>
      <blockquote>${node.npcText}</blockquote>
      <div class="dialogue-choices">${node.choices.map((choice, index) => `<button data-choice="${index}">${choice.text}</button>`).join('')}</div>`;
    this.element.querySelector('[data-action="close"]')?.addEventListener('click', () => this.close());
    node.choices.forEach((choice, index) => {
      this.element.querySelector(`[data-choice="${index}"]`)?.addEventListener('click', () => onChoice(choice));
    });
  }

  close(): void {
    this.element.classList.remove('open');
  }
}
