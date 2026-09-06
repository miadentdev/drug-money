import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  isDevMode,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { BUDGET_DB, BudgetStore } from './data-access/budget-store.service';
import { budgetDb } from './data-access/budget-db';
import { PersistentStorageService } from './core/persistent-storage.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => inject(PersistentStorageService).request()),
    provideRouter(routes),
    provideAnimations(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    { provide: BUDGET_DB, useValue: budgetDb },
    BudgetStore,
  ],
};
