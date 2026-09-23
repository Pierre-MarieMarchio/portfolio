import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IntroCardComponent } from './intro-card.component';
import { provideTexts } from '@testing/texts';

/**
 * A media query list that never changes: the reduced-motion truth is fixed
 * for the lifetime of a test, so a static answer is enough and keeps the
 * listener side (`addEventListener`) a no-op.
 */
const quietMedia =
  (matches: (query: string) => boolean) => (query: string) => ({
    matches: matches(query),
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  });

describe('IntroCardComponent', () => {
  const mount = async (
    options: { platform?: string; reducedMotion?: boolean } = {},
  ) => {
    // jsdom has no matchMedia of its own: every mount stubs it, reduced
    // motion aside, exactly like the other components that read it through
    // BrowserEnvironment.
    vi.stubGlobal(
      'matchMedia',
      quietMedia(
        (query) =>
          query === '(prefers-reduced-motion: reduce)' &&
          !!options.reducedMotion,
      ),
    );
    // The global stylesheet is not loaded here: the token the card reads
    // its length from is set by hand, as `_tokens.scss` sets it.
    document.documentElement.style.setProperty('--intro-duration', '5600ms');
    TestBed.configureTestingModule({
      imports: [IntroCardComponent],
      providers: [
        provideTexts(),
        { provide: PLATFORM_ID, useValue: options.platform ?? 'browser' },
      ],
    });
    const fixture = TestBed.createComponent(IntroCardComponent);
    await fixture.whenStable();
    return { fixture, host: fixture.nativeElement as HTMLElement };
  };

  afterEach(() => {
    document.documentElement.style.removeProperty('--intro-duration');
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows a hidden card with the identity, the role and the brand, in order', async () => {
    // Only setTimeout/clearTimeout are faked: Angular's zoneless scheduler
    // relies on microtasks, and requestAnimationFrame is untouched, so
    // fixture.whenStable() keeps working normally underneath.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { host } = await mount();
    const card = host.querySelector('.card');

    expect(card).not.toBeNull();
    expect(card?.getAttribute('aria-hidden')).toBe('true');

    const text = card?.textContent ?? '';
    const nameAt = text.indexOf('Pierre-Marie Marchio');
    const roleAt = text.indexOf('Concepteur développeur d’applications');
    const brandAt = text.indexOf('Portfolio');
    expect(nameAt).toBeGreaterThanOrEqual(0);
    expect(roleAt).toBeGreaterThan(nameAt);
    expect(brandAt).toBeGreaterThan(roleAt);
  });

  it('keeps the card up to 5599 ms, and removes it at 5600 ms', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { host, fixture } = await mount();

    vi.advanceTimersByTime(5599);
    await fixture.whenStable();
    expect(host.querySelector('.card')).not.toBeNull();

    vi.advanceTimersByTime(1);
    await fixture.whenStable();
    expect(host.querySelector('.card')).toBeNull();
  });

  it.each(['pointerdown', 'keydown', 'wheel', 'touchstart'])(
    'removes the card at once on a %s dispatched on the window',
    async (type) => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      const { host, fixture } = await mount();
      expect(host.querySelector('.card')).not.toBeNull();

      window.dispatchEvent(new Event(type));
      await fixture.whenStable();

      expect(host.querySelector('.card')).toBeNull();
    },
  );

  it('stays gone and throws nothing once removed, whatever event or time follows', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { host, fixture } = await mount();

    window.dispatchEvent(new Event('keydown'));
    await fixture.whenStable();
    expect(host.querySelector('.card')).toBeNull();

    expect(() => {
      window.dispatchEvent(new Event('pointerdown'));
      window.dispatchEvent(new Event('wheel'));
      window.dispatchEvent(new Event('touchstart'));
      vi.advanceTimersByTime(60_000);
    }).not.toThrow();
    await fixture.whenStable();

    expect(host.querySelector('.card')).toBeNull();
  });

  it('never shows the card when the reader asked for less motion', async () => {
    const { host } = await mount({ reducedMotion: true });
    expect(host.querySelector('.card')).toBeNull();
  });

  it('renders the card on the server, and nothing there removes it', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { host, fixture } = await mount({ platform: 'server' });
    expect(host.querySelector('.card')).not.toBeNull();

    vi.advanceTimersByTime(10_000);
    window.dispatchEvent(new Event('keydown'));
    await fixture.whenStable();

    expect(host.querySelector('.card')).not.toBeNull();
  });
});
