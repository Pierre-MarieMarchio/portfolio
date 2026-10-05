import { HapticsService } from './haptics.service';
import { injectOn } from '@testing/fixtures/testbed.fixture';

describe('HapticsService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, 'vibrate');
  });

  it('is inert on the server: never vibrates', () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrate,
      configurable: true,
    });

    injectOn(HapticsService, 'server').vibrate(10);

    expect(vibrate).not.toHaveBeenCalled();
  });

  it('vibrates for the given duration where the browser can', () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrate,
      configurable: true,
    });

    injectOn(HapticsService, 'browser').vibrate(10);

    expect(vibrate).toHaveBeenCalledExactlyOnceWith(10);
  });

  it('does nothing where the browser has no vibration', () => {
    const haptics = injectOn(HapticsService, 'browser');

    expect(Reflect.has(navigator, 'vibrate')).toBe(false);
    expect(() => {
      haptics.vibrate(10);
    }).not.toThrow();
  });

  it('does nothing more when the browser refuses', () => {
    Object.defineProperty(navigator, 'vibrate', {
      value: () => {
        throw new Error('refused');
      },
      configurable: true,
    });

    expect(() => {
      injectOn(HapticsService, 'browser').vibrate(10);
    }).not.toThrow();
  });
});
