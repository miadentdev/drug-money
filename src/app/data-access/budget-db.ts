import Dexie, { type Table } from 'dexie';
import type { Budget, BudgetTransaction } from './budget-types';

export class BudgetDatabase extends Dexie {
  budgets!: Table<Budget, string>;
  transactions!: Table<BudgetTransaction, string>;

  constructor() {
    super('drug-money-db');
    this.version(1).stores({
      budgets: 'id, createdAt, updatedAt, name',
      transactions: 'id, budgetId, createdAt, type',
    });
  }
}

export const budgetDb = new BudgetDatabase();
