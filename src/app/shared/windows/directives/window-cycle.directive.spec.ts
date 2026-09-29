import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { WindowStackService } from '../services/window-stack.service';
import { StackedWindowDirective } from './stacked-window.directive';
import { WindowCycleDirective } from './window-cycle.directive';

@Component({
  imports: [StackedWindowDirective, WindowCycleDirective],
  providers: [WindowStackService],
  template: `
    <main appWindowCycle>
      <input />
      <div appStackedWindow="a"><h2 tabindex="-1" data-window-title>A</h2></div>
      <div appStackedWindow="b"><h2 tabindex="-1" data-window-title>B</h2></div>
      <div appStackedWindow="c"><h2 tabindex="-1" data-window-title>C</h2></div>
    </main>
  `,
})
class Host {}

const press = (key: string, extra: Partial<KeyboardEventInit> = {}): void => {
  (document.activeElement ?? document.body).dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...extra,
    }),
  );
};

const mount = async (shown: readonly boolean[]) => {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  const host = fixture.nativeElement as HTMLElement;
  document.body.append(host);
  const windows = [...host.querySelectorAll('div')];
  for (const [index, element] of windows.entries()) {
    element.dataset['shown'] = String(shown[index] ?? false);
  }
  const input = host.querySelector('input') as HTMLInputElement;
  await fixture.whenStable();
  return { fixture, windows, input };
};

const focusedTitle = (): string | null =>
  document.activeElement?.textContent ?? null;

describe('WindowCycleDirective', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('does nothing when no window is shown', async () => {
    await mount([false, false, false]);

    press('F6');

    expect(document.activeElement).toBe(document.body);
  });

  it('focuses the title of the next shown window on F6, front to back, wrapping, and brings it forward', async () => {
    const { windows } = await mount([true, true, true]);

    press('F6');
    expect(focusedTitle()).toBe('B');

    press('F6');
    expect(focusedTitle()).toBe('C');

    press('F6', { shiftKey: true });
    expect(document.activeElement).toBe(windows[0]?.querySelector('h2'));
  });

  it('does the same as F6 with Ctrl+F6', async () => {
    await mount([true, true, true]);

    press('F6', { ctrlKey: true });

    expect(focusedTitle()).toBe('B');
  });

  it('does not take the key when the focus sits in a form field', async () => {
    const { input } = await mount([true, true, true]);
    input.focus();

    press('F6');

    expect(document.activeElement).toBe(input);
  });
});
