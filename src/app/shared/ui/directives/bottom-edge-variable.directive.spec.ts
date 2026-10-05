import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BottomEdgeVariableDirective } from './bottom-edge-variable.directive';
import {
  resizeObserved,
  StubObserver,
  stubObservers,
} from '@testing/doubles/browser.double';

@Component({
  imports: [BottomEdgeVariableDirective],
  template: `<section>
    <header appBottomEdgeVariable="--head-bottom"></header>
  </section>`,
})
class Scene {}

@Component({
  hostDirectives: [
    {
      directive: BottomEdgeVariableDirective,
      inputs: ['appBottomEdgeVariable'],
    },
  ],
  template: '',
})
class Orphan {}

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

const mountOrphan = async () => {
  const fixture = TestBed.createComponent(Orphan);
  fixture.componentRef.setInput('appBottomEdgeVariable', '--head-bottom');
  const host = fixture.nativeElement as HTMLElement;
  host.remove();
  await fixture.whenStable();
  return { fixture, host };
};

describe('BottomEdgeVariableDirective', () => {
  let observers: StubObserver[];

  beforeEach(() => {
    observers = stubObservers();
  });

  afterEach(() => {
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
    resizeObserved(observers);

    expect(variable()).toBe('120px');
  });

  it('measures and observes nothing when its element has no container', async () => {
    const rect = edges(() => 101.6);
    const { fixture, host } = await mountOrphan();

    expect(host.parentElement).toBeNull();
    expect(rect).not.toHaveBeenCalled();
    expect(observers).toHaveLength(0);
    expect(() => {
      fixture.destroy();
    }).not.toThrow();
  });
});
