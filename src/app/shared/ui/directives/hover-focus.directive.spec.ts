import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HoverFocusDirective } from './hover-focus.directive';

@Component({
  imports: [HoverFocusDirective],
  template: `<button
    type="button"
    appHoverFocus
    (entered)="heard.push('entered')"
    (exited)="heard.push('exited')"
  >
    x
  </button>`,
})
class Host {
  public readonly heard: string[] = [];
}

const stubHover = (canHover: boolean): void => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(hover: none)' && !canHover,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
};

const mount = async (canHover = true) => {
  stubHover(canHover);
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const button = (fixture.nativeElement as HTMLElement).querySelector('button');
  if (!button) {
    throw new Error('expected the button');
  }
  const pointAt = (
    type: 'pointerenter' | 'pointerleave',
    pointerType: string,
  ): void => {
    button.dispatchEvent(new PointerEvent(type, { pointerType }));
  };
  const press = (pointerType: string): void => {
    button.dispatchEvent(new PointerEvent('pointerdown', { pointerType }));
  };
  return { heard: fixture.componentInstance.heard, button, pointAt, press };
};

describe('HoverFocusDirective', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it('enters and exits with a mouse', async () => {
    const { heard, pointAt } = await mount();

    pointAt('pointerenter', 'mouse');
    pointAt('pointerleave', 'mouse');

    expect(heard).toEqual(['entered', 'exited']);
  });

  it('ignores a touch and a pen', async () => {
    const { heard, pointAt } = await mount();

    pointAt('pointerenter', 'touch');
    pointAt('pointerleave', 'touch');
    pointAt('pointerenter', 'pen');
    pointAt('pointerleave', 'pen');

    expect(heard).toEqual([]);
  });

  it('ignores the mouse a hoverless screen reports after a touch', async () => {
    const { heard, pointAt } = await mount(false);

    pointAt('pointerenter', 'mouse');
    pointAt('pointerleave', 'mouse');

    expect(heard).toEqual([]);
  });

  it('enters and exits with a keyboard focus, even without hover', async () => {
    const { heard, button } = await mount(false);

    button.focus();
    button.blur();

    expect(heard).toEqual(['entered', 'exited']);
  });

  it('ignores the focus a touch gives, and the blur that follows', async () => {
    const { heard, button, press } = await mount();

    press('touch');
    button.focus();
    button.blur();

    expect(heard).toEqual([]);
  });

  it('enters with the focus a mouse press gives', async () => {
    const { heard, button, press } = await mount();

    press('mouse');
    button.focus();
    button.blur();

    expect(heard).toEqual(['entered', 'exited']);
  });

  it('enters with a keyboard focus after a touch has left', async () => {
    const { heard, button, press } = await mount();

    press('touch');
    button.focus();
    button.blur();
    button.focus();

    expect(heard).toEqual(['entered']);
  });
});
