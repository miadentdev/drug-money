import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PersistentStorageService {
  private requested = false;

  request(): void {
    if (this.requested) return;
    this.requested = true;

    if (typeof navigator === 'undefined' || !navigator.storage?.persist) return;
    void navigator.storage.persist().catch(() => undefined);
  }
}
