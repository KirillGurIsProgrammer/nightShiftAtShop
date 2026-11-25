import type { EventBus } from './EventBus';
import type { GameState } from './GameState';
import type { IdentityDocument } from '../entities/Document';
import type { ShopItem } from '../entities/Item';
import type { FuelPumpState } from '../entities/FuelPump';
import itemData from '../data/items/items.json';
import { NPCManager } from '../systems/npc/NPCManager';
import { DialogueManager } from '../systems/dialogue/DialogueManager';
import { InspectionManager } from '../systems/inspection/InspectionManager';
import { FuelManager } from '../systems/fuel/FuelManager';
import { ShopManager } from '../systems/shop/ShopManager';
import { EconomyManager } from '../systems/economy/EconomyManager';
import { EventDirector } from '../systems/events/EventDirector';
import { SaveManager } from '../persistence/SaveManager';
import { ComputerShell, type ComputerApp } from '../ui/ComputerShell';
import { VisitorDialogueUI } from '../ui/VisitorDialogueUI';
import type { DialogueChoice, DialogueRuntimeState } from '../systems/dialogue/DialogueManager';
import { VisitManager, type Visit } from '../systems/npc/VisitManager';

export class Game {
  private readonly npc = new NPCManager();
  private readonly dialogue = new DialogueManager();
  private readonly inspection = new InspectionManager();
  private readonly fuel: FuelManager;
  private readonly shop: ShopManager;
  private readonly economy = new EconomyManager();
  private readonly eventDirector = new EventDirector();
  private readonly saves = new SaveManager();
  private readonly computer: ComputerShell;
  private readonly dialogueUI: VisitorDialogueUI;
  private visitorId: string;
  private dialogueNodeId = 'greeting';
  private visitResolved = false;
  private readonly journal: string[] = [];
  private seed = 1701;
  private dialogueRuntime: DialogueRuntimeState | null = null;
  private readonly dialogueHistory: string[] = [];
  private readonly visitManager = new VisitManager();
  private visit!: Visit;

  constructor(private readonly state: GameState, private readonly events: EventBus, root: HTMLElement) {
    this.computer = new ComputerShell(root, () => ({
      night: this.state.shift.night,
      money: this.economy.record.balance,
      shiftMinutes: this.state.shift.shiftMinutes,
    }));
    this.dialogueUI = new VisitorDialogueUI(root);

    const pumps: FuelPumpState[] = Array.from({ length: 5 }, (_, index) => ({
      id: index + 1,
      fuelType: index >= 3 ? 'diesel' : 'petrol',
      stock: index >= 3 ? 1100 : 1400,
      maxStock: 1600,
      state: 'working',
      available: true,
    }));
    this.fuel = new FuelManager(pumps);
    this.shop = new ShopManager(itemData as ShopItem[]);
    const visitor = this.npc.selectVisitor(state.shift.night, this.seed);
    this.visitorId = visitor.id;
    const pumpId = 1 + (this.seed + visitor.name.length) % 4;
    this.visit = this.visitManager.create(visitor.id, pumpId, visitor.preferences[0] ?? null);
    this.visitManager.receiveRequest(this.visit);

    events.on<{ panel: string }>('ui.open', ({ panel }) => this.openPanel(panel));
    root.addEventListener('computer.app', (event) => {
      const detail = (event as CustomEvent<{ app: ComputerApp }>).detail;
      this.openPanel(detail.app);
    });
  }

  update(deltaSeconds: number): void {
    const expired = this.eventDirector.update(deltaSeconds);
    expired.forEach((id) => this.journal.push(`Событие завершено: ${id}`));
    if (Math.random() < deltaSeconds * 0.008) {
      const event = this.eventDirector.attempt(Math.random(), 0.3);
      if (event) {
        this.journal.push(`Необычное событие: ${event.name}`);
        this.events.emit('game.event', { event });
      }
    }
  }

  private openPanel(name: string): void {
    if (name === 'database') this.renderComputer();
    else if (name === 'messenger') this.renderMessenger();
    else if (name === 'cash') this.renderCash();
    else if (name === 'visitor') this.startDialogue();
    else if (name === 'visitors') this.renderVisitors();
  }

  private setTitle(title: string, body: string): void {
    this.computer.open();
    this.computer.setContent(title, body);
  }

  private renderComputer(): void {
    const record = this.npc.getRecord(this.visitorId);
    if (!record) return;
    this.state.setActivity('Проверка базы данных');
    this.setTitle('База данных — посетители', `
      <input id="database-search" class="panel-input" value="${record.name}" aria-label="Поиск по базе" />
      <div class="database-card">
        <strong>${record.name}</strong><span>${record.age} лет · ${record.residence}</span>
        <span>Профессия: ${record.profession}</span>
        <span>Автомобиль: ${record.vehicle.make} ${record.vehicle.model}, ${record.vehicle.color}</span>
        <span>Номер: ${record.vehicle.plate}</span>
      </div>
      <div class="panel-actions">
        <button data-action="documents">Проверить документы</button>
      </div>`);
    this.computer.element.querySelector('[data-action="documents"]')?.addEventListener('click', () => this.renderDocuments());
  }

  private documents(): IdentityDocument[] {
    const record = this.npc.getRecord(this.visitorId);
    if (!record) return [];
    return [
      { id: 'license', type: 'license', ownerName: record.name, plate: record.vehicle.plate, vehicleModel: `${record.vehicle.make} ${record.vehicle.model}`, licenseCategory: record.documents.licenseCategory, expiryDate: record.documents.licenseExpiry, photoMatches: true },
      { id: 'registration', type: 'registration', ownerName: record.name, plate: record.vehicle.plate, vehicleModel: `${record.vehicle.make} ${record.vehicle.model}`, licenseCategory: record.documents.licenseCategory, expiryDate: '2028-10-01', photoMatches: true },
      { id: 'insurance', type: 'insurance', ownerName: record.name, plate: record.vehicle.plate, vehicleModel: `${record.vehicle.make} ${record.vehicle.model}`, licenseCategory: record.documents.licenseCategory, expiryDate: record.documents.insuranceExpiry, photoMatches: true },
    ];
  }

  private renderDocuments(): void {
    const record = this.npc.getRecord(this.visitorId);
    if (!record) return;
    this.visitManager.beginInspection(this.visit);
    const documents = this.documents();
    this.state.setActivity('Сверка документов');
    this.setTitle('Документы посетителя', `
      <div class="document-stack">
        ${documents.map((document) => `<article class="document-card"><strong>${document.type === 'license' ? 'Водительское удостоверение' : document.type === 'registration' ? 'Регистрационные документы' : 'Страховка'}</strong><span>${document.ownerName}</span><span>${document.plate}</span><span>${document.vehicleModel}</span><span>До: ${document.expiryDate}</span></article>`).join('')}
      </div>
      <div class="computer-actions"><button data-action="approve">Разрешить</button><button data-action="refuse" class="danger">Отказать</button><button data-action="back">Назад</button></div>`);
    this.computer.element.querySelector('[data-action="approve"]')?.addEventListener('click', () => this.resolveVisit('approve'));
    this.computer.element.querySelector('[data-action="refuse"]')?.addEventListener('click', () => this.resolveVisit('refuse'));
    this.computer.element.querySelector('[data-action="back"]')?.addEventListener('click', () => this.renderComputer());
  }

  private resolveVisit(decision: 'approve' | 'refuse'): void {
    if (this.visitResolved) return;
    const record = this.npc.getRecord(this.visitorId);
    if (!record) return;
    const result = this.inspection.evaluate(record, this.documents(), decision);
    this.visitResolved = true;
    this.visitManager.completeInspection(this.visit);

    if (result.correct) {
      this.economy.adjustReputation(2);
      this.npc.adjustRelationship(record.id, 3);
      this.journal.push(`Решение принято верно: ${record.name}`);
    } else {
      this.economy.adjustReputation(-4);
      this.economy.addExpense('fines', 150);
      this.npc.adjustRelationship(record.id, -6);
      this.journal.push(`Ошибочное решение: ${record.name}`);
    }

    if (decision === 'approve') {
      this.visitManager.makeDecision(this.visit, true);
      this.setTitle('Решение: РАЗРЕШЕНО', `<p>Автомобиль допущен к заправке на колонке <strong>${this.visit.pumpId}</strong>.</p><div class="computer-actions"><button data-action="fuel">Начать заправку</button></div>`);
      this.computer.element.querySelector('[data-action="fuel"]')?.addEventListener('click', () => this.renderFuel());
    } else {
      this.visitManager.makeDecision(this.visit, false, 'Игрок отказал в обслуживании');
      this.visitManager.completePayment(this.visit);
      this.setTitle('Решение: ОТКАЗ', `<p>Причина сохранена в визите. Посетитель может покинуть окно.</p><div class="computer-actions"><button data-action="complete">Завершить визит</button></div>`);
      this.computer.element.querySelector('[data-action="complete"]')?.addEventListener('click', () => this.completeActiveVisit());
    }
  }

  private renderDialogue(): void {
    const record = this.npc.getRecord(this.visitorId);
    if (!record) return;
    if (!this.dialogueRuntime) {
      const npcState = this.npc.getState(record.id);
      this.dialogueRuntime = {
        visitCount: npcState.visitCount,
        relationship: npcState.relationship,
        trust: npcState.trust,
        suspicion: npcState.suspicion,
        knownFacts: [...npcState.knownFacts],
        storyFlags: [...npcState.storyFlags],
        usedQuestions: [],
      };
    }
    const node = this.dialogue.getNode(this.dialogueNodeId);
    if (!node) return;
    const choices = this.dialogue.getAvailableChoices(node.id, this.dialogueRuntime);
    const item = this.visit.purchaseItemId
      ? this.shop.getItems().find((candidate) => candidate.id === this.visit.purchaseItemId)
      : undefined;
    const requestText = this.dialogueNodeId === 'greeting'
      ? `Добрый вечер. Мне, пожалуйста, полный бак на колонке ${this.visit.pumpId}.${item ? ` Также нужен товар: ${item.name}.` : ''}`
      : node.npcText;
    this.state.setActivity('Разговор с посетителем');
    this.visitManager.startConversation(this.visit);
    this.dialogueUI.open({ ...node, npcText: requestText, choices }, record.name, this.dialogueHistory, (choice: DialogueChoice) => {
      this.dialogue.applyChoice(choice, this.dialogueRuntime!);
      this.visitManager.completeConversation(this.visit);

      const npcState = this.npc.getState(record.id);
      npcState.relationship = this.dialogueRuntime!.relationship;
      npcState.trust = this.dialogueRuntime!.trust;
      npcState.suspicion = this.dialogueRuntime!.suspicion;
      npcState.knownFacts = [...this.dialogueRuntime!.knownFacts];
      npcState.storyFlags = [...this.dialogueRuntime!.storyFlags];
      this.dialogueHistory.push(`Игрок: ${choice.text}`);
      if (choice.isEnding || choice.nextNodeId === 'documents') {
        this.dialogueHistory.push(`Посетитель передал документы для проверки.`);
        this.dialogueUI.close();
        this.computer.open('database');
        this.renderDocuments();
        return;
      }
      if (choice.nextNodeId) {
        this.dialogueNodeId = choice.nextNodeId;
        const nextNode = this.dialogue.getNode(choice.nextNodeId);
        if (nextNode) {
          this.dialogueHistory.push(`Посетитель: ${nextNode.npcText}`);
          this.renderDialogue();
        }
      }
    });
  }

  private renderFuel(): void {
    const record = this.npc.getRecord(this.visitorId);
    if (!record || !this.visit.progress.serviceAuthorized) return;
    const tankNeeded = Math.ceil(record.vehicle.tankCapacity - record.vehicle.fuelLevel);
    this.visitManager.startFueling(this.visit);
    this.state.setActivity('Заправка автомобиля');
    this.setTitle('ЗАПРАВКА / КОЛОНКИ', `<p>Запрос посетителя: колонка <strong>${this.visit.pumpId}</strong><br>Автомобиль: <strong>${record.vehicle.make} ${record.vehicle.model}</strong><br>Нужно: <strong>${tankNeeded} л</strong> · ${record.vehicle.fuelType === 'diesel' ? 'Дизель' : 'Бензин'}</p><div class="pump-grid">${this.fuel.getPumps().map((pump) => `<button data-pump="${pump.id}">КОЛОНКА ${pump.id}<br>${pump.fuelType === 'diesel' ? 'Дизель' : 'Бензин'} · ${pump.stock} л</button>`).join('')}</div>`);
    this.computer.element.querySelectorAll<HTMLButtonElement>('[data-pump]').forEach((button) => {
      button.addEventListener('click', () => {
        const pumpId = Number(button.dataset.pump);
        if (pumpId !== this.visit.pumpId) {
          this.setTitle('ЗАПРАВКА / НЕВЕРНАЯ КОЛОНКА', `<p>Посетитель просил колонку <strong>${this.visit.pumpId}</strong>. Текущая операция отменена.</p><div class="computer-actions"><button data-action="retry">Выбрать колонку снова</button></div>`);
          this.computer.element.querySelector('[data-action="retry"]')?.addEventListener('click', () => this.renderFuel());
          return;
        }
        const result = this.fuel.dispense(pumpId, record.vehicle.fuelType, record.vehicle.tankCapacity, record.vehicle.fuelLevel, tankNeeded);
        if (!result.success) {
          this.setTitle('ЗАПРАВКА / ОШИБКА', `<p>Причина: ${result.reason ?? 'ошибка'}.</p><div class="computer-actions"><button data-action="retry">Повторить</button></div>`);
          this.computer.element.querySelector('[data-action="retry"]')?.addEventListener('click', () => this.renderFuel());
          return;
        }
        record.vehicle.fuelLevel += result.liters;
        this.economy.addRevenue(result.cost);
        this.state.shift.money = this.economy.record.balance;
        this.visitManager.finishFueling(this.visit);

        if (this.visit.purchaseItemId) {
          this.setTitle('ЗАПРАВКА / ЗАВЕРШЕНО', `<p>Выдано <strong>${result.liters} л</strong>. Сумма топлива: <strong>${result.cost} ₽</strong>.</p><div class="computer-actions"><button data-action="cash">Оформить запрошенный товар</button></div>`);
          this.computer.element.querySelector('[data-action="cash"]')?.addEventListener('click', () => this.renderCash());
        } else {
          this.visit.progress.paymentCompleted = true;
          this.visitManager.completePayment(this.visit);
          this.setTitle('ЗАПРАВКА / ЗАВЕРШЕНО', `<p>Выдано <strong>${result.liters} л</strong>. Оплата: <strong>${result.cost} ₽</strong>.</p><div class="computer-actions"><button data-action="complete">Завершить обслуживание</button></div>`);
          this.computer.element.querySelector('[data-action="complete"]')?.addEventListener('click', () => this.completeActiveVisit());
        }
      });
    });
  }

  private renderShop(): void {
    this.state.setActivity('Продажа товаров');
    this.setTitle('МАГАЗИН / НОВАЯ ПРОДАЖА', `<div class="shop-grid">${this.shop.getItems().map((item) => `<button data-item="${item.id}" ${item.stock <= 0 ? 'disabled' : ''}><strong>${item.name}</strong><span>${item.salePrice} ₽ · остаток ${item.stock}</span></button>`).join('')}</div><div class="computer-actions"><button data-action="next">Завершить визит</button></div>`);
    this.computer.element.querySelectorAll<HTMLButtonElement>('[data-item]').forEach((button) => {
      button.addEventListener('click', () => {
        const itemId = button.dataset.item ?? '';
        const itemBefore = this.shop.getItems().find((item) => item.id === itemId);
        const result = this.shop.sell(itemId, 1);
        if (!result.success) {
          this.setTitle('МАГАЗИН / НЕДОСТУПНО', `<p>Товар закончился или не найден.</p><div class="computer-actions"><button data-action="retry">Назад к ассортименту</button></div>`);
          this.computer.element.querySelector('[data-action="retry"]')?.addEventListener('click', () => this.renderShop());
          return;
        }
        this.economy.addRevenue(result.cost);
        this.state.shift.money = this.economy.record.balance;
        this.journal.push(`Продан товар: ${itemBefore?.name ?? itemId}`);
        this.renderShop();
      });
    });
    this.computer.element.querySelector('[data-action="next"]')?.addEventListener('click', () => this.nextVisitor());
  }

  private renderCash(): void {
    const report = this.economy.record;
    const record = this.npc.getRecord(this.visitorId);
    if (!record) return;
    const requested = this.shop.getItems().find((item) => item.id === this.visit.purchaseItemId);
    this.setTitle('КАССА / ПОКУПКА ПОСЕТИТЕЛЯ', `
      <div class="cash-balance"><span>ЗАПРОС ПОСЕТИТЕЛЯ</span><strong>${requested?.name ?? 'Товар не указан'} · ${requested?.salePrice ?? 0} ₽</strong></div>
      <dl class="legacy-grid"><dt>Посетитель</dt><dd>${record.name}</dd><dt>Текущий баланс</dt><dd>${report.balance} ₽</dd><dt>Остаток товара</dt><dd>${requested?.stock ?? 0}</dd></dl>
      <div class="computer-actions"><button data-action="sell" ${requested?.stock === 0 ? 'disabled' : ''}>Подтвердить продажу</button><button data-action="complete" ${this.visit.progress.purchaseCompleted ? '' : 'disabled'}>Завершить обслуживание</button></div>`);
    this.computer.element.querySelector('[data-action="sell"]')?.addEventListener('click', () => {
      if (!requested || this.visit.progress.purchaseCompleted) return;
      const sale = this.shop.sell(requested.id, 1);
      if (!sale.success) return;
      this.economy.addRevenue(sale.cost);
      this.state.shift.money = this.economy.record.balance;
      this.visitManager.completePurchase(this.visit);
      this.visitManager.completePayment(this.visit);
      this.journal.push(`Посетитель приобрёл товар: ${requested.name}`);
      this.renderCash();
    });
    this.computer.element.querySelector('[data-action="complete"]')?.addEventListener('click', () => this.completeActiveVisit());
  }

  private completeActiveVisit(): void {
    if (!this.visitManager.completeVisit(this.visit)) {
      this.setTitle('ВИЗИТ НЕ ЗАВЕРШЁН', '<p>Есть обязательные действия: решение, заправка, товар или оплата.</p>');
      return;
    }
    this.nextVisitor();
  }

  private nextVisitor(): void {
    this.seed += 1;
    this.visitResolved = false;
    this.dialogueNodeId = 'greeting';
    this.dialogueRuntime = null;
    this.dialogueHistory.splice(0, this.dialogueHistory.length);
    const record = this.npc.selectVisitor(this.state.shift.night, this.seed);
    this.visitorId = record.id;
    const pumpId = 1 + (this.seed + record.name.length) % 4;
    this.visit = this.visitManager.create(record.id, pumpId, record.preferences[0] ?? null);
    this.visitManager.receiveRequest(this.visit);
    this.state.setActivity('Посетитель у окна — ожидает внимания');
    this.computer.renderDesktop();
    this.journal.push(`Прибыл посетитель: ${record.name}`);
  }

  private renderVisitors(): void {
    const record = this.npc.getRecord(this.visitorId);
    if (!record) return;
    const state = this.npc.getState(record.id);
    this.state.setActivity('Обслуживание посетителя');
    this.setTitle('ПОСЕТИТЕЛИ / АКТИВНЫЙ ВИЗИТ', `
      <div class="visitor-card"><div class="visitor-avatar"><span>${record.name.slice(0, 1)}</span></div><div><b>${record.name}</b><span>${record.age} лет · ${record.residence}</span><span>${record.vehicle.make} ${record.vehicle.model} · ${record.vehicle.plate}</span></div></div>
      <dl class="legacy-grid"><dt>Статус</dt><dd>Ожидает решения</dd><dt>Прибытие</dt><dd>02:${String(8 + state.visitCount).padStart(2, '0')}</dd><dt>Доверие</dt><dd>${state.trust}%</dd><dt>Визитов</dt><dd>${state.visitCount}</dd></dl>
      <div class="computer-actions"><button data-action="inspect">Осмотреть через окно</button><button data-action="dialogue">Начать разговор</button><button data-action="documents">Документы</button></div>`);
    this.computer.element.querySelector('[data-action="inspect"]')?.addEventListener('click', () => this.events.emit('attention.mode', { mode: 'outside' }));
    this.computer.element.querySelector('[data-action="dialogue"]')?.addEventListener('click', () => this.renderDialogue());
    this.computer.element.querySelector('[data-action="documents"]')?.addEventListener('click', () => this.renderDocuments());
    this.computer.element.querySelector('[data-action="close"]')?.addEventListener('click', () => this.computer.close());
  }

  private renderMessenger(): void {
    this.setTitle('СООБЩЕНИЯ / НАЧАЛЬСТВО', `
      <div class="database-card"><strong>02:14 · Начальство</strong><span>Сверяйте номер автомобиля с документами. При несоответствии не приступайте к обслуживанию.</span></div>
      <div class="database-card"><strong>02:21 · Диспетчер</strong><span>Сообщение может ожидать подтверждения. Не передавайте сведения о посетителях другим лицам.</span></div>
      <div class="computer-actions"><button data-action="confirm">Подтвердить инструкции</button></div>`);
    this.computer.element.querySelector('[data-action="confirm"]')?.addEventListener('click', () => {
      this.journal.push('Получены и подтверждены инструкции начальства');
      this.renderMessenger();
    });
  }

  async save(): Promise<void> {
    await this.saves.createSave({
      version: 1,
      seed: this.seed,
      night: this.state.shift.night,
      shiftMinutes: this.state.shift.shiftMinutes,
      money: this.economy.record.balance,
      npcStates: this.npc.exportStates(),
      activeVisit: this.visit,
      dialogueNodeId: this.dialogueNodeId,
      dialogueHistory: [...this.dialogueHistory],
      storyFlags: this.journal.filter((entry) => entry.includes('ошиб')),
      journal: [...this.journal],
      settings: {},
      savedAt: new Date().toISOString(),
    });
  }

  async load(): Promise<boolean> {
    const save = await this.saves.loadSave();
    if (!save) return false;
    this.seed = save.seed;
    this.state.shift.night = save.night;
    this.state.shift.shiftMinutes = save.shiftMinutes;
    this.state.shift.money = save.money;
    this.economy.record.balance = save.money;
    this.npc.restoreStates(save.npcStates as never[]);
    if (save.activeVisit && typeof save.activeVisit === 'object') {
      const restored = save.activeVisit as Visit;
      if (this.npc.getRecord(restored.npcId)) {
        this.visitorId = restored.npcId;
        this.visit = restored;
      }
    }
    if (typeof save.dialogueNodeId === 'string') this.dialogueNodeId = save.dialogueNodeId;
    if (Array.isArray(save.dialogueHistory)) {
      this.dialogueHistory.splice(0, this.dialogueHistory.length, ...(save.dialogueHistory as string[]));
    }
    return true;
  }

  startDialogue(): void {
    this.renderDialogue();
  }

  closeComputer(): void {
    this.computer.close();
  }

  openComputer(): void {
    this.computer.renderDesktop();
  }
}
