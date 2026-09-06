import { SwUpdate } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { PwaUpdateService } from './pwa-update.service';

function createService(enabled: boolean, checkForUpdate = vi.fn(), activateUpdate = vi.fn()) {
  const versionUpdates = new Subject<any>();
  const snackBar = { open: vi.fn() };
  const swUpdate = {
    isEnabled: enabled,
    versionUpdates,
    checkForUpdate,
    activateUpdate,
  } as unknown as SwUpdate;
  return { service: new PwaUpdateService(swUpdate, snackBar as any), snackBar, versionUpdates };
}

describe('PwaUpdateService', () => {
  it('stays idle when the service worker is disabled', async () => {
    const check = vi.fn();
    const { service, snackBar } = createService(false, check);

    await service.checkForUpdates();

    expect(check).not.toHaveBeenCalled();
    expect(service.state()).toBe('idle');
    expect(snackBar.open).toHaveBeenCalledWith("You're already up to date.", undefined, { duration: 3000 });
  });

  it('reports that the app is current when no update is found', async () => {
    const { service, snackBar } = createService(true, vi.fn().mockResolvedValue(false));

    await service.checkForUpdates();

    expect(service.state()).toBe('idle');
    expect(snackBar.open).toHaveBeenCalledWith("You're already up to date.", undefined, expect.anything());
  });

  it('exposes an available update when the check finds one', async () => {
    const { service } = createService(true, vi.fn().mockResolvedValue(true));

    await service.checkForUpdates();

    expect(service.state()).toBe('available');
  });

  it('prevents duplicate update activation and reports activation failure', async () => {
    let rejectActivation!: (error: Error) => void;
    const activate = vi.fn(() => new Promise<void>((_, reject) => { rejectActivation = reject; }));
    const { service } = createService(true, vi.fn().mockResolvedValue(true), activate);
    await service.checkForUpdates();

    const first = service.update();
    const second = service.update();
    expect(activate).toHaveBeenCalledTimes(1);
    rejectActivation(new Error('activation failed'));
    await Promise.all([first, second]);

    expect(service.state()).toBe('error');
  });
});
