import { Injectable } from '@angular/core';

export type AppContext = 'browser' | 'standalone';

@Injectable({ providedIn: 'root' })
export class AppContextService {
  readonly context: AppContext = this.detectContext();

  isStandalone(): boolean {
    return this.context === 'standalone';
  }

  private detectContext(): AppContext {
    if (typeof window === 'undefined') return 'browser';

    const displayModeStandalone =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches;
    const iOSStandalone =
      typeof navigator !== 'undefined' &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    return displayModeStandalone || iOSStandalone ? 'standalone' : 'browser';
  }
}
