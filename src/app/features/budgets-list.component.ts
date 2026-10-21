import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { BudgetStore } from '../data-access/budget-store.service';

@Component({
  standalone: true,
  imports: [RouterLink, CurrencyPipe, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './budgets-list.component.html',
})
export class BudgetsListComponent {
  private readonly store = inject(BudgetStore);
  readonly budgets = this.store.summaries;

  readonly summary = computed(() => {
    const list = this.budgets();
    const totals = list.reduce(
      (acc, budget) => {
        acc.total += budget.total;
        acc.transactions += budget.transactionCount;
        return acc;
      },
      { total: 0, transactions: 0 },
    );

    const largest = list.reduce<
      { name: string; total: number } | undefined
    >((current, budget) => {
      if (!current || budget.total > current.total) {
        return { name: budget.name, total: budget.total };
      }
      return current;
    }, undefined);

    return {
      total: totals.total,
      transactions: totals.transactions,
      largest,
    };
  });
}
