export interface EconomyRecord {
  revenue: number;
  expenses: number;
  purchases: number;
  fines: number;
  repairs: number;
  salary: number;
  reputation: number;
  balance: number;
}

export class EconomyManager {
  readonly record: EconomyRecord = { revenue: 0, expenses: 0, purchases: 0, fines: 0, repairs: 0, salary: 0, reputation: 50, balance: 2500 };

  addRevenue(amount: number): void { this.record.revenue += amount; this.record.balance += amount; }
  addExpense(category: 'purchases' | 'fines' | 'repairs' | 'salary', amount: number): void {
    this.record.expenses += amount;
    this.record[category] += amount;
    this.record.balance -= amount;
  }
  adjustReputation(amount: number): void { this.record.reputation = Math.max(0, Math.min(100, this.record.reputation + amount)); }
  endShift(): EconomyRecord { return { ...this.record }; }
}
