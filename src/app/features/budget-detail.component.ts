import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { BudgetStore } from '../data-access/budget-store.service';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { firstValueFrom } from 'rxjs';

@Component({
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, MatButtonModule, MatCardModule, MatIconModule, MatListModule],
  template: `
    @if (budget(); as item) {
      <section class="detail-layout">
        <a class="back-link" mat-button routerLink="/budgets"><mat-icon>&lt;</mat-icon> All budgets</a>
        <mat-card class="balance-card">
          <mat-card-header>
            <div class="detail-heading">
              <span class="eyebrow">Budget pocket</span>
              <mat-card-title>{{ item.name }}</mat-card-title>
            </div>
          </mat-card-header>
          <mat-card-content>
            <span class="balance-label">Available balance</span>
            <div class="balance">{{ item.total / 100 | currency:'EUR':'symbol':'1.2-2' }}</div>
            <div class="actions">
              <a mat-flat-button color="primary" [routerLink]="['/budgets', item.id, 'add']"><mat-icon>+</mat-icon> Add money</a>
              <a mat-stroked-button [routerLink]="['/budgets', item.id, 'remove']"><mat-icon>-</mat-icon> Withdraw</a>
              <button mat-icon-button type="button" (click)="rename()" aria-label="Rename budget"><mat-icon>e</mat-icon></button>
              <button mat-icon-button color="warn" type="button" (click)="removeBudget(item.id)" aria-label="Delete budget"><mat-icon>x</mat-icon></button>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="history-card">
          <mat-card-header><mat-card-title>Recent activity</mat-card-title></mat-card-header>
          <mat-list>
            @for (tx of transactions(); track tx.id) {
              <mat-list-item>
                <div matListItemTitle>{{ tx.type === 'deposit' ? 'Deposit' : 'Withdrawal' }} - {{ tx.amount / 100 | currency:'EUR':'symbol':'1.2-2' }}</div>
                <div matListItemLine>{{ tx.note || 'No note' }}</div>
                <div matListItemLine>{{ tx.createdAt | date:'medium' }}</div>
              </mat-list-item>
            } @empty {
              <p class="empty-copy">No transactions yet.</p>
            }
          </mat-list>
        </mat-card>
      </section>
    }
  `,
})
export class BudgetDetailComponent {
  private readonly store = inject(BudgetStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  readonly budget = this.store.budget(this.route.snapshot.paramMap.get('id') ?? '');
  readonly transactions = this.store.transactionsFor(this.route.snapshot.paramMap.get('id') ?? '');

  async rename() {
    const current = this.budget();
    if (!current) return;
    const name = prompt('Rename budget', current.name)?.trim();
    if (!name) return;
    await this.store.renameBudget(current.id, name);
  }

  async removeBudget(id: string) {
    const result = await firstValueFrom(this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete budget', message: 'Delete this budget and all of its transactions?', confirmText: 'Delete' },
    }).afterClosed());
    if (result) {
      await this.store.deleteBudget(id);
      await this.router.navigate(['/budgets']);
    }
  }
}
