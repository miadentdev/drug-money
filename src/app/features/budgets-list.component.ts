import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { BudgetStore } from '../data-access/budget-store.service';

@Component({
  standalone: true,
  imports: [RouterLink, CurrencyPipe, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <section class="list-layout">
      <div class="hero">
        <h1>Budgets</h1>
        <p>Track multiple pockets of money locally, offline, and on device.</p>
      </div>
      @if (budgets().length === 0) {
        <mat-card class="empty-state">
          <mat-icon>savings</mat-icon>
          <h2>No budgets yet</h2>
          <p>Create your first budget to start tracking deposits and withdrawals.</p>
          <a mat-flat-button color="primary" routerLink="/budgets/new">Create budget</a>
        </mat-card>
      } @else {
        <div class="budget-list">
          @for (budget of budgets(); track budget.id) {
            <a class="budget-card" [routerLink]="['/budgets', budget.id]">
              <mat-card>
                <div class="budget-row">
                  <div>
                    <h2>{{ budget.name }}</h2>
                    <p>{{ budget.transactionCount }} transaction(s)</p>
                  </div>
                  <strong>{{ budget.total / 100 | currency:'EUR':'symbol':'1.2-2' }}</strong>
                </div>
              </mat-card>
            </a>
          }
        </div>
      }
      <a class="fab" mat-fab color="primary" routerLink="/budgets/new" aria-label="Create budget">
        <mat-icon>add</mat-icon>
      </a>
    </section>
  `,
})
export class BudgetsListComponent {
  private readonly store = inject(BudgetStore);
  readonly budgets = this.store.summaries;
}
