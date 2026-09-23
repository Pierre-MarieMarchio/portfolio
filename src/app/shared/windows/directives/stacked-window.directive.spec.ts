import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { WindowStackService } from '../services/window-stack.service';
import { StackedWindowDirective } from './stacked-window.directive';

@Component({
  imports: [StackedWindowDirective],
  providers: [WindowStackService],
  template: `
    <div appStackedWindow="a"><button type="button">a</button></div>
    <div appStackedWindow="b"></div>
    <div appStackedWindow="c"></div>
  `,
})
class Stacked {}

const mount = async () => {
  TestBed.configureTestingModule({ imports: [Stacked] });
  const fixture = TestBed.createComponent(Stacked);
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  const windows = [...host.querySelectorAll<HTMLElement>('div')];
  const depths = () =>
    windows.map((element) => element.style.getPropertyValue('--stack'));
  return {
    fixture,
    windows,
    depths,
    stack: fixture.debugElement.injector.get(WindowStackService),
  };
};

describe('StackedWindowDirective', () => {
  it('writes no depth before anything is touched', async () => {
    const { depths } = await mount();

    expect(depths()).toEqual(['', '', '']);
  });

  it('registers each window in the order of the page', async () => {
    const { fixture, stack, depths } = await mount();

    stack.bringToFront('b');
    await fixture.whenStable();

    expect(depths()).toEqual(['0', '2', '1']);
  });

  it('brings its window to the front when a pointer goes down inside it', async () => {
    const { fixture, windows, depths } = await mount();

    windows[0]
      ?.querySelector('button')
      ?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await fixture.whenStable();

    expect(depths()).toEqual(['2', '0', '1']);
  });

  it('leaves the stack once its element goes', async () => {
    const { fixture, stack } = await mount();

    fixture.destroy();
    stack.bringToFront('a');

    expect(stack.depthOf('b')).toBeNull();
  });
});
