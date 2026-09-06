import Dexie, { type Table } from 'dexie';
import type { Budget, BudgetTransaction } from './budget-types';

export class BudgetDatabase extends Dexie {
  budgets!: Table<Budget, string>;
  transactions!: Table<BudgetTransaction, string>;

  constructor(name = 'drug-money-db') {
    super(name);
    this.version(1).stores({
      budgets: 'id, createdAt, updatedAt, name',
      transactions: 'id, budgetId, createdAt, type',
    });
  }

  async resetAppState(): Promise<void> {
    await this.transaction('rw', this.budgets, this.transactions, async () => {
      await this.transactions.clear();
      await this.budgets.clear();
    });
  }
}

export const budgetDb = new BudgetDatabase();
