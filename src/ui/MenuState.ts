import type { DialogueChoice } from '../systems/dialogue/DialogueManager';

export interface MenuAction {
  label: string;
  action: string;
  payload?: string | number;
  disabled?: boolean;
  danger?: boolean;
}

export interface MenuCard {
  title: string;
  details: string[];
}

export interface MenuEntry {
  id: string;
  title: string;
  detail: string;
  disabled?: boolean;
}

export interface MenuDocument {
  title: string;
  ownerName: string;
  plate: string;
  vehicleModel: string;
  expiryDate: string;
}

export interface MenuPump {
  id: number;
  fuelType: string;
  stock: number;
}

export interface MenuContent {
  page: string;
  title: string;
  message?: string;
  cards?: MenuCard[];
  rows?: Array<{ label: string; value: string | number }>;
  entries?: MenuEntry[];
  entryAction?: string;
  documents?: MenuDocument[];
  pumps?: MenuPump[];
  actions?: MenuAction[];
}

export interface GameUIState {
  hud: {
    night: number;
    money: number;
    time: string;
    activity: string;
  };
  computerBalance: number;
  computerOpen: boolean;
  computerFocused: boolean;
  menu: MenuContent | null;
  dialogue: {
    open: boolean;
    name: string;
    text: string;
    history: string[];
    choices: DialogueChoice[];
  };
  noticeboardOpen: boolean;
  tooltip: string;
  tooltipVisible: boolean;
  saveLabel: string;
  fatalError: string;
  onAction: (action: string, payload?: string | number) => void;
  onDialogueChoice: (choice: DialogueChoice) => void;
}

export function createGameUIState(): GameUIState {
  return {
    hud: { night: 1, money: 0, time: '22:00', activity: 'Ожидание посетителя' },
    computerBalance: 0,
    computerOpen: false,
    computerFocused: false,
    menu: null,
    dialogue: { open: false, name: '', text: '', history: [], choices: [] },
    noticeboardOpen: false,
    tooltip: '',
    tooltipVisible: false,
    saveLabel: 'Сохранить',
    fatalError: '',
    onAction: () => undefined,
    onDialogueChoice: () => undefined,
  };
}
