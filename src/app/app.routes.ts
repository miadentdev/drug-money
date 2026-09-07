import { inject } from '@angular/core';
import { Router, Routes, UrlTree } from '@angular/router';
import { BudgetsListComponent } from './features/budgets-list.component';
import { BudgetDetailComponent } from './features/budget-detail.component';
import { BudgetFormPageComponent } from './features/budget-form-page.component';
import { InstallationPageComponent } from './features/installation-page.component';
import { AppContextService } from './core/app-context.service';

const standaloneOnly = () => inject(AppContextService).isStandalone();
const browserOnly = () => !inject(AppContextService).isStandalone();
const redirect = (commands: any[]): UrlTree => inject(Router).createUrlTree(commands);
const standaloneRedirect = (): boolean | UrlTree => standaloneOnly() ? true : redirect(['/install']);
const browserRedirect = (): boolean | UrlTree => browserOnly() ? true : redirect(['/budgets']);
const rootRedirect = () => (standaloneOnly() ? '/budgets' : '/install');
const wildcardRedirect = () => (standaloneOnly() ? '/budgets' : '/install');

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: rootRedirect },
  { path: 'budgets', canMatch: [() => standaloneRedirect()], component: BudgetsListComponent },
  { path: 'install', canMatch: [() => browserRedirect()], component: InstallationPageComponent },
  { path: 'budgets/new', canMatch: [() => standaloneRedirect()], component: BudgetFormPageComponent, data: { mode: 'create' } },
  { path: 'budgets/:id', canMatch: [() => standaloneRedirect()], component: BudgetDetailComponent },
  { path: 'budgets/:id/add', canMatch: [() => standaloneRedirect()], component: BudgetFormPageComponent, data: { mode: 'add' } },
  { path: 'budgets/:id/remove', canMatch: [() => standaloneRedirect()], component: BudgetFormPageComponent, data: { mode: 'remove' } },
  { path: '**', redirectTo: wildcardRedirect },
];
