import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { BudgetStore } from '../data-access/budget-store.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatIconModule, RouterLink],
  template: `
    <section class="page-card">
      <a class="back-link" mat-button routerLink="/budgets"><mat-icon>←</mat-icon> Cancel</a>
      <mat-card class="form-card">
        <mat-card-header>
          <div class="form-heading">
            <span class="eyebrow">{{ mode() === 'create' ? 'Start fresh' : 'Update your pocket' }}</span>
            <mat-card-title>{{ title() }}</mat-card-title>
          </div>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            @if (mode() === 'create') {
              <mat-form-field appearance="outline">
                <mat-label>Name</mat-label>
                <input matInput formControlName="name" />
                <mat-error>Name is required</mat-error>
              </mat-form-field>
            }
            <mat-form-field appearance="outline">
              <mat-label>{{ mode() === 'remove' ? 'Amount to withdraw' : 'Starting amount' }}</mat-label>
              <input matInput formControlName="amount" inputmode="decimal" />
              <mat-hint>{{ amountHint() }}</mat-hint>
              <mat-error>Enter a positive amount like 12.50</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Note <span class="optional-label">(optional)</span></mat-label>
              <input matInput formControlName="note" />
            </mat-form-field>
            @if (error()) {
              <p class="error">{{ error() }}</p>
            }
            <button class="submit-button" mat-flat-button color="primary" type="submit"><mat-icon>{{ mode() === 'remove' ? '↙' : '↗' }}</mat-icon> {{ actionLabel() }}</button>
          </form>
        </mat-card-content>
      </mat-card>
    </section>
  `,
})
export class BudgetFormPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(BudgetStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly mode = signal((this.route.snapshot.data['mode'] as 'create' | 'add' | 'remove') ?? 'create');
  readonly error = signal('');
  readonly budgetId = signal(this.route.snapshot.paramMap.get('id') ?? '');
  readonly form = this.fb.group({
    name: ['', []],
    amount: [''],
    note: [''],
  });
  readonly title = computed(() => {
    switch (this.mode()) {
      case 'add':
        return 'Add money';
      case 'remove':
        return 'Remove money';
      default:
        return 'Create budget';
    }
  });
  readonly actionLabel = computed(() => (this.mode() === 'create' ? 'Create budget' : this.mode() === 'add' ? 'Add money' : 'Remove money'));
  readonly amountHint = computed(() => (this.mode() === 'create' ? 'Optional initial amount' : 'Enter an amount in euros'));

  async submit() {
    this.error.set('');
    try {
      const { name, amount, note } = this.form.getRawValue();
      if (this.mode() === 'create') {
        if (!name?.trim()) throw new Error('Name is required');
        const id = await this.store.createBudget(name, amount ?? '');
        await this.router.navigate(['/budgets', id]);
        return;
      }
      if (!this.budgetId()) throw new Error('Budget not found');
      if (this.mode() === 'add') await this.store.addMoney(this.budgetId(), amount ?? '', note ?? '');
      else await this.store.removeMoney(this.budgetId(), amount ?? '', note ?? '');
      await this.router.navigate(['/budgets', this.budgetId()]);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Something went wrong');
    }
  }
}
