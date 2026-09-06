import { computed, Injectable, signal } from '@angular/core';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  readonly canInstall = signal(false);
  readonly isIos = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
  readonly isInstalled = signal(this.detectStandaloneMode());
  readonly showInstallAction = computed(() => !this.isInstalled() && (this.isIos || this.canInstall()));

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', this.capturePrompt);
    }
  }

  async install(): Promise<'accepted' | 'dismissed' | null> {
    const prompt = this.deferredPrompt;
    if (!prompt) return null;

    this.clearPrompt();
    await prompt.prompt();
    const choice = await prompt.userChoice;
    return choice.outcome;
  }

  reset(): void {
    this.clearPrompt();
  }

  private readonly capturePrompt = (event: Event): void => {
    if (this.isInstalled()) return;
    event.preventDefault();
    this.deferredPrompt = event as BeforeInstallPromptEvent;
    this.canInstall.set(true);
  };

  private clearPrompt(): void {
    this.deferredPrompt = null;
    this.canInstall.set(false);
  }

  private detectStandaloneMode(): boolean {
    if (typeof window === 'undefined') return false;
    const displayModeStandalone = typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches;
    return displayModeStandalone ||
      (typeof navigator !== 'undefined' && (navigator as Navigator & { standalone?: boolean }).standalone === true);
  }
}
