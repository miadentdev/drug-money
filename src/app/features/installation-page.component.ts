import { Component, inject, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { PwaInstallService } from '../core/pwa-install.service';
import { IosInstallDialogComponent } from './ios-install-dialog.component';
import { PwaUpdateService } from '../core/pwa-update.service';

@Component({
  selector: 'app-installation-page',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, RouterLink],
  templateUrl: './installation-page.component.html',
})
export class InstallationPageComponent {
  private readonly installService = inject(PwaInstallService);
  private readonly dialog = inject(MatDialog);
  readonly pwaUpdate = inject(PwaUpdateService);
  readonly completed = output<void>();
  readonly canInstall = this.installService.canInstall;
  readonly isIos = this.installService.isIos;
  readonly showInstallAction = this.installService.showInstallAction;
  readonly showRemoveHelp = signal(false);
  readonly showInstallHelp = signal(false);

  async installApp(): Promise<void> {
    if (this.isIos) {
      this.dialog.open(IosInstallDialogComponent, { width: 'min(92vw, 380px)' });
      return;
    }
    if (!this.canInstall()) {
      this.showInstallHelp.set(true);
      return;
    }
    if (await this.installService.install() === 'accepted') this.complete();
  }

  continueWithoutInstall(): void {
    this.complete();
  }

  removeInstallation(): void {
    this.showRemoveHelp.set(true);
  }

  private complete(): void {
    localStorage.setItem('drug-money-install-page-seen', 'true');
    this.completed.emit();
  }
}
