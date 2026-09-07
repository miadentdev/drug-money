import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { routes } from './app.routes';
import { AppContextService } from './core/app-context.service';

async function createRouter(context: 'browser' | 'standalone') {
  await TestBed.configureTestingModule({
    providers: [
      provideRouter(routes),
      { provide: AppContextService, useValue: { isStandalone: () => context === 'standalone' } },
    ],
  }).compileComponents();

  return TestBed.inject(Router);
}

describe('routes', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('sends browser users to install pages', async () => {
    const router = await createRouter('browser');

    await router.navigateByUrl('/');
    expect(router.url).toBe('/install');

    await router.navigateByUrl('/budgets');
    expect(router.url).toBe('/install');

    await router.navigateByUrl('/budgets/new');
    expect(router.url).toBe('/install');
  });

  it('sends standalone users to budget pages', async () => {
    const router = await createRouter('standalone');

    await router.navigateByUrl('/');
    expect(router.url).toBe('/budgets');

    await router.navigateByUrl('/install');
    expect(router.url).toBe('/budgets');

    await router.navigateByUrl('/budgets/new');
    expect(router.url).toBe('/budgets/new');
  });
});
