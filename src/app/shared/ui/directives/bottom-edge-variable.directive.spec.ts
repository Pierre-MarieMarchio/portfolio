import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BottomEdgeVariableDirective } from './bottom-edge-variable.directive';

@Component({
  imports: [BottomEdgeVariableDirective],
  template: `<section>
    <header appBottomEdgeVariable="--head-bottom"></header>
  </section>`,
})
class Scene {}

const resizes: (() => void)[] = [];

class StubResizeObserver {
  public constructor(callback: () => void) {
    resizes.push(callback);
  }
  public observe(): void {}
  public disconnect(): void {}
}

const edges = (bottom: () => number) =>
  vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(function (this: HTMLElement) {
      return {
        top: this.tagName === 'SECTION' ? 30 : 40,
        bottom: this.tagName === 'SECTION' ? 900 : bottom(),
      } as DOMRect;
    });

const mount = async () => {
  TestBed.configureTestingModule({
    imports: [Scene],
  });
  const fixture = TestBed.createComponent(Scene);
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  return {
    variable: () =>
      host.querySelector('section')?.style.getPropertyValue('--head-bottom'),
    header: () => host.querySelector('header'),
  };
};

describe('BottomEdgeVariableDirective', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', StubResizeObserver);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    resizes.length = 0;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('writes on its container, under the name it is given, how far down its element reaches', async () => {
    edges(() => 101.6);
    const { variable, header } = await mount();

    expect(variable()).toBe('72px');
    expect(header()?.style.getPropertyValue('--head-bottom')).toBe('');
  });

  it('writes it again when its element changes size', async () => {
    let bottom = 101.6;
    edges(() => bottom);
    const { variable } = await mount();

    bottom = 150;
    for (const resize of resizes) {
      resize();
    }

    expect(variable()).toBe('120px');
  });
});
