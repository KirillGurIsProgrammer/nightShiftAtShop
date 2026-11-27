import type { EventBus } from './EventBus';
import type { GameState } from './GameState';
import type { IdentityDocument } from '../entities/Document';
import type { ShopItem } from '../entities/Item';
import type { FuelPumpState } from '../entities/FuelPump';
import itemData from '../data/items/items.json';
import { NPCManager } from '../systems/npc/NPCManager';
import { DialogueManager, type DialogueChoice, type DialogueRuntimeState } from '../systems/dialogue/DialogueManager';
import { InspectionManager } from '../systems/inspection/InspectionManager';
import { FuelManager } from '../systems/fuel/FuelManager';
import { ShopManager } from '../systems/shop/ShopManager';
import { EconomyManager } from '../systems/economy/EconomyManager';
import { EventDirector } from '../systems/events/EventDirector';
import { SaveManager } from '../persistence/SaveManager';
import { VisitManager, type Visit } from '../systems/npc/VisitManager';
import type { GameUIState, MenuContent } from '../ui/MenuState';

export class Game {
  private readonly npc = new NPCManager();
  private readonly dialogue = new DialogueManager();
  private readonly inspection = new InspectionManager();
  private readonly fuel: FuelManager;
  private readonly shop: ShopManager;
  private readonly economy = new EconomyManager();
  private readonly eventDirector = new EventDirector();
  private readonly saves = new SaveManager();
  private visitorId: string;
  private dialogueNodeId = 'greeting';
  private visitResolved = false;
  private readonly journal: string[] = [];
  private seed = 1701;
  private dialogueRuntime: DialogueRuntimeState | null = null;
  private readonly dialogueHistory: string[] = [];
  private readonly visitManager = new VisitManager();
  private visit!: Visit;

  constructor(
    private readonly state: GameState,
    private readonly events: EventBus,
    private readonly ui: GameUIState,
  ) {
    this.syncComputerBalance();
    this.ui.onAction = (action, payload) => this.handleMenuAction(action, payload);
    this.ui.onDialogueChoice = (choice) => this.chooseDialogue(choice);

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
    const pumpId = this.fuel.selectPumpForFuelType(visitor.vehicle.fuelType, this.seed + visitor.name.length).id;
    this.visit = this.visitManager.create(visitor.id, pumpId, visitor.preferences[0] ?? null);
    this.visitManager.receiveRequest(this.visit);

    events.on<{ panel: string }>('ui.open', ({ panel }) => this.openPanel(panel));
    events.on<{ app: string }>('computer.app', ({ app }) => this.openPanel(app));
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

  private handleMenuAction(action: string, payload?: string | number): void {
    switch (action) {
      case 'open-panel':
        this.openPanel(String(payload ?? ''));
        break;
      case 'desktop':
        this.openComputer();
        break;
      case 'close-computer':
        this.closeComputer();
        this.events.emit('attention.mode', { mode: 'visitor' });
        break;
      case 'return-to-visitor':
        this.events.emit('attention.mode', { mode: 'visitor' });
        break;
      case 'close-dialogue':
        this.ui.dialogue.open = false;
        break;
      case 'save':
        void this.save().then(() => {
          this.ui.saveLabel = 'Сохранено';
          window.setTimeout(() => { this.ui.saveLabel = 'Сохранить'; }, 1300);
        });
        break;
      case 'documents':
        this.renderDocuments();
        break;
      case 'approve':
        this.resolveVisit('approve');
        break;
      case 'refuse':
        this.resolveVisit('refuse');
        break;
      case 'back':
        this.renderComputer();
        break;
      case 'fuel':
        this.renderFuel();
        break;
      case 'complete':
        this.completeActiveVisit();
        break;
      case 'retry-fuel':
        this.renderFuel();
        break;
      case 'retry-shop':
        this.renderShop();
        break;
      case 'cash':
        this.renderCash();
        break;
      case 'select-pump':
        this.selectPump(Number(payload));
        break;
      case 'sell-item':
        this.sellItem(String(payload ?? ''));
        break;
      case 'next':
        this.nextVisitor();
        break;
      case 'sell':
        this.sellRequestedItem();
        break;
      case 'inspect':
        this.events.emit('attention.mode', { mode: 'outside' });
        break;
      case 'dialogue':
        this.renderDialogue();
        break;
      case 'confirm':
        this.journal.push('Получены и подтверждены инструкции начальства');
        this.renderMessenger();
        break;
      default:
        throw new Error(`Неизвестное действие меню: ${action}`);
    }
  }

  private syncComputerBalance(): void {
    this.ui.computerBalance = this.economy.record.balance;
  }

  private openPanel(name: string): void {
    if (name === 'database') this.renderComputer();
    else if (name === 'messenger') this.renderMessenger();
    else if (name === 'cash') this.renderCash();
    else if (name === 'visitor') this.startDialogue();
    else if (name === 'visitors') this.renderVisitors();
  }

  private setTitle(title: string, content: Omit<MenuContent, 'title'>): void {
    this.ui.computerOpen = true;
    this.ui.computerFocused = true;
    this.ui.menu = { ...content, title, page: content.page };
  }

  private renderComputer(): void {
    const record = this.npc.getRecord(this.visitorId);
    if (!record) return;
    this.state.setActivity('Проверка базы данных');
    this.setTitle('База данных — посетители', {
      page: 'database',
      cards: [{
        title: record.name,
        details: [
          `${record.age} лет · ${record.residence}`,
          `Профессия: ${record.profession}`,
          `Автомобиль: ${record.vehicle.make} ${record.vehicle.model}, ${record.vehicle.color}`,
          `Номер: ${record.vehicle.plate}`,
        ],
      }],
      actions: [{ label: 'Проверить документы', action: 'documents' }],
    });
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
    this.setTitle('Документы посетителя', {
      page: 'documents',
      documents: documents.map((document) => ({
        title: document.type === 'license' ? 'Водительское удостоверение' : document.type === 'registration' ? 'Регистрационные документы' : 'Страховка',
        ownerName: document.ownerName,
        plate: document.plate,
        vehicleModel: document.vehicleModel,
        expiryDate: document.expiryDate,
      })),
      actions: [
        { label: 'Разрешить', action: 'approve' },
        { label: 'Отказать', action: 'refuse', danger: true },
        { label: 'Назад', action: 'back' },
      ],
    });
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
    this.syncComputerBalance();

    if (decision === 'approve') {
      this.visitManager.makeDecision(this.visit, true);
      this.setTitle('Решение: РАЗРЕШЕНО', {
        page: 'result',
        message: `Автомобиль допущен к заправке на колонке ${this.visit.pumpId}.`,
        actions: [{ label: 'Начать заправку', action: 'fuel' }],
      });
    } else {
      this.visitManager.makeDecision(this.visit, false, 'Игрок отказал в обслуживании');
      this.visitManager.completePayment(this.visit);
      this.setTitle('Решение: ОТКАЗ', {
        page: 'result',
        message: 'Причина сохранена в визите. Посетитель может покинуть окно.',
        actions: [{ label: 'Завершить визит', action: 'complete' }],
      });
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
    this.ui.dialogue = {
      open: true,
      name: record.name,
      text: requestText,
      history: [...this.dialogueHistory],
      choices,
    };
  }

  private chooseDialogue(choice: DialogueChoice): void {
    const record = this.npc.getRecord(this.visitorId);
    if (!record || !this.dialogueRuntime) return;
    this.dialogue.applyChoice(choice, this.dialogueRuntime);
    this.visitManager.completeConversation(this.visit);
    const npcState = this.npc.getState(record.id);
    npcState.relationship = this.dialogueRuntime.relationship;
    npcState.trust = this.dialogueRuntime.trust;
    npcState.suspicion = this.dialogueRuntime.suspicion;
    npcState.knownFacts = [...this.dialogueRuntime.knownFacts];
    npcState.storyFlags = [...this.dialogueRuntime.storyFlags];
    this.dialogueHistory.push(`Игрок: ${choice.text}`);
    if (choice.isEnding || choice.nextNodeId === 'documents') {
      this.dialogueHistory.push('Посетитель передал документы для проверки.');
      this.ui.dialogue.open = false;
      this.openComputer();
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
  }

  private renderFuel(): void {
    const record = this.npc.getRecord(this.visitorId);
    if (!record || !this.visit.progress.serviceAuthorized) return;
    const tankNeeded = Math.ceil(record.vehicle.tankCapacity - record.vehicle.fuelLevel);
    this.visitManager.startFueling(this.visit);
    this.state.setActivity('Заправка автомобиля');
    this.setTitle('ЗАПРАВКА / КОЛОНКИ', {
      page: 'fuel',
      message: `Запрос посетителя: колонка ${this.visit.pumpId} · Автомобиль: ${record.vehicle.make} ${record.vehicle.model} · Нужно: ${tankNeeded} л · ${record.vehicle.fuelType === 'diesel' ? 'Дизель' : 'Бензин'}`,
      entryAction: 'select-pump',
      entries: this.fuel.getPumps().map((pump) => ({
        id: String(pump.id),
        title: `КОЛОНКА ${pump.id}`,
        detail: `${pump.fuelType === 'diesel' ? 'Дизель' : 'Бензин'} · ${pump.stock} л`,
      })),
    });
  }

  private selectPump(pumpId: number): void {
    const record = this.npc.getRecord(this.visitorId);
    if (!record) return;
    const tankNeeded = Math.ceil(record.vehicle.tankCapacity - record.vehicle.fuelLevel);
    if (pumpId !== this.visit.pumpId) {
      this.setTitle('ЗАПРАВКА / НЕВЕРНАЯ КОЛОНКА', {
        page: 'result',
        message: `Посетитель просил колонку ${this.visit.pumpId}. Текущая операция отменена.`,
        actions: [{ label: 'Выбрать колонку снова', action: 'retry-fuel' }],
      });
      return;
    }
    const result = this.fuel.dispense(pumpId, record.vehicle.fuelType, record.vehicle.tankCapacity, record.vehicle.fuelLevel, tankNeeded);
    if (!result.success) {
      this.setTitle('ЗАПРАВКА / ОШИБКА', {
        page: 'result',
        message: `Причина: ${result.reason ?? 'ошибка'}.`,
        actions: [{ label: 'Повторить', action: 'retry-fuel' }],
      });
      return;
    }
    record.vehicle.fuelLevel += result.liters;
    this.economy.addRevenue(result.cost);
    this.state.shift.money = this.economy.record.balance;
    this.syncComputerBalance();
    this.visitManager.finishFueling(this.visit);

    if (this.visit.purchaseItemId) {
      this.setTitle('ЗАПРАВКА / ЗАВЕРШЕНО', {
        page: 'result',
        message: `Выдано ${result.liters} л. Сумма топлива: ${result.cost} ₽.`,
        actions: [{ label: 'Оформить запрошенный товар', action: 'cash' }],
      });
    } else {
      this.visit.progress.paymentCompleted = true;
      this.visitManager.completePayment(this.visit);
      this.setTitle('ЗАПРАВКА / ЗАВЕРШЕНО', {
        page: 'result',
        message: `Выдано ${result.liters} л. Оплата: ${result.cost} ₽.`,
        actions: [{ label: 'Завершить обслуживание', action: 'complete' }],
      });
    }
  }

  private renderShop(): void {
    this.state.setActivity('Продажа товаров');
    this.setTitle('МАГАЗИН / НОВАЯ ПРОДАЖА', {
      page: 'shop',
      entryAction: 'sell-item',
      entries: this.shop.getItems().map((item) => ({
        id: item.id,
        title: item.name,
        detail: `${item.salePrice} ₽ · остаток ${item.stock}`,
        disabled: item.stock <= 0,
      })),
      actions: [{ label: 'Завершить визит', action: 'next' }],
    });
  }

  private sellItem(itemId: string): void {
    const itemBefore = this.shop.getItems().find((item) => item.id === itemId);
    const result = this.shop.sell(itemId, 1);
    if (!result.success) {
      this.setTitle('МАГАЗИН / НЕДОСТУПНО', {
        page: 'result',
        message: 'Товар закончился или не найден.',
        actions: [{ label: 'Назад к ассортименту', action: 'retry-shop' }],
      });
      return;
    }
    this.economy.addRevenue(result.cost);
    this.state.shift.money = this.economy.record.balance;
    this.syncComputerBalance();
    this.journal.push(`Продан товар: ${itemBefore?.name ?? itemId}`);
    this.renderShop();
  }

  private renderCash(): void {
    const report = this.economy.record;
    const record = this.npc.getRecord(this.visitorId);
    if (!record) return;
    const requested = this.shop.getItems().find((item) => item.id === this.visit.purchaseItemId);
    this.setTitle('КАССА / ПОКУПКА ПОСЕТИТЕЛЯ', {
      page: 'cash',
      cards: [{
        title: 'ЗАПРОС ПОСЕТИТЕЛЯ',
        details: [`${requested?.name ?? 'Товар не указан'} · ${requested?.salePrice ?? 0} ₽`],
      }],
      rows: [
        { label: 'Посетитель', value: record.name },
        { label: 'Текущий баланс', value: `${report.balance} ₽` },
        { label: 'Остаток товара', value: requested?.stock ?? 0 },
      ],
      actions: [
        { label: 'Подтвердить продажу', action: 'sell', disabled: requested?.stock === 0 || !requested },
        { label: 'Завершить обслуживание', action: 'complete', disabled: !this.visit.progress.purchaseCompleted },
      ],
    });
  }

  private sellRequestedItem(): void {
    const requested = this.shop.getItems().find((item) => item.id === this.visit.purchaseItemId);
    if (!requested || this.visit.progress.purchaseCompleted) return;
    const sale = this.shop.sell(requested.id, 1);
    if (!sale.success) return;
    this.economy.addRevenue(sale.cost);
    this.state.shift.money = this.economy.record.balance;
    this.syncComputerBalance();
    this.visitManager.completePurchase(this.visit);
    this.visitManager.completePayment(this.visit);
    this.journal.push(`Посетитель приобрёл товар: ${requested.name}`);
    this.renderCash();
  }

  private completeActiveVisit(): void {
    if (!this.visitManager.completeVisit(this.visit)) {
      this.setTitle('ВИЗИТ НЕ ЗАВЕРШЁН', {
        page: 'result',
        message: 'Есть обязательные действия: решение, заправка, товар или оплата.',
      });
      return;
    }
    this.nextVisitor();
  }

  private nextVisitor(): void {
    this.npc.consumeFuelForTravel(this.visitorId);
    this.seed += 1;
    this.visitResolved = false;
    this.dialogueNodeId = 'greeting';
    this.dialogueRuntime = null;
    this.dialogueHistory.splice(0, this.dialogueHistory.length);
    const record = this.npc.selectVisitor(this.state.shift.night, this.seed);
    this.visitorId = record.id;
    const pumpId = this.fuel.selectPumpForFuelType(record.vehicle.fuelType, this.seed + record.name.length).id;
    this.visit = this.visitManager.create(record.id, pumpId, record.preferences[0] ?? null);
    this.visitManager.receiveRequest(this.visit);
    this.state.setActivity('Посетитель у окна — ожидает внимания');
    this.openComputer();
    this.journal.push(`Прибыл посетитель: ${record.name}`);
  }

  private renderVisitors(): void {
    const record = this.npc.getRecord(this.visitorId);
    if (!record) return;
    const visitorState = this.npc.getState(record.id);
    this.state.setActivity('Обслуживание посетителя');
    this.setTitle('ПОСЕТИТЕЛИ / АКТИВНЫЙ ВИЗИТ', {
      page: 'visitors',
      cards: [{
        title: record.name,
        details: [
          `${record.age} лет · ${record.residence}`,
          `${record.vehicle.make} ${record.vehicle.model} · ${record.vehicle.plate}`,
        ],
      }],
      rows: [
        { label: 'Статус', value: 'Ожидает решения' },
        { label: 'Прибытие', value: `02:${String(8 + visitorState.visitCount).padStart(2, '0')}` },
        { label: 'Доверие', value: `${visitorState.trust}%` },
        { label: 'Визитов', value: visitorState.visitCount },
      ],
      actions: [
        { label: 'Осмотреть через окно', action: 'inspect' },
        { label: 'Начать разговор', action: 'dialogue' },
        { label: 'Документы', action: 'documents' },
      ],
    });
  }

  private renderMessenger(): void {
    this.setTitle('СООБЩЕНИЯ / НАЧАЛЬСТВО', {
      page: 'messenger',
      cards: [
        {
          title: '02:14 · Начальство',
          details: ['Сверяйте номер автомобиля с документами. При несоответствии не приступайте к обслуживанию.'],
        },
        {
          title: '02:21 · Диспетчер',
          details: ['Сообщение может ожидать подтверждения. Не передавайте сведения о посетителях другим лицам.'],
        },
      ],
      actions: [{ label: 'Подтвердить инструкции', action: 'confirm' }],
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
    this.syncComputerBalance();
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
    this.ui.computerOpen = false;
    this.ui.computerFocused = false;
  }

  openComputer(): void {
    this.ui.computerOpen = true;
    this.ui.computerFocused = true;
    this.ui.menu = { page: 'desktop', title: 'Рабочий стол' };
  }
}
