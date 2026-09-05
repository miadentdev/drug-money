import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet, MatToolbarModule, MatIconModule],
  template: `
    <div class="app-shell">
      <mat-toolbar class="app-toolbar">
        <a class="brand" routerLink="/budgets" aria-label="Drug Money home">
          <span class="brand-mark"><mat-icon aria-hidden="true">[]</mat-icon></span>
          <span class="brand-name">Drug Money</span>
        </a>
        <span class="toolbar-spacer"></span>
        <span class="offline-status"><span class="status-dot"></span> Saved on device</span>
      </mat-toolbar>
      <main class="app-main">
        <router-outlet />
      </main>
    </div>
  `,
  styleUrl: './app.scss',
})
export class App {}
