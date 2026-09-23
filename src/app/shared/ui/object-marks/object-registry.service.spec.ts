import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ObjectLineDirective } from './object-line.directive';
import { ObjectPanelDirective } from './object-panel.directive';
import { ObjectPanelRole, ObjectRegistry } from './object-registry.service';

@Component({
  imports: [ObjectLineDirective, ObjectPanelDirective],
  template: `
    <header appObjectPanel="head"></header>
    @if (withRule()) {
      <div id="rule" [appObjectPanel]="role()">
        <button appObjectLine id="first">1</button>
        <button appObjectLine id="second">2</button>
      </div>
    }
    <aside appObjectPanel></aside>
  `,
})
class Page {
  public readonly withRule = signal(true);
  public readonly role = signal<ObjectPanelRole>('rule');
}

/** The object reads what the templates declared, and nothing else. */
describe('ObjectRegistry', () => {
  const mount = async () => {
    TestBed.configureTestingModule({ imports: [Page] });
    const fixture = TestBed.createComponent(Page);
    await fixture.whenStable();
    const registry = TestBed.inject(ObjectRegistry);
    return {
      fixture,
      registry,
      host: fixture.nativeElement as HTMLElement,
      roles: () => registry.panels().map((panel) => panel.role()),
    };
  };

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

    expect(host.querySelector('header')?.getAttribute('data-panel')).toBe(
      'head',
    );
    expect(host.querySelector('aside')?.getAttribute('data-panel')).toBe('');
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
