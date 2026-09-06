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
  templateUrl: './budgets-list.component.html',
})
export class BudgetsListComponent {
  private readonly store = inject(BudgetStore);
  readonly budgets = this.store.summaries;
}
