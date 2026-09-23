import { TestBed } from '@angular/core/testing';
import { WindowStackService } from './window-stack.service';

const IDS = ['a', 'b', 'c', 'd'] as const;

const setup = () => {
  TestBed.configureTestingModule({ providers: [WindowStackService] });
  const stack = TestBed.inject(WindowStackService);
  const releases = IDS.map((id) => stack.register(id));
  const depths = () => IDS.map((id) => stack.depthOf(id));
  return { stack, releases, depths };
};

describe('WindowStackService', () => {
  it('gives no depth before a window is brought to the front', () => {
    const { depths } = setup();

    expect(depths()).toEqual([null, null, null, null]);
  });

  it('puts the window brought to the front last, the others in their order of registration', () => {
    const { stack, depths } = setup();

    stack.bringToFront('a');

    expect(depths()).toEqual([3, 0, 1, 2]);
  });

  it('keeps the order of the windows already raised behind the newest one', () => {
    const { stack, depths } = setup();

    stack.bringToFront('a');
    stack.bringToFront('c');
    stack.bringToFront('a');

    expect(depths()).toEqual([3, 0, 2, 1]);
  });

  it('changes nothing for the window already in front, untouched', () => {
    const { stack, depths } = setup();

    stack.bringToFront('d');

    expect(depths()).toEqual([null, null, null, null]);
  });

  it('places a window raised before it registers once it does', () => {
    TestBed.configureTestingModule({ providers: [WindowStackService] });
    const stack = TestBed.inject(WindowStackService);

    stack.bringToFront('a');
    stack.register('a');
    stack.register('b');

    expect([stack.depthOf('a'), stack.depthOf('b')]).toEqual([1, 0]);
  });

  it('forgets a window once released', () => {
    const { stack, releases } = setup();
    stack.bringToFront('a');

    releases[1]?.();

    expect(stack.depthOf('b')).toBeNull();
    expect(stack.depthOf('a')).toBe(2);
  });

  it('registers an id once, however often it registers', () => {
    const { stack } = setup();

    stack.register('a');
    stack.bringToFront('b');

    expect(IDS.map((id) => stack.depthOf(id))).toEqual([0, 3, 1, 2]);
  });
});
