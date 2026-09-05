import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatToolbarModule, MatIconModule],
  template: `
    <div class="app-shell">
      <mat-toolbar color="primary" class="app-toolbar">
        <mat-icon aria-hidden="true">account_balance_wallet</mat-icon>
        <span>Drug Money</span>
      </mat-toolbar>
      <main class="app-main">
        <router-outlet />
      </main>
    </div>
  `,
  styleUrl: './app.scss',
})
export class App {}
