import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet, MatToolbarModule, MatIconModule, MatButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly swUpdate = inject(SwUpdate);

  async updateCache(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      window.location.reload();
      return;
    }

    try {
      await this.swUpdate.checkForUpdate();
      await this.swUpdate.activateUpdate();
    } finally {
      window.location.reload();
    }
  }
}
