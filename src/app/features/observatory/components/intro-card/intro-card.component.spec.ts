import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OBSERVATORY_TEXTS } from '../../ports';
import { IntroCardComponent } from './intro-card.component';
import { stubMedia } from '@testing/doubles/browser.double';
import { INTRO_DURATION } from '@testing/fixtures/observatory.fixture';
import { provideTexts } from '@testing/fixtures/texts.fixture';

const mount = async (
  options: { platform?: string; reducedMotion?: boolean } = {},
) => {
  stubMedia(
    (query) =>
      query === '(prefers-reduced-motion: reduce)' && !!options.reducedMotion,
  );
  document.documentElement.style.setProperty(
    '--intro-duration',
    INTRO_DURATION.css,
  );
  TestBed.configureTestingModule({
    imports: [IntroCardComponent],
    providers: [
      provideTexts(),
      { provide: PLATFORM_ID, useValue: options.platform ?? 'browser' },
    ],
  });
  const fixture = TestBed.createComponent(IntroCardComponent);
  await fixture.whenStable();
  return {
    fixture,
    host: fixture.nativeElement as HTMLElement,
    home: TestBed.inject(OBSERVATORY_TEXTS)().home,
  };
};

describe('IntroCardComponent', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--intro-duration');
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows a hidden card with the identity, the role and the brand, in order', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { host, home } = await mount();
    const card = host.querySelector('.card');

    expect(card).not.toBeNull();
    expect(card?.getAttribute('aria-hidden')).toBe('true');

    const text = card?.textContent ?? '';
    const nameAt = text.indexOf(home.name);
    const roleAt = text.indexOf(home.trade);
    const brandAt = text.indexOf(home.brand);
    expect(nameAt).toBeGreaterThanOrEqual(0);
    expect(roleAt).toBeGreaterThan(nameAt);
    expect(brandAt).toBeGreaterThan(roleAt);
  });

  it('keeps the card up to the last millisecond of the intro, and removes it at its end', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { host, fixture } = await mount();

    vi.advanceTimersByTime(INTRO_DURATION.ms - 1);
    await fixture.whenStable();
    expect(host.querySelector('.card')).not.toBeNull();

    vi.advanceTimersByTime(1);
    await fixture.whenStable();
    expect(host.querySelector('.card')).toBeNull();
  });

  it('removes the card at the first gesture, and it stays gone and throws nothing, whatever event or time follows', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { host, fixture } = await mount();
    expect(host.querySelector('.card')).not.toBeNull();

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
