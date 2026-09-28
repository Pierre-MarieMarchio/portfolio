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
    host.querySelector('[role="status"]')?.textContent?.trim() ?? '';
  return { fixture, host, named, names, note };
};

describe('WindowControlsComponent', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('names pin, fold and close by what they do, and emits each once per press', async () => {
    const { fixture, named } = await mount();
    const pins = recordOutput(fixture.componentInstance.pinToggled);
    const folds = recordOutput(fixture.componentInstance.foldToggled);
    const closes = recordOutput(fixture.componentInstance.closed);

    named(texts().pin).click();
    named(texts().fold).click();
    named(texts().close).click();

    expect([pins.length, folds.length, closes.length]).toEqual([1, 1, 1]);
  });

  it('says on the phone what pin and fold do there', async () => {
    stubViewport(390, 844);
    const { names } = await mount();

    expect(names()).toEqual([
      texts().phone.pin,
      texts().phone.fold,
      texts().close,
    ]);
  });

  it('presses the pin and renames it while pinned, and names the fold by its state', async () => {
    const { fixture, named } = await mount();

    expect(named(texts().pin).getAttribute('aria-pressed')).toBe('false');
    expect(named(texts().fold).getAttribute('aria-expanded')).toBe('true');

    fixture.componentRef.setInput('pinned', true);
    fixture.componentRef.setInput('folded', true);
    await fixture.whenStable();

    expect(named(texts().unpin).getAttribute('aria-pressed')).toBe('true');
    expect(named(texts().unfold).getAttribute('aria-expanded')).toBe('false');
  });

  it('says briefly that the window is kept or released once the pin is pressed', async () => {
    const { fixture, named, note } = await mount();

    expect(note()).toBe('');

    named(texts().pin).click();
    fixture.componentRef.setInput('pinned', true);
    await fixture.whenStable();

    expect(note()).toBe(texts().kept);

    named(texts().unpin).click();
    fixture.componentRef.setInput('pinned', false);
    await fixture.whenStable();

    expect(note()).toBe(texts().released);
  });

  it('says nothing when the pin changes without being pressed', async () => {
    const { fixture, named, note } = await mount();
    named(texts().pin).click();
    fixture.componentRef.setInput('pinned', true);
    await fixture.whenStable();

    fixture.componentRef.setInput('pinned', false);
    await fixture.whenStable();

    expect(note()).toBe('');
  });

  it('shows each name in a tooltip hidden from assistive technologies, never in a title', async () => {
    const { host } = await mount();
    const buttons = [...host.querySelectorAll('button')];

    expect(buttons).toHaveLength(3);
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

    expect(names()).toEqual([texts().pin, texts().fold]);
  });
});
