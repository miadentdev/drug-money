import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { SwUpdate } from '@angular/service-worker';
import { MatDialog } from '@angular/material/dialog';
import { BudgetStore } from './data-access/budget-store.service';
import { PwaInstallService } from './core/pwa-install.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: SwUpdate, useValue: { isEnabled: false } },
        { provide: MatDialog, useValue: {} },
        { provide: BudgetStore, useValue: { resetAppState: async () => undefined } },
        { provide: PwaInstallService, useValue: { canInstall: () => false, isIos: false, isInstalled: () => false, showInstallAction: () => false, install: async () => null, reset: () => undefined } },
      ],
    }).compileComponents();
  });

  it('creates the shell', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
