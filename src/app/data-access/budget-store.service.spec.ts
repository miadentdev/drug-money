import { TestBed } from '@angular/core/testing';
import { BUDGET_DB, BudgetStore, type BudgetDatabaseLike } from './budget-store.service';
import type { Budget, BudgetTransaction } from './budget-types';

function createFakeDb(): BudgetDatabaseLike {
  const budgets = new Map<string, Budget>();
  const transactions = new Map<string, BudgetTransaction>();

  const budgetTable = {
    async toArray() {
      return [...budgets.values()];
    },
    async get(id: string) {
      return budgets.get(id);
    },
    async add(budget: Budget) {
      budgets.set(budget.id, budget);
      return budget.id;
    },
    async update(id: string, changes: Partial<Budget>) {
      const current = budgets.get(id);
      if (!current) return 0;
      budgets.set(id, { ...current, ...changes });
      return 1;
    },
    async delete(id: string) {
      budgets.delete(id);
    },
  };

  const transactionIndex = {
    equals(value: string) {
      return {
        async toArray() {
          return [...transactions.values()].filter((transaction) => transaction.budgetId === value);
        },
        async count() {
          return [...transactions.values()].filter((transaction) => transaction.budgetId === value).length;
        },
        async delete() {
          for (const [id, transaction] of transactions) {
            if (transaction.budgetId === value) transactions.delete(id);
          }
        },
      };
    },
  };

  return {
    budgets: budgetTable,
    transactions: {
      async toArray() {
        return [...transactions.values()];
      },
      where(index: 'budgetId') {
        return index === 'budgetId' ? transactionIndex : transactionIndex;
      },
      async add(transaction: BudgetTransaction) {
        transactions.set(transaction.id, transaction);
        return transaction.id;
      },
    },
    async transaction(_mode: 'rw', ..._tables: unknown[]) {
      const callback = _tables[_tables.length - 1] as (() => Promise<unknown>) | undefined;
      if (!callback) throw new Error('Missing transaction callback');
      return callback() as Promise<any>;
    },
  };
}

describe('BudgetStore', () => {
  let store: BudgetStore;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: BUDGET_DB, useFactory: createFakeDb }, BudgetStore],
    });
    store = TestBed.inject(BudgetStore);
  });

  it('creates a budget with an initial deposit', async () => {
    const id = await store.createBudget('Household', '10.25');
    const db = (store as any).db as BudgetDatabaseLike;
    const budget = await db.budgets.get(id);
    const transactions = await db.transactions.where('budgetId').equals(id).toArray();
    expect(budget?.total).toBe(1025);
    expect(transactions).toHaveLength(1);
    expect(transactions[0]?.type).toBe('deposit');
  });

  it('adds and removes money atomically', async () => {
    const id = await store.createBudget('Trips');
    await store.addMoney(id, '20');
    await store.removeMoney(id, '7.50');
    const db = (store as any).db as BudgetDatabaseLike;
    const budget = await db.budgets.get(id);
    const transactions = await db.transactions.where('budgetId').equals(id).toArray();
    expect(budget?.total).toBe(1250);
    expect(transactions).toHaveLength(2);
  });

  it('prevents withdrawals above the balance', async () => {
    const id = await store.createBudget('Pocket', '5');
    let error: unknown;
    try {
      await store.removeMoney(id, '10');
    } catch (caught) {
      error = caught;
    }
    expect(error instanceof Error ? error.message : '').toBe('Withdrawal exceeds available balance');
    const db = (store as any).db as BudgetDatabaseLike;
    const budget = await db.budgets.get(id);
    const transactions = await db.transactions.where('budgetId').equals(id).toArray();
    expect(budget?.total).toBe(500);
    expect(transactions).toHaveLength(1);
  });

  it('deletes a budget and its transactions together', async () => {
    const id = await store.createBudget('Food', '12');
    await store.addMoney(id, '3');
    await store.deleteBudget(id);
    const db = (store as any).db as BudgetDatabaseLike;
    expect(await db.budgets.get(id)).toBeUndefined();
    expect(await db.transactions.where('budgetId').equals(id).count()).toBe(0);
  });
});
