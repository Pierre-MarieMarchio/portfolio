import { TestBed } from '@angular/core/testing';
import { WINDOW_TEXTS, WindowTexts } from '../../ports';
import { WindowControlsComponent } from './window-controls.component';
import { stubViewport } from '@testing/doubles/browser.double';
import { recordOutput } from '@testing/fixtures/testbed.fixture';
import { provideTexts } from '@testing/fixtures/texts.fixture';

const texts = (): WindowTexts => TestBed.inject(WINDOW_TEXTS)();

const mount = async (inputs: Record<string, unknown> = {}) => {
  TestBed.configureTestingModule({
    imports: [WindowControlsComponent],
    providers: [provideTexts()],
  });
  const fixture = TestBed.createComponent(WindowControlsComponent);
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value);
  }
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  const named = (name: string): HTMLButtonElement => {
    const found = [...host.querySelectorAll('button')].find(
      (button) => button.getAttribute('aria-label') === name,
    );
    if (!found) {
      throw new Error(`expected a button named « ${name} »`);
    }
    return found;
  };
  const names = (): string[] =>
    [...host.querySelectorAll('button')].map(
      (button) => button.getAttribute('aria-label') ?? '',
    );
  const note = (): string =>
    host.querySelector('output')?.textContent?.trim() ?? '';
  return { fixture, host, named, names, note };
};

describe('WindowControlsComponent', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('offers only the close outside the phone format', async () => {
    const { names } = await mount();

    expect(names()).toEqual([texts().close]);
  });

  it('offers minimize, then pin, then close when asked, each emitting its own output', async () => {
    const { fixture, named, names } = await mount({
      minimizable: true,
      pinned: false,
    });
    const minimized = recordOutput(fixture.componentInstance.minimized);
    const pins = recordOutput(fixture.componentInstance.pinToggled);

    expect(names()).toEqual([texts().minimize, texts().pin, texts().close]);

    named(texts().minimize).click();
    named(texts().pin).click();

    expect(minimized).toHaveLength(1);
    expect(pins).toHaveLength(1);
  });

  it('tells a pinned window from an unpinned one by aria-pressed, never by its name', async () => {
    const { fixture, named } = await mount({ pinned: false });

    expect(named(texts().pin).getAttribute('aria-pressed')).toBe('false');

    fixture.componentRef.setInput('pinned', true);
    await fixture.whenStable();

    expect(named(texts().pin).getAttribute('aria-pressed')).toBe('true');
  });

  it('offers neither pin nor fold on the phone, only the close', async () => {
    stubViewport(390, 844);
    const { fixture, named, names } = await mount();
    const closes = recordOutput(fixture.componentInstance.closed);

    expect(names()).toEqual([texts().close]);

    named(texts().close).click();

    expect(closes).toHaveLength(1);
  });

  it('shows each name in a tooltip hidden from assistive technologies, never in a title', async () => {
    stubViewport(390, 844);
    const { host } = await mount();
    const buttons = [...host.querySelectorAll('button')];

    expect(buttons).toHaveLength(1);
    for (const button of buttons) {
      const tip = button.querySelector('.tip');
      expect(tip?.textContent?.trim()).toBe(button.getAttribute('aria-label'));
      expect(tip?.getAttribute('aria-hidden')).toBe('true');
      expect(button.hasAttribute('title')).toBe(false);
    }
  });

  it('names the close button after where the caller says it leads', async () => {
    const { fixture, named, names } = await mount({
      closeLabel: 'Fermer et revenir aux projets',
    });

    expect(named('Fermer et revenir aux projets')).toBeTruthy();

    fixture.componentRef.setInput('closable', false);
    await fixture.whenStable();

    expect(names()).toEqual([]);
  });
});
