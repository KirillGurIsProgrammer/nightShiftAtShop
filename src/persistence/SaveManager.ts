export interface SaveDocument {
  version: number;
  seed: number;
  night: number;
  shiftMinutes: number;
  money: number;
  npcStates: unknown[];
  activeVisit?: unknown;
  dialogueNodeId?: string;
  dialogueHistory?: string[];
  storyFlags: string[];
  journal: string[];
  settings: Record<string, number | boolean | string>;
  savedAt: string;
}

export class SaveManager {
  private readonly databaseName = 'night-shift-saves';

  validateSave(save: unknown): save is SaveDocument {
    if (!save || typeof save !== 'object') return false;
    const candidate = save as Partial<SaveDocument>;
    return typeof candidate.version === 'number' && typeof candidate.seed === 'number' && typeof candidate.night === 'number' && Array.isArray(candidate.npcStates) && Array.isArray(candidate.journal);
  }

  migrateSave(save: SaveDocument): SaveDocument { return save.version === 1 ? save : { ...save, version: 1 }; }

  async createSave(save: SaveDocument): Promise<void> {
    const database = await this.open();
    await this.put(database, 'primary', { ...save, savedAt: new Date().toISOString() });
  }

  async updateSave(save: SaveDocument): Promise<void> { await this.createSave(save); }

  async loadSave(): Promise<SaveDocument | undefined> {
    const database = await this.open();
    const record = await this.get(database, 'primary');
    if (!record || !this.validateSave(record)) return undefined;
    return this.migrateSave(record);
  }

  async deleteSave(): Promise<void> {
    const database = await this.open();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('saves', 'readwrite');
      transaction.objectStore('saves').delete('primary');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains('saves')) database.createObjectStore('saves');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private put(database: IDBDatabase, key: string, save: SaveDocument): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction('saves', 'readwrite');
      transaction.objectStore('saves').put(save, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  private get(database: IDBDatabase, key: string): Promise<SaveDocument | undefined> {
    return new Promise((resolve, reject) => {
      const request = database.transaction('saves', 'readonly').objectStore('saves').get(key);
      request.onsuccess = () => resolve(request.result as SaveDocument | undefined);
      request.onerror = () => reject(request.error);
    });
  }
}
