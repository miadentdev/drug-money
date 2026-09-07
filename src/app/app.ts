import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { BudgetStore } from './data-access/budget-store.service';
import { ConfirmDialogComponent } from './shared/confirm-dialog.component';
import { PwaInstallService } from './core/pwa-install.service';
import { PwaUpdateService } from './core/pwa-update.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatToolbarModule, MatIconModule, MatButtonModule, MatSnackBarModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly dialog = inject(MatDialog);
  private readonly store = inject(BudgetStore);
  readonly pwaUpdate = inject(PwaUpdateService);
  readonly install = inject(PwaInstallService);

  async installApp(): Promise<void> {
    await this.install.install();
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
    window.location.reload();
  }
}
