import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DoublePressDirective } from './double-press.directive';
import { tap as tapOn } from '@testing/fixtures/pointer.fixture';

type PointerKind = 'mouse' | 'touch' | 'pen';

interface Press {
  readonly x?: number;
  readonly y?: number;
  readonly at: number;
  readonly kind?: PointerKind;
}

@Component({
  imports: [DoublePressDirective],
  template: `
    <div class="bar" appDoublePress (doublePressed)="count = count + 1">
      <span class="grip">grip</span>
      <button type="button">button</button>
    </div>
  `,
})
class Host {
  public count = 0;
}

const setup = async () => {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  const grip = host.querySelector('.grip') as HTMLElement;
  const button = host.querySelector('button') as HTMLElement;
  const tap = (
    press: Press,
    release: Partial<Press> = {},
    on: Element = grip,
  ): void => {
    tapOn(on, { x: 100, y: 20, ...press }, release);
  };
  const doubleClick = (on: Element = grip): void => {
    on.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
  };
  const count = (): number => fixture.componentInstance.count;
  return { grip, button, tap, doubleClick, count };
};

describe('DoublePressDirective', () => {
  it.each<
    readonly [string, readonly (readonly [Press, Partial<Press>?])[], number]
  >([
    ['answers two taps in a row', [[{ at: 1000 }], [{ x: 108, at: 1250 }]], 1],
    [
      'answers a pen as it answers a finger',
      [[{ at: 1000, kind: 'pen' }], [{ at: 1200, kind: 'pen' }]],
      1,
    ],
    [
      'starts over after answering',
      [[{ at: 1000 }], [{ at: 1100 }], [{ at: 1200 }]],
      1,
    ],
    [
      'does not answer two taps too far apart in time',
      [[{ at: 1000 }], [{ at: 1400 }]],
      0,
    ],
    [
      'does not answer two taps too far apart on the screen',
      [[{ at: 1000 }], [{ x: 160, at: 1200 }]],
      0,
    ],
    [
      'does not count a drag as a tap',
      [[{ at: 1000 }, { x: 180 }], [{ at: 1200 }]],
      0,
    ],
  ])('%s', async (_, taps, answers) => {
    const { tap, count } = await setup();

    for (const [press, release] of taps) {
      tap(press, release);
    }

    expect(count()).toBe(answers);
  });

  it('does not count a tap on a control', async () => {
    const { tap, button, count } = await setup();

    tap({ at: 1000 }, {}, button);
    tap({ at: 1200 });

    expect(count()).toBe(0);
  });

  it('answers once when the browser adds a dblclick to two taps', async () => {
    const { tap, doubleClick, count } = await setup();

    tap({ at: 1000 });
    tap({ at: 1200 });
    doubleClick();

    expect(count()).toBe(1);
  });

  it('answers a double click of the mouse, and not its presses', async () => {
    const { tap, doubleClick, count } = await setup();

    tap({ at: 1000, kind: 'mouse' });
    tap({ at: 1100, kind: 'mouse' });
    doubleClick();

    expect(count()).toBe(1);
  });

  it('does not answer a double click on a control', async () => {
    const { button, doubleClick, count } = await setup();

    doubleClick(button);

    expect(count()).toBe(0);
  });
});
