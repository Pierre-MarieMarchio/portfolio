import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LineAnchorDirective } from '../directives/line-anchor.directive';
import { PanelAnchorDirective } from '../directives/panel-anchor.directive';
import { PanelRole, LayoutAnchorsService } from './layout-anchors.service';

@Component({
  imports: [LineAnchorDirective, PanelAnchorDirective],
  template: `
    <header appPanelAnchor="head"></header>
    @if (withRule()) {
      <div id="rule" [appPanelAnchor]="role()">
        <button appLineAnchor id="first">1</button>
        <button appLineAnchor id="second">2</button>
      </div>
    }
    <aside appPanelAnchor></aside>
  `,
})
class Page {
  public readonly withRule = signal(true);
  public readonly role = signal<PanelRole>('rule');
}

const mount = async () => {
  TestBed.configureTestingModule({
    imports: [Page],
  });
  const fixture = TestBed.createComponent(Page);
  await fixture.whenStable();
  const registry = TestBed.inject(LayoutAnchorsService);
  return {
    fixture,
    registry,
    host: fixture.nativeElement as HTMLElement,
    roles: () => registry.panels().map((panel) => panel.role()),
  };
};

/** The object reads what the templates declared, and nothing else. */
describe('ObjectRegistry', () => {
  it('signs in every declared panel, in document order, with its role', async () => {
    const { roles, registry, host } = await mount();

    expect(roles()).toEqual(['head', 'rule', '']);
    expect(registry.panels().map((panel) => panel.element)).toEqual([
      host.querySelector('header'),
      host.querySelector('#rule'),
      host.querySelector('aside'),
    ]);
  });

  /** The grab reads the attribute to leave a panel's gesture to the panel. */
  it('keeps data-panel on the element, empty for a panel with no role', async () => {
    const { host } = await mount();

    expect(host.querySelector('header')?.dataset['panel']).toBe('head');
    expect(host.querySelector('aside')?.dataset['panel']).toBe('');
  });

  it('reads a role that changes, without signing in again', async () => {
    const { fixture, roles } = await mount();

    fixture.componentInstance.role.set('preview');
    await fixture.whenStable();

    expect(roles()).toEqual(['head', 'preview', '']);
  });

  it('lists the lines in document order', async () => {
    const { registry, host } = await mount();

    expect(registry.lines()).toEqual([
      host.querySelector('#first'),
      host.querySelector('#second'),
    ]);
  });

  it('forgets a panel and its lines once they leave the page', async () => {
    const { fixture, registry, roles } = await mount();

    fixture.componentInstance.withRule.set(false);
    await fixture.whenStable();

    expect(roles()).toEqual(['head', '']);
    expect(registry.lines()).toEqual([]);
  });
});
