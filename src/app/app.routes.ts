import { Routes } from '@angular/router';
import { BudgetsListComponent } from './features/budgets-list.component';
import { BudgetDetailComponent } from './features/budget-detail.component';
import { BudgetFormPageComponent } from './features/budget-form-page.component';
import { InstallationPageComponent } from './features/installation-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'budgets' },
  { path: 'budgets', component: BudgetsListComponent },
  { path: 'install', component: InstallationPageComponent },
  { path: 'budgets/new', component: BudgetFormPageComponent, data: { mode: 'create' } },
  { path: 'budgets/:id', component: BudgetDetailComponent },
  { path: 'budgets/:id/add', component: BudgetFormPageComponent, data: { mode: 'add' } },
  { path: 'budgets/:id/remove', component: BudgetFormPageComponent, data: { mode: 'remove' } },
  { path: '**', redirectTo: 'budgets' },
];
