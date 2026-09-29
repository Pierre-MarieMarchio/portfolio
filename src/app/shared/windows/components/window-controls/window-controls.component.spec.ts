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

  it('hides the pin from the bar outside the phone format', async () => {
    const { names } = await mount();

    expect(names()).toEqual([texts().close]);
  });

  it('says on the phone what pin and fold do there, and emits each once per press', async () => {
    stubViewport(390, 844);
    const { fixture, named, names } = await mount({ foldable: true });
    const pins = recordOutput(fixture.componentInstance.pinToggled);
    const folds = recordOutput(fixture.componentInstance.foldToggled);
    const closes = recordOutput(fixture.componentInstance.closed);

    expect(names()).toEqual([
      texts().phone.pin,
      texts().phone.fold,
      texts().close,
    ]);

    named(texts().phone.pin).click();
    named(texts().phone.fold).click();
    named(texts().close).click();

    expect([pins.length, folds.length, closes.length]).toEqual([1, 1, 1]);
  });

  it('presses the pin and renames it while pinned, and names the fold by its state', async () => {
    stubViewport(390, 844);
    const { fixture, named } = await mount({ foldable: true });

    expect(named(texts().phone.pin).getAttribute('aria-pressed')).toBe('false');
    expect(named(texts().phone.fold).getAttribute('aria-expanded')).toBe(
      'true',
    );

    fixture.componentRef.setInput('pinned', true);
    fixture.componentRef.setInput('folded', true);
    await fixture.whenStable();

    expect(named(texts().phone.unpin).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(named(texts().phone.unfold).getAttribute('aria-expanded')).toBe(
      'false',
    );
  });

  it('says briefly that the window is kept or released once the pin is pressed, on the phone', async () => {
    stubViewport(390, 844);
    const { fixture, named, note } = await mount();

    expect(note()).toBe('');

    named(texts().phone.pin).click();
    fixture.componentRef.setInput('pinned', true);
    await fixture.whenStable();

    expect(note()).toBe(texts().kept);

    named(texts().phone.unpin).click();
    fixture.componentRef.setInput('pinned', false);
    await fixture.whenStable();

    expect(note()).toBe(texts().released);
  });

  it('says nothing when the pin changes without being pressed, on the phone', async () => {
    stubViewport(390, 844);
    const { fixture, named, note } = await mount();
    named(texts().phone.pin).click();
    fixture.componentRef.setInput('pinned', true);
    await fixture.whenStable();

    fixture.componentRef.setInput('pinned', false);
    await fixture.whenStable();

    expect(note()).toBe('');
  });

  it('shows each name in a tooltip hidden from assistive technologies, never in a title', async () => {
    stubViewport(390, 844);
    const { host } = await mount({ foldable: true });
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

    expect(names()).toEqual([]);
  });
});
