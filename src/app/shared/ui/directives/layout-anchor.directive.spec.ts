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
  public readonly kind = signal<string | null>('rule');
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
  it('signs in every declared element under its kind, in document order, and marks it data-panel with its kind', async () => {
    const { anchors, host } = await mount();

    expect(anchors.list('head')).toEqual([host.querySelector('header')]);
    expect(anchors.list('rule')).toEqual([host.querySelector('#rule')]);
    expect(anchors.list('panel')).toEqual([host.querySelector('aside')]);
    expect(host.querySelector('header')?.dataset['panel']).toBe('head');
    expect(host.querySelector('aside')?.dataset['panel']).toBe('panel');
    expect(anchors.list('line')).toEqual([
      host.querySelector('#first'),
      host.querySelector('#second'),
    ]);
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

  it('signs out an element whose kind goes to null, until it has one again', async () => {
    const { fixture, anchors, host } = await mount();

    fixture.componentInstance.kind.set(null);
    await fixture.whenStable();

    expect(anchors.list('rule')).toEqual([]);
    expect(host.querySelector('#rule')?.hasAttribute('data-panel')).toBe(false);

    fixture.componentInstance.kind.set('rule');
    await fixture.whenStable();
    expect(anchors.list('rule')).toEqual([host.querySelector('#rule')]);
  });

  it('forgets an element and its children once they leave the page', async () => {
    const { fixture, anchors } = await mount();

    fixture.componentInstance.withRule.set(false);
    await fixture.whenStable();

    expect(anchors.list('rule')).toEqual([]);
    expect(anchors.list('line')).toEqual([]);
  });
});
