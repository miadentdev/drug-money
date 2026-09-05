import { Injectable, inject, signal } from '@angular/core';
import { BudgetStore } from '../data-access/budget-store.service';
import { GOOGLE_CLIENT_ID } from './google-drive.config';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(options: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }): { requestAccessToken(options?: { prompt?: string }): void };
        };
      };
    };
  }
}

function xml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function worksheet(name: string, headers: string[], rows: Array<Array<unknown>>) {
  const header = `<Row>${headers.map((cell) => `<Cell><Data ss:Type="String">${xml(cell)}</Data></Cell>`).join('')}</Row>`;
  const body = rows.map((row) => `<Row>${row.map((cell) => `<Cell><Data ss:Type="String">${xml(cell)}</Data></Cell>`).join('')}</Row>`).join('');
  return `<Worksheet ss:Name="${xml(name)}"><Table>${header}${body}</Table></Worksheet>`;
}

function buildWorkbook(snapshot: Awaited<ReturnType<BudgetStore['exportSnapshot']>>) {
  const budgetRows = snapshot.budgets.map((budget) => [
    budget.id, budget.name, (budget.total / 100).toFixed(2), budget.createdAt, budget.updatedAt,
  ]);
  const transactionRows = snapshot.transactions.map((transaction) => [
    transaction.id, transaction.budgetId, transaction.type, (transaction.amount / 100).toFixed(2), transaction.note ?? '', transaction.createdAt,
  ]);
  return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="Header"><Font ss:Bold="1"/></Style></Styles>${worksheet('Budgets', ['ID', 'Name', 'Balance (EUR)', 'Created', 'Updated'], budgetRows)}${worksheet('Transactions', ['ID', 'Budget ID', 'Type', 'Amount (EUR)', 'Note', 'Created'], transactionRows)}</Workbook>`;
}

@Injectable({ providedIn: 'root' })
export class GoogleDriveService {
  private readonly store = inject(BudgetStore);
  readonly isUploading = signal(false);
  readonly error = signal('');
  readonly uploadedFileUrl = signal('');

  async uploadDatabase() {
    this.error.set('');
    this.uploadedFileUrl.set('');
    if (GOOGLE_CLIENT_ID.startsWith('YOUR_')) {
      this.error.set('Add your Google OAuth Web client ID in google-drive.config.ts first.');
      return;
    }
    this.isUploading.set(true);
    try {
      const accessToken = await this.getAccessToken();
      const workbook = buildWorkbook(await this.store.exportSnapshot());
      const boundary = `drug-money-${crypto.randomUUID()}`;
      const metadata = { name: `drug-money-${new Date().toISOString().slice(0, 10)}.xls` };
      const body = new Blob([
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
        JSON.stringify(metadata),
        `\r\n--${boundary}\r\nContent-Type: application/vnd.ms-excel\r\n\r\n`,
        workbook,
        `\r\n--${boundary}--`,
      ]);
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      });
      if (!response.ok) throw new Error('Google Drive could not accept the upload.');
      const file = await response.json() as { webViewLink?: string };
      this.uploadedFileUrl.set(file.webViewLink ?? 'https://drive.google.com/drive/my-drive');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Google Drive upload failed.');
    } finally {
      this.isUploading.set(false);
    }
  }

  private async getAccessToken() {
    await this.loadGoogleIdentityServices();
    return new Promise<string>((resolve, reject) => {
      const client = window.google?.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response) => response.access_token ? resolve(response.access_token) : reject(new Error('Google authorization was cancelled.')),
      });
      if (!client) reject(new Error('Google authorization could not be loaded.'));
      else client.requestAccessToken({ prompt: 'consent' });
    });
  }

  private loadGoogleIdentityServices() {
    if (window.google?.accounts.oauth2) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Google authorization could not be loaded.'));
      document.head.appendChild(script);
    });
  }
}
