import { Component, inject, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { PwaInstallService } from '../core/pwa-install.service';

@Component({
  selector: 'app-installation-page',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, RouterLink],
  templateUrl: './installation-page.component.html',
})
export class InstallationPageComponent {
  private readonly installService = inject(PwaInstallService);
  readonly completed = output<void>();
  readonly updateRequested = output<void>();
  readonly canInstall = this.installService.canInstall;
  readonly showRemoveHelp = signal(false);

  async installApp(): Promise<void> {
    if (await this.installService.install() === 'accepted') this.complete();
  }

  continueWithoutInstall(): void {
    this.complete();
  }

  removeInstallation(): void {
    this.showRemoveHelp.set(true);
  }

  updateApp(): void {
    this.updateRequested.emit();
  }

  private complete(): void {
    localStorage.setItem('drug-money-install-page-seen', 'true');
    this.completed.emit();
  }
}
