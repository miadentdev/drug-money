import { TestBed } from '@angular/core/testing';
import { BUDGET_DB, BudgetStore } from './budget-store.service';
import { BudgetDatabase } from './budget-db';

const hasIndexedDb = typeof indexedDB !== 'undefined';

describe.skipIf(!hasIndexedDb)('BudgetStore', () => {
  let db: BudgetDatabase;
  let store: BudgetStore;

  beforeEach(() => {
    db = new BudgetDatabase(`drug-money-test-${crypto.randomUUID()}`);
    TestBed.configureTestingModule({
      providers: [{ provide: BUDGET_DB, useValue: db }, BudgetStore],
    });
    store = TestBed.inject(BudgetStore);
  });

  afterEach(async () => {
    await db.delete();
  });

  it('creates a budget with an initial deposit', async () => {
    const id = await store.createBudget('Household', '10.25');
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
    expect((await db.budgets.get(id))?.total).toBe(1250);
    expect(await db.transactions.where('budgetId').equals(id).count()).toBe(2);
  });

  it('rolls back a failed deposit without changing the balance or adding a transaction', async () => {
    const id = await store.createBudget('Pocket', '5');
    const originalAdd = db.transactions.add.bind(db.transactions);
    (db.transactions as any).add = async () => {
      throw new Error('write failed');
    };

    await expect(store.addMoney(id, '2')).rejects.toThrow('write failed');
    (db.transactions as any).add = originalAdd;

    expect((await db.budgets.get(id))?.total).toBe(500);
    expect(await db.transactions.where('budgetId').equals(id).count()).toBe(1);
  });

  it('rolls back a failed withdrawal without changing the balance or adding a transaction', async () => {
    const id = await store.createBudget('Pocket', '5');
    const originalAdd = db.transactions.add.bind(db.transactions);
    (db.transactions as any).add = async () => {
      throw new Error('write failed');
    };

    await expect(store.removeMoney(id, '2')).rejects.toThrow('write failed');
    (db.transactions as any).add = originalAdd;

    expect((await db.budgets.get(id))?.total).toBe(500);
    expect(await db.transactions.where('budgetId').equals(id).count()).toBe(1);
  });

  it('rolls back a failed budget deletion without removing either table record', async () => {
    const id = await store.createBudget('Food', '12');
    await store.addMoney(id, '3');
    const originalDelete = db.budgets.delete.bind(db.budgets);
    (db.budgets as any).delete = async () => {
      throw new Error('delete failed');
    };

    await expect(store.deleteBudget(id)).rejects.toThrow('delete failed');
    (db.budgets as any).delete = originalDelete;

    expect(await db.budgets.get(id)).toBeDefined();
    expect(await db.transactions.where('budgetId').equals(id).count()).toBe(2);
  });

  it('prevents withdrawals above the balance', async () => {
    const id = await store.createBudget('Pocket', '5');
    await expect(store.removeMoney(id, '10')).rejects.toThrow(
      'Withdrawal exceeds available balance',
    );
    expect((await db.budgets.get(id))?.total).toBe(500);
    expect(await db.transactions.where('budgetId').equals(id).count()).toBe(1);
  });

  it('deletes a budget and its transactions together', async () => {
    const id = await store.createBudget('Food', '12');
    await store.addMoney(id, '3');
    await store.deleteBudget(id);
    expect(await db.budgets.get(id)).toBeUndefined();
    expect(await db.transactions.where('budgetId').equals(id).count()).toBe(0);
  });

  it('resets all budgets, transactions, and orphaned transaction data', async () => {
    const firstId = await store.createBudget('Food', '12');
    await store.addMoney(firstId, '3');
    const secondId = await store.createBudget('Travel', '25');
    await store.addMoney(secondId, '5');

    await store.resetAppState();

    expect(await db.budgets.count()).toBe(0);
    expect(await db.transactions.count()).toBe(0);
    expect(await db.transactions.where('budgetId').equals(firstId).count()).toBe(0);
    expect(await db.transactions.where('budgetId').equals(secondId).count()).toBe(0);
  });
});
