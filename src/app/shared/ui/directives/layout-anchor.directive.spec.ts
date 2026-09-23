import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LayoutAnchorsService } from '../services/layout-anchors.service';
import { LayoutAnchorDirective } from './layout-anchor.directive';

@Component({
  imports: [LayoutAnchorDirective],
  template: `
    <header appLayoutAnchor="head"></header>
    @if (withRule()) {
      <div id="rule" [appLayoutAnchor]="kind()">
        <button appLayoutAnchor="line" id="first">1</button>
        <button appLayoutAnchor="line" id="second">2</button>
      </div>
    }
    <aside appLayoutAnchor="panel"></aside>
  `,
})
class Page {
  public readonly withRule = signal(true);
  public readonly kind = signal('rule');
}

const mount = async () => {
  TestBed.configureTestingModule({
    imports: [Page],
  });
  const fixture = TestBed.createComponent(Page);
  await fixture.whenStable();
  return {
    fixture,
    anchors: TestBed.inject(LayoutAnchorsService),
    host: fixture.nativeElement as HTMLElement,
  };
};

describe('LayoutAnchorDirective', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('signs in every declared element under its kind, in document order', async () => {
    const { anchors, host } = await mount();

    expect(anchors.list('head')).toEqual([host.querySelector('header')]);
    expect(anchors.list('rule')).toEqual([host.querySelector('#rule')]);
    expect(anchors.list('panel')).toEqual([host.querySelector('aside')]);
    expect(anchors.list('line')).toEqual([
      host.querySelector('#first'),
      host.querySelector('#second'),
    ]);
  });

  it('keeps data-panel on the element, set to its kind', async () => {
    const { host } = await mount();

    expect(host.querySelector('header')?.dataset['panel']).toBe('head');
    expect(host.querySelector('aside')?.dataset['panel']).toBe('panel');
  });

  it('moves an element to the kind it changes to', async () => {
    const { fixture, anchors, host } = await mount();

    fixture.componentInstance.kind.set('preview');
    await fixture.whenStable();

    expect(anchors.list('rule')).toEqual([]);
    expect(anchors.list('preview')).toEqual([host.querySelector('#rule')]);
    expect(host.querySelector<HTMLElement>('#rule')?.dataset['panel']).toBe(
      'preview',
    );
  });

  it('forgets an element and its children once they leave the page', async () => {
    const { fixture, anchors } = await mount();

    fixture.componentInstance.withRule.set(false);
    await fixture.whenStable();

    expect(anchors.list('rule')).toEqual([]);
    expect(anchors.list('line')).toEqual([]);
  });
});
