import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideStatewise } from 'ngx-statewise';
import { ObservatoryManager } from '@app/features/observatory/states';
import { HomeRevealService } from '../../services';
import { OBSERVATORY_TEXTS } from '../../ports';
import { stubMedia } from '@testing/doubles/browser.double';
import { ARRIVAL_AT } from '@testing/fixtures/observatory.fixture';
import { provideTexts } from '@testing/fixtures/texts.fixture';
import { IntroSkipComponent } from './intro-skip.component';

const mount = async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  stubMedia(() => false);
  document.documentElement.style.setProperty('--arrival-at', ARRIVAL_AT.css);
  TestBed.configureTestingModule({
    imports: [IntroSkipComponent],
    providers: [
      { provide: PLATFORM_ID, useValue: 'browser' },
      provideStatewise(),
      HomeRevealService,
      provideTexts(),
    ],
  });
  TestBed.inject(ObservatoryManager).syncRoute('home');
  const reveal = TestBed.inject(HomeRevealService);
  const fixture = TestBed.createComponent(IntroSkipComponent);
  await fixture.whenStable();
  return { fixture, host: fixture.nativeElement as HTMLElement, reveal };
};

describe('IntroSkipComponent', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--arrival-at');
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('shows nothing before the intro starts holding', async () => {
    const { host } = await mount();

    expect(host.querySelector('.skip')).toBeNull();
  });

  it('shows the button once the intro is withheld, named for the reader', async () => {
    const { fixture, host, reveal } = await mount();

    reveal.start(() => {});
    await fixture.whenStable();

    expect(host.querySelector('.skip')?.textContent?.trim()).toBe(
      TestBed.inject(OBSERVATORY_TEXTS)().intro.skip,
    );
  });

  it('ends the intro at once when pressed, and disappears', async () => {
    const { fixture, host, reveal } = await mount();
    reveal.start(() => {});
    await fixture.whenStable();

    host.querySelector<HTMLButtonElement>('.skip')?.click();
    await fixture.whenStable();

    expect(reveal.arrival()).toBe('shown');
    expect(host.querySelector('.skip')).toBeNull();
  });
});
