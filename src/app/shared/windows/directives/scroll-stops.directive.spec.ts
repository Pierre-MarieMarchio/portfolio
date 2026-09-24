import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScrollStopsDirective } from './scroll-stops.directive';

const END = 500;

@Component({
  imports: [ScrollStopsDirective],
  template: `<div class="rail" appScrollStops><p>content</p></div>`,
})
class Host {}

const stubRange = (element: HTMLElement, range: number): (() => void) => {
  Object.defineProperty(element, 'clientHeight', {
    value: 800,
    configurable: true,
  });
  Object.defineProperty(element, 'scrollHeight', {
    value: 800 + range,
    configurable: true,
  });
  return () => {
    Reflect.deleteProperty(element, 'clientHeight');
    Reflect.deleteProperty(element, 'scrollHeight');
  };
};

describe('ScrollStopsDirective', () => {
  const restorers: (() => void)[] = [];

  afterEach(() => {
    while (restorers.length > 0) {
      restorers.pop()?.();
    }
  });

  const setup = async (range = END) => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const rail = (fixture.nativeElement as HTMLElement).querySelector(
      '.rail',
    ) as HTMLElement;
    restorers.push(stubRange(rail, range));
    const settledAt: number[] = [];
    rail.scrollTo = ((options: ScrollToOptions) => {
      const top = options.top ?? rail.scrollTop;
      settledAt.push(top);
      rail.scrollTop = top;
    }) as typeof rail.scrollTo;
    const scrollTo = (top: number): void => {
      rail.scrollTop = top;
      rail.dispatchEvent(new Event('scroll'));
    };
    const release = (): void => {
      rail.dispatchEvent(new Event('scrollend'));
    };
    return { rail, settledAt, scrollTo, release };
  };

  it('goes on to its end when let go on the way there', async () => {
    const { rail, settledAt, scrollTo, release } = await setup();

    scrollTo(200);
    release();

    expect(settledAt).toEqual([END]);
    expect(rail.dataset['rest']).toBe('end');
  });

  it('goes back to its start when pulled back from its end', async () => {
    const { rail, settledAt, scrollTo, release } = await setup();
    scrollTo(END);
    release();

    scrollTo(END - 150);
    release();

    expect(settledAt).toEqual([0]);
    expect(rail.dataset['rest']).toBe('start');
  });

  it('comes back to where it rested after a slight push', async () => {
    const { rail, settledAt, scrollTo, release } = await setup();

    scrollTo(20);
    release();
    scrollTo(END);
    release();
    scrollTo(END - 20);
    release();

    expect(settledAt).toEqual([0, END]);
    expect(rail.dataset['rest']).toBe('end');
  });

  it('says it rests at its end as soon as it gets there', async () => {
    const { rail, settledAt, scrollTo } = await setup();

    scrollTo(END);

    expect(rail.dataset['rest']).toBe('end');
    expect(settledAt).toEqual([]);
  });

  it('rests at its start when its content fits', async () => {
    const { rail, settledAt, release } = await setup(0);

    release();

    expect(rail.dataset['rest']).toBe('start');
    expect(settledAt).toEqual([]);
  });

  it('says nothing before it has moved', async () => {
    const { rail } = await setup();

    expect(rail.dataset['rest']).toBeUndefined();
  });
});
