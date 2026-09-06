import { Injectable, signal } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';

export type PwaUpdateState = 'idle' | 'checking' | 'available' | 'updating' | 'success' | 'error';

@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly successKey = 'drug-money-update-success';
  readonly state = signal<PwaUpdateState>('idle');
  readonly isEnabled: boolean;

  constructor(
    private readonly swUpdate: SwUpdate,
    private readonly snackBar: MatSnackBar,
  ) {
    this.isEnabled = swUpdate.isEnabled;
    if (!this.isEnabled) return;

    this.swUpdate.versionUpdates.subscribe((event) => this.handleVersionEvent(event));
    this.showReloadSuccess();
  }

  async checkForUpdates(): Promise<void> {
    if (!this.isEnabled) {
      this.snackBar.open("You're already up to date.", undefined, { duration: 3000 });
      return;
    }
    if (this.state() === 'checking' || this.state() === 'updating') return;

    this.state.set('checking');
    this.snackBar.open('Checking for updates...', undefined, { duration: 1800 });
    try {
      await this.clearAppCaches();
      const available = await this.swUpdate.checkForUpdate();
      if (this.state() === 'checking') {
        this.state.set(available ? 'available' : 'idle');
        this.snackBar.open(available ? 'New version available.' : "You're already up to date.", undefined, { duration: 3000 });
      }
    } catch (error) {
      this.handleFailure(error);
    }
  }

  async update(): Promise<void> {
    if (!this.isEnabled || this.state() !== 'available') return;

    this.state.set('updating');
    this.snackBar.open('Updating Drug Money...', undefined, { duration: 3000 });
    try {
      await this.swUpdate.activateUpdate();
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(this.successKey, 'true');
      this.state.set('success');
      window.location.reload();
    } catch (error) {
      this.handleFailure(error);
    }
  }

  private handleVersionEvent(event: VersionEvent): void {
    switch (event.type) {
      case 'VERSION_READY':
        this.state.set('available');
        break;
      case 'VERSION_INSTALLATION_FAILED':
        this.handleFailure(event);
        break;
      case 'NO_NEW_VERSION_DETECTED':
        if (this.state() === 'checking') this.state.set('idle');
        break;
    }
  }

  private handleFailure(error: unknown): void {
    console.error('PWA update failed', error);
    this.state.set('error');
    this.snackBar.open('Update failed. Please try again.', undefined, { duration: 4000 });
  }

  private showReloadSuccess(): void {
    if (typeof sessionStorage === 'undefined' || sessionStorage.getItem(this.successKey) !== 'true') return;
    sessionStorage.removeItem(this.successKey);
    this.state.set('success');
    this.snackBar.open('Drug Money was updated successfully.', undefined, { duration: 3500 });
  }

  private async clearAppCaches(): Promise<void> {
    if (typeof window === 'undefined' || !('caches' in window) ||
      typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      const scopePath = new URL(registration.scope).pathname;
      const cachePrefix = `ngsw:${scopePath}`;
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith(cachePrefix))
          .map((cacheName) => caches.delete(cacheName)),
      );
    } catch (error) {
      console.error('Unable to clear the Drug Money service-worker cache', error);
    }
  }
}
