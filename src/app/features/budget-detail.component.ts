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
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
  ],
  templateUrl: './budget-detail.component.html',
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
    const result = await firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          data: {
            title: 'Delete budget',
            message: 'Delete this budget and all of its transactions?',
            confirmText: 'Delete',
          },
        })
        .afterClosed(),
    );
    if (result) {
      await this.store.deleteBudget(id);
      await this.router.navigate(['/budgets']);
    }
  }
}
