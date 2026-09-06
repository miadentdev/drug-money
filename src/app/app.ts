import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SwUpdate } from '@angular/service-worker';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { BudgetStore } from './data-access/budget-store.service';
import { ConfirmDialogComponent } from './shared/confirm-dialog.component';
import { PwaInstallService } from './core/pwa-install.service';
import { InstallationPageComponent } from './features/installation-page.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet, MatToolbarModule, MatIconModule, MatButtonModule, InstallationPageComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly swUpdate = inject(SwUpdate);
  private readonly dialog = inject(MatDialog);
  private readonly store = inject(BudgetStore);
  private readonly router = inject(Router);
  readonly install = inject(PwaInstallService);
  readonly showInstallPage = signal(!this.hasCompletedInstallPage());

  async installApp(): Promise<void> {
    if (await this.install.install() === 'accepted') this.continueToApp();
  }

  continueToApp(): void {
    window.localStorage.setItem('drug-money-install-page-seen', 'true');
    this.showInstallPage.set(false);
    void this.router.navigate(['/budgets']);
  }

  async resetAppState(): Promise<void> {
    const confirmed = await firstValueFrom(this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Reset app state?',
        message: 'This will permanently delete all budgets and transactions stored on this device.',
        confirmText: 'Reset app',
      },
    }).afterClosed());
    if (!confirmed) return;

    await this.store.resetAppState();
    this.install.reset();
    window.localStorage.removeItem('drug-money-install-page-seen');
    window.localStorage.removeItem('drug-money-install-dismissed');
    window.sessionStorage.removeItem('drug-money-install-dismissed');
    window.location.reload();
  }

  private hasCompletedInstallPage(): boolean {
    return typeof window !== 'undefined' && window.localStorage.getItem('drug-money-install-page-seen') === 'true';
  }

  async updateCache(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      window.location.reload();
      return;
    }

    try {
      await this.swUpdate.checkForUpdate();
      await this.swUpdate.activateUpdate();
    } finally {
      window.location.reload();
    }
  }
}
