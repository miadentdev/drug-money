import { Injectable, InjectionToken, inject } from '@angular/core';
import { liveQuery } from 'dexie';
import { toSignal } from '@angular/core/rxjs-interop';
import { from, map } from 'rxjs';
import type { Budget, BudgetSummary, BudgetTransaction } from './budget-types';

export interface BudgetDatabaseLike {
  budgets: {
    toArray(): Promise<Budget[]>;
    get(id: string): Promise<Budget | undefined>;
    add(budget: Budget): Promise<string>;
    update(id: string, changes: Partial<Budget>): Promise<number>;
    delete(id: string): Promise<void>;
  };
  transactions: {
    toArray(): Promise<BudgetTransaction[]>;
    where(index: 'budgetId'): {
      equals(value: string): {
        toArray(): Promise<BudgetTransaction[]>;
        count(): Promise<number>;
        delete(): Promise<void>;
      };
    };
    add(transaction: BudgetTransaction): Promise<string>;
  };
  transaction<T>(mode: 'rw', ...args: unknown[]): Promise<T>;
}

export const BUDGET_DB = new InjectionToken<BudgetDatabaseLike>('BUDGET_DB');

function nowIso() {
  return new Date().toISOString();
}

function centsFromAmountInput(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

@Injectable()
export class BudgetStore {
  private readonly db = inject(BUDGET_DB);
  readonly budgets = toSignal(
    from(liveQuery(() => this.db.budgets.toArray())).pipe(map((budgets) => budgets.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))),
    { initialValue: [] as Budget[] },
  );
  readonly summaries = toSignal(
    from(liveQuery(async () => {
      const [budgets, transactions] = await Promise.all([
        this.db.budgets.toArray(),
        this.db.transactions.toArray(),
      ]);
      const counts = new Map<string, number>();
      for (const transaction of transactions) counts.set(transaction.budgetId, (counts.get(transaction.budgetId) ?? 0) + 1);
      return budgets
        .map((budget) => ({ ...budget, transactionCount: counts.get(budget.id) ?? 0 }))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    })),
    { initialValue: [] as BudgetSummary[] },
  );

  budget(id: string) {
    return toSignal(from(liveQuery(() => this.db.budgets.get(id))), { initialValue: undefined as Budget | undefined });
  }

  transactionsFor(id: string) {
    return toSignal(
      from(liveQuery(() => this.db.transactions.where('budgetId').equals(id).toArray())).pipe(
        map((transactions) => transactions.sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
      ),
      { initialValue: [] as BudgetTransaction[] },
    );
  }

  async exportSnapshot() {
    const [budgets, transactions] = await Promise.all([
      this.db.budgets.toArray(),
      this.db.transactions.toArray(),
    ]);
    return { budgets, transactions };
  }

  async createBudget(name: string, initialAmountText?: string) {
    const trimmedAmount = initialAmountText?.trim() ?? '';
    const parsedInitialCents = trimmedAmount ? centsFromAmountInput(trimmedAmount) : 0;
    if (parsedInitialCents === null) throw new Error('Invalid amount');
    const initialCents = parsedInitialCents;
    const createdAt = nowIso();
    const budget: Budget = {
      id: crypto.randomUUID(),
      name: name.trim(),
      total: initialCents,
      createdAt,
      updatedAt: createdAt,
    };
    await this.db.transaction('rw', this.db.budgets, this.db.transactions, async () => {
      await this.db.budgets.add(budget);
      if (initialCents > 0) {
        await this.db.transactions.add({
          id: crypto.randomUUID(),
          budgetId: budget.id,
          type: 'deposit',
          amount: initialCents,
          createdAt,
        });
      }
    });
    return budget.id;
  }

  async renameBudget(id: string, name: string) {
    const budget = await this.db.budgets.get(id);
    if (!budget) throw new Error('Budget not found');
    await this.db.budgets.update(id, { name: name.trim(), updatedAt: nowIso() });
  }

  async addMoney(id: string, amountText: string, note?: string) {
    const amount = centsFromAmountInput(amountText);
    if (!amount || amount <= 0) throw new Error('Invalid amount');
    await this.db.transaction('rw', this.db.budgets, this.db.transactions, async () => {
      const budget = await this.db.budgets.get(id);
      if (!budget) throw new Error('Budget not found');
      await this.db.budgets.update(id, { total: budget.total + amount, updatedAt: nowIso() });
      await this.db.transactions.add({
        id: crypto.randomUUID(),
        budgetId: id,
        type: 'deposit',
        amount,
        note: note?.trim() || undefined,
        createdAt: nowIso(),
      });
    });
  }

  async removeMoney(id: string, amountText: string, note?: string) {
    const amount = centsFromAmountInput(amountText);
    if (!amount || amount <= 0) throw new Error('Invalid amount');
    await this.db.transaction('rw', this.db.budgets, this.db.transactions, async () => {
      const budget = await this.db.budgets.get(id);
      if (!budget) throw new Error('Budget not found');
      if (budget.total < amount) throw new Error('Withdrawal exceeds available balance');
      await this.db.budgets.update(id, { total: budget.total - amount, updatedAt: nowIso() });
      await this.db.transactions.add({
        id: crypto.randomUUID(),
        budgetId: id,
        type: 'withdrawal',
        amount,
        note: note?.trim() || undefined,
        createdAt: nowIso(),
      });
    });
  }

  async deleteBudget(id: string) {
    await this.db.transaction('rw', this.db.budgets, this.db.transactions, async () => {
      const budget = await this.db.budgets.get(id);
      if (!budget) throw new Error('Budget not found');
      await this.db.transactions.where('budgetId').equals(id).delete();
      await this.db.budgets.delete(id);
    });
  }
}

export { centsFromAmountInput };
