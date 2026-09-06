import { Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { BudgetStore } from '../data-access/budget-store.service';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    RouterLink,
  ],
  templateUrl: './budget-form-page.component.html',
})
export class BudgetFormPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(BudgetStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly mode = signal(
    (this.route.snapshot.data['mode'] as 'create' | 'add' | 'remove') ?? 'create',
  );
  readonly error = signal('');
  readonly budgetId = signal(this.route.snapshot.paramMap.get('id') ?? '');
  readonly form = this.fb.group({
    name: ['', this.mode() === 'create' ? [trimmedRequired] : []],
    amount: ['', this.mode() === 'create' ? [amountInput] : [Validators.required, amountInput]],
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
  readonly actionLabel = computed(() =>
    this.mode() === 'create'
      ? 'Create budget'
      : this.mode() === 'add'
        ? 'Add money'
        : 'Remove money',
  );
  readonly amountHint = computed(() =>
    this.mode() === 'create' ? 'Optional initial amount' : 'Enter an amount in euros',
  );

  async submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
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
      if (this.mode() === 'add')
        await this.store.addMoney(this.budgetId(), amount ?? '', note ?? '');
      else await this.store.removeMoney(this.budgetId(), amount ?? '', note ?? '');
      await this.router.navigate(['/budgets', this.budgetId()]);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Something went wrong');
    }
  }
}

const trimmedRequired: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  control.value?.trim() ? null : { required: true };

const amountInput: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '')
    .trim()
    .replace(',', '.');
  if (!value) return null;
  return /^\d+(\.\d{1,2})?$/.test(value) && Number(value) > 0 ? null : { amount: true };
};
