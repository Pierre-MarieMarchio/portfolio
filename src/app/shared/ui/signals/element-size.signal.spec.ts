import { Component, ElementRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { elementSize } from './element-size.signal';

@Component({
  template: `<div #box></div>`,
})
class Measured {
  private readonly box = viewChild.required<ElementRef<HTMLElement>>('box');
  public readonly size = elementSize(() => this.box().nativeElement);
}

const resizes: (() => void)[] = [];
const stopped: boolean[] = [];

class StubResizeObserver {
  private readonly index: number;
  public constructor(callback: () => void) {
    this.index = resizes.push(callback) - 1;
    stopped.push(false);
  }
  public observe(): void {}
  public disconnect(): void {
    stopped[this.index] = true;
  }
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
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', StubResizeObserver);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    resizes.length = 0;
    stopped.length = 0;
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
    for (const resize of resizes) {
      resize();
    }

    expect(fixture.componentInstance.size()).toEqual({
      width: 200,
      height: 80,
    });
  });

  it('stops following it once its owner is destroyed', async () => {
    sized(320, 40);
    const fixture = await mount();

    fixture.destroy();

    expect(stopped).toEqual([true]);
  });

  it('knows no size before the element is rendered', () => {
    TestBed.configureTestingModule({ imports: [Measured] });
    const fixture = TestBed.createComponent(Measured);

    expect(fixture.componentInstance.size()).toBeNull();
  });
});
