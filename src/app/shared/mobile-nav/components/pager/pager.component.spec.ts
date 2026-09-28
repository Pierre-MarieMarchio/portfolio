import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PagerComponent } from './pager.component';
import { PagerPageComponent } from '../pager-page/pager-page.component';
import {
  MobileNavPlatformDouble,
  provideMobileNavPlatform,
} from '@testing/doubles/mobile-nav-platform.double';
import { provideTexts } from '@testing/fixtures/texts.fixture';

const WIDTH = 300;

@Component({
  imports: [PagerComponent, PagerPageComponent],
  template: `
    <app-pager [index]="index()" (indexChange)="choose($event)">
      @for (name of names; track name) {
        <app-pager-page>
          <a href="#{{ name }}">{{ name }}</a>
        </app-pager-page>
      }
    </app-pager>
  `,
})
class PagerHost {
  public readonly names = ['one', 'two', 'three', 'four'];
  public readonly index = signal(0);
  public readonly changes: number[] = [];

  public choose(index: number): void {
    this.changes.push(index);
    this.index.set(index);
  }
}

const layOut = (pager: HTMLElement, width: number): void => {
  Object.defineProperty(pager, 'clientWidth', {
    value: width,
    configurable: true,
  });
  Object.defineProperty(pager, 'scrollWidth', {
    value: 4 * width,
    configurable: true,
  });
};

const setup = async ({ index = 0 } = {}) => {
  const platform = new MobileNavPlatformDouble();
  TestBed.configureTestingModule({
    imports: [PagerHost],
    providers: [provideTexts(), provideMobileNavPlatform(platform)],
  });
  const fixture = TestBed.createComponent(PagerHost);
  fixture.componentInstance.index.set(index);
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  const pager = host.querySelector('app-pager') as HTMLElement;
  let scrollLeft = 0;
  Object.defineProperty(pager, 'scrollLeft', {
    get: () => scrollLeft,
    set: (left: number) => {
      scrollLeft = left;
    },
    configurable: true,
  });
  const scrollTo = vi.fn();
  Object.defineProperty(pager, 'scrollTo', {
    value: scrollTo,
    configurable: true,
  });
  layOut(pager, WIDTH);
  const pages = [...host.querySelectorAll<HTMLElement>('app-pager-page')];
  return {
    fixture,
    platform,
    pager,
    scrollTo,
    changes: fixture.componentInstance.changes,
    current: () => pages.findIndex((page) => !page.hasAttribute('inert')),
    reachable: () => pages.filter((page) => !page.hasAttribute('inert')),
    rest: async (left: number, events = ['scroll', 'scrollend']) => {
      scrollLeft = left;
      for (const type of events) {
        pager.dispatchEvent(new Event(type));
      }
      await fixture.whenStable();
    },
    pointTo: async (target: number) => {
      fixture.componentInstance.index.set(target);
      await fixture.whenStable();
    },
  };
};

describe('PagerComponent', () => {
  it('renders every page, and lets only the current one be reached', async () => {
    const { fixture, reachable } = await setup({ index: 1 });
    const pages = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll(
        'app-pager-page',
      ),
    ];

    expect(pages).toHaveLength(4);
    expect(reachable().map((page) => page.textContent?.trim())).toEqual([
      'two',
    ]);
    expect(pages.map((page) => page.getAttribute('aria-label'))).toEqual([
      'Page 1 sur 4',
      'Page 2 sur 4',
      'Page 3 sur 4',
      'Page 4 sur 4',
    ]);
  });

  it('says which page the reader swiped to only once the scroll has ended', async () => {
    const { changes, current, rest } = await setup();

    await rest(WIDTH, ['scroll']);

    expect(changes).toEqual([]);
    expect(current()).toBe(0);

    await rest(WIDTH, ['scrollend']);

    expect(changes).toEqual([1]);
    expect(current()).toBe(1);
  });

  it('says nothing when the scroll ends back on the current page, or between two', async () => {
    const { changes, current, rest } = await setup({ index: 1 });

    await rest(WIDTH);
    await rest(1.5 * WIDTH);

    expect(changes).toEqual([]);
    expect(current()).toBe(1);
  });

  it('scrolls smoothly, after the next frame, to a page set from outside, and does not echo it', async () => {
    const { platform, scrollTo, changes, current, rest, pointTo } =
      await setup();

    await pointTo(2);

    expect(scrollTo).not.toHaveBeenCalled();

    platform.frame();

    expect(scrollTo).toHaveBeenCalledWith({
      left: 2 * WIDTH,
      behavior: 'smooth',
    });
    expect(current()).toBe(0);

    await rest(2 * WIDTH);

    expect(current()).toBe(2);
    expect(changes).toEqual([]);
  });

  it('ignores a scroll that ends before its own scroll to a page set from outside starts', async () => {
    const { changes, rest, pointTo } = await setup({ index: 1 });

    await pointTo(3);
    await rest(WIDTH, ['scrollend']);

    expect(changes).toEqual([]);
  });

  it('jumps to the page without animation under reduced motion', async () => {
    const { platform, scrollTo, current, pointTo, fixture } = await setup();
    platform.isReduced = true;

    await pointTo(3);
    platform.frame();
    await fixture.whenStable();

    expect(scrollTo).toHaveBeenCalledWith({
      left: 3 * WIDTH,
      behavior: 'instant',
    });
    expect(current()).toBe(3);
  });

  it('settles 120 ms after the last scroll where the browser has no scrollend', async () => {
    const { platform, fixture, changes, rest } = await setup();
    platform.knowsScrollEnd = false;

    await rest(WIDTH, ['scroll']);
    await rest(2 * WIDTH, ['scroll']);
    platform.elapse(119);

    expect(changes).toEqual([]);

    platform.elapse(120);
    await fixture.whenStable();

    expect(changes).toEqual([2]);
  });

  it('stays on its page when its width changes', async () => {
    const { platform, pager, scrollTo, rest } = await setup();
    await rest(2 * WIDTH);
    platform.resize();
    scrollTo.mockClear();

    layOut(pager, 400);
    platform.resize();

    expect(scrollTo).toHaveBeenCalledWith({ left: 800, behavior: 'instant' });
  });
});
