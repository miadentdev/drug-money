import { Injectable, signal } from '@angular/core';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  readonly canInstall = signal(false);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', this.capturePrompt);
    }
  }

  async install(): Promise<void> {
    const prompt = this.deferredPrompt;
    if (!prompt) return;

    this.clearPrompt();
    await prompt.prompt();
    await prompt.userChoice;
  }

  reset(): void {
    this.clearPrompt();
  }

  private readonly capturePrompt = (event: Event): void => {
    event.preventDefault();
    this.deferredPrompt = event as BeforeInstallPromptEvent;
    this.canInstall.set(true);
  };

  private clearPrompt(): void {
    this.deferredPrompt = null;
    this.canInstall.set(false);
  }
}
