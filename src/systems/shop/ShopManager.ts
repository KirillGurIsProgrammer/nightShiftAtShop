import type { ShopItem } from '../../entities/Item';

export interface SaleResult { success: boolean; cost: number; reason?: 'stock' | 'unknown'; }

export class ShopManager {
  constructor(private readonly items: ShopItem[]) {}

  getItems(): ShopItem[] { return this.items; }

  sell(itemId: string, quantity = 1): SaleResult {
    const item = this.items.find((candidate) => candidate.id === itemId);
    if (!item) return { success: false, cost: 0, reason: 'unknown' };
    if (item.stock < quantity) return { success: false, cost: 0, reason: 'stock' };
    item.stock -= quantity;
    return { success: true, cost: item.salePrice * quantity };
  }

  restock(itemId: string, quantity: number): boolean {
    const item = this.items.find((candidate) => candidate.id === itemId);
    if (!item) return false;
    item.stock = Math.min(item.maxStock, item.stock + quantity);
    return true;
  }
}
