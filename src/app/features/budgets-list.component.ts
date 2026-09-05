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
        <p class="eyebrow">Your money, your rules</p>
        <h1>Budgets</h1>
        <p class="hero-copy">Simple pockets for the money you want to keep track of.</p>
      </div>
      @if (budgets().length === 0) {
        <mat-card class="empty-state">
          <div class="empty-icon"><mat-icon>◒</mat-icon></div>
          <h2>No budgets yet</h2>
          <p>Create your first pocket and start building a clearer picture of your spending.</p>
          <a mat-flat-button color="primary" routerLink="/budgets/new"><mat-icon>+</mat-icon> Create budget</a>
        </mat-card>
      } @else {
        <div class="budget-list">
          @for (budget of budgets(); track budget.id) {
            <a class="budget-card" [routerLink]="['/budgets', budget.id]">
              <mat-card class="budget-card-surface">
                <div class="card-accent"></div>
                <div class="budget-row">
                  <div>
                    <span class="card-label">Pocket</span>
                    <h2>{{ budget.name }}</h2>
                    <p>{{ budget.transactionCount }} {{ budget.transactionCount === 1 ? 'transaction' : 'transactions' }}</p>
                  </div>
                  <strong class="budget-total">{{ budget.total / 100 | currency:'EUR':'symbol':'1.2-2' }}</strong>
                </div>
                <mat-icon class="card-arrow">→</mat-icon>
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
