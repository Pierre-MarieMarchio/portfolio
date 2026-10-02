import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { WINDOW_FOLD, WindowFold } from '../../ports';
import { provideTexts } from '@testing/fixtures/texts.fixture';
import { WindowGripComponent } from './window-grip.component';

const NOTHING = (): void => {};

const mount = async (fold: WindowFold | null) => {
  TestBed.configureTestingModule({
    imports: [WindowGripComponent],
    providers: [
      provideTexts(),
      ...(fold ? [{ provide: WINDOW_FOLD, useValue: fold }] : []),
    ],
  });
  const fixture = TestBed.createComponent(WindowGripComponent);
  await fixture.whenStable();
  return {
    fixture,
    grip: (fixture.nativeElement as HTMLElement).querySelector(
      'button.grip',
    ) as HTMLButtonElement,
  };
};

const foldOf = (isActive = true) => {
  const isFolded = signal(false);
  const toggle = vi.fn(() => {
    isFolded.update((folded) => !folded);
  });
  const fold: WindowFold = {
    isActive: () => isActive,
    isFolded: () => isFolded(),
    toggle,
    hold: () => NOTHING,
  };
  return { fold, isFolded, toggle };
};

describe('WindowGripComponent', () => {
  it('offers to lower the window while it is up, as a button', async () => {
    const { grip } = await mount(foldOf().fold);

    expect(grip.type).toBe('button');
    expect(grip.getAttribute('aria-label')).toBe('Baisser la fenêtre');
    expect(grip.getAttribute('aria-expanded')).toBe('true');
  });

  it('asks the sheet to fold on a touch, and offers to raise the window once it is folded', async () => {
    const { fold, toggle } = foldOf();
    const { fixture, grip } = await mount(fold);

    grip.click();
    await fixture.whenStable();

    expect(toggle).toHaveBeenCalledOnce();
    expect(grip.getAttribute('aria-label')).toBe('Remonter la fenêtre');
    expect(grip.getAttribute('aria-expanded')).toBe('false');
  });

  it('never reads as folded when the sheet is not held', async () => {
    const { fold, isFolded } = foldOf(false);
    isFolded.set(true);
    const { grip } = await mount(fold);

    expect(grip.getAttribute('aria-expanded')).toBe('true');
  });

  it('does nothing without a sheet to fold', async () => {
    const { fixture, grip } = await mount(null);

    grip.click();
    await fixture.whenStable();

    expect(grip.getAttribute('aria-label')).toBe('Baisser la fenêtre');
  });
});
