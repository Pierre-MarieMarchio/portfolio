import { Component, ElementRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { elementSize } from './element-size.signal';
import {
  resizeObserved,
  StubObserver,
  stubObservers,
} from '@testing/doubles/browser.double';

@Component({
  template: `<div #box></div>`,
})
class Measured {
  private readonly box = viewChild.required<ElementRef<HTMLElement>>('box');
  public readonly size = elementSize(() => this.box().nativeElement);
}

const sized = (width: number, height: number) =>
  vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockReturnValue({ width, height } as DOMRect);

const mount = async () => {
  TestBed.configureTestingModule({
    imports: [Measured],
  });
  const fixture = TestBed.createComponent(Measured);
  await fixture.whenStable();
  return fixture;
};

describe('elementSize', () => {
  let observers: StubObserver[];

  beforeEach(() => {
    observers = stubObservers();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('measures the element once it is rendered', async () => {
    sized(320, 40);
    const fixture = await mount();

    expect(fixture.componentInstance.size()).toEqual({
      width: 320,
      height: 40,
    });
  });

  it('follows the element when it changes size', async () => {
    const measure = sized(320, 40);
    const fixture = await mount();

    measure.mockReturnValue({ width: 200, height: 80 } as DOMRect);
    resizeObserved(observers);

    expect(fixture.componentInstance.size()).toEqual({
      width: 200,
      height: 80,
    });
  });

  it('stops following it once its owner is destroyed', async () => {
    sized(320, 40);
    const fixture = await mount();

    fixture.destroy();

    expect(observers.map((observer) => observer.isDisconnected)).toEqual([
      true,
    ]);
  });

  it('knows no size before the element is rendered', () => {
    TestBed.configureTestingModule({ imports: [Measured] });
    const fixture = TestBed.createComponent(Measured);

    expect(fixture.componentInstance.size()).toBeNull();
  });
});
