import { AppContextService } from './app-context.service';
import { PwaInstallService } from './pwa-install.service';

describe('PwaInstallService', () => {
  it('exposes a fresh beforeinstallprompt event and clears it after install', async () => {
    const service = new PwaInstallService({ isStandalone: () => false } as AppContextService);
    const prompt = vi.fn(async () => undefined);
    const event = Object.assign(new Event('beforeinstallprompt'), {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    });

    window.dispatchEvent(event);
    expect(service.canInstall()).toBe(true);

    await service.install();

    expect(prompt).toHaveBeenCalledOnce();
    expect(service.canInstall()).toBe(false);
  });

  it('resets application-controlled install state without affecting the browser', () => {
    const service = new PwaInstallService({ isStandalone: () => false } as AppContextService);
    const event = Object.assign(new Event('beforeinstallprompt'), {
      prompt: async () => undefined,
      userChoice: Promise.resolve({ outcome: 'dismissed' as const }),
    });

    window.dispatchEvent(event);
    service.reset();

    expect(service.canInstall()).toBe(false);
  });
});
