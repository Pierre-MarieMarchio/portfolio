import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { WindowSlotDirective } from './window-slot.directive';
import { WindowStack } from './window-stack';

@Component({
  imports: [WindowSlotDirective],
  providers: [WindowStack],
  template: `
    <div appWindowSlot="about"><button type="button">a</button></div>
    <div appWindowSlot="index"></div>
    <div appWindowSlot="sheet"></div>
    <div appWindowSlot="preview"></div>
  `,
})
class Slots {}

describe('WindowStack', () => {
  const mount = async () => {
    TestBed.configureTestingModule({ imports: [Slots] });
    const fixture = TestBed.createComponent(Slots);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const slot = (name: string) =>
      host.querySelector<HTMLElement>(`[data-slot="${name}"]`);
    const rank = (name: string) =>
      slot(name)?.style.getPropertyValue('--stack') ?? '';
    return {
      fixture,
      slot,
      rank,
      stack: fixture.debugElement.injector.get(WindowStack),
    };
  };

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  /** The prerender's depth is the stylesheet's, until a window is touched. */
  it('writes no rank before anything is touched', async () => {
    const { rank } = await mount();

    expect(['about', 'index', 'sheet', 'preview'].map(rank)).toEqual([
      '',
      '',
      '',
      '',
    ]);
  });

  it('puts the window brought to the front last, the others in their order', async () => {
    const { fixture, stack, rank } = await mount();

    stack.bringToFront('about');
    await fixture.whenStable();

    expect(['index', 'sheet', 'preview', 'about'].map(rank)).toEqual([
      '0',
      '1',
      '2',
      '3',
    ]);
  });

  it('raises the slot a pointerdown starts in, even from a child', async () => {
    const { fixture, slot, rank } = await mount();

    slot('about')
      ?.querySelector('button')
      ?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await fixture.whenStable();

    expect(rank('about')).toBe('3');
  });

  it('writes nothing for the window already in front, untouched', async () => {
    const { fixture, stack, rank } = await mount();

    stack.bringToFront('preview');
    await fixture.whenStable();

    expect(rank('preview')).toBe('');
  });

  it('stops listening when the station goes', async () => {
    const { fixture, slot, stack } = await mount();
    const element = slot('about');

    fixture.destroy();
    element?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

    expect(stack.rankOf('about')).toBeNull();
  });
});
