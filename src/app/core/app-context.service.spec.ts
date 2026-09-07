import { AppContextService } from './app-context.service';

describe('AppContextService', () => {
  afterEach(() => {
    delete (window.navigator as Navigator & { standalone?: boolean }).standalone;
    Reflect.deleteProperty(window, 'matchMedia');
    vi.restoreAllMocks();
  });

  it('detects standalone mode through display-mode media queries', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
      matches: true,
      media: '(display-mode: standalone)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      } as unknown as MediaQueryList)),
    });

    expect(new AppContextService().context).toBe('standalone');
  });

  it('detects standalone mode through the iOS navigator flag', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
      matches: false,
      media: '(display-mode: standalone)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      } as unknown as MediaQueryList)),
    });
    Object.defineProperty(window.navigator, 'standalone', {
      configurable: true,
      value: true,
    });

    expect(new AppContextService().isStandalone()).toBe(true);
  });

  it('defaults to browser mode when neither standalone signal is present', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
      matches: false,
      media: '(display-mode: standalone)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      } as unknown as MediaQueryList)),
    });

    expect(new AppContextService().context).toBe('browser');
  });
});
