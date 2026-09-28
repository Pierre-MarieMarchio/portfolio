import { TestBed } from '@angular/core/testing';
import { LayoutAnchorsService } from './layout-anchors.service';
import { tupleOf } from '@testing/fixtures/testbed.fixture';

const elements = (count: number): HTMLElement[] => {
  const all = Array.from({ length: count }, (_, index) => {
    const element = document.createElement('div');
    element.id = `anchor-${String(index)}`;
    return element;
  });
  document.body.append(...all);
  return all;
};

const ids = (list: readonly HTMLElement[]): string[] =>
  list.map((element) => element.id);

describe('LayoutAnchorsService', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('lists the elements of one kind in document order, whatever order they signed in', () => {
    const anchors = TestBed.inject(LayoutAnchorsService);
    const [first, second, third] = tupleOf(elements(3), 3);

    anchors.register(third, 'line');
    anchors.register(first, 'line');
    anchors.register(second, 'line');

    expect(ids(anchors.list('line'))).toEqual(ids([first, second, third]));
  });

  it('keeps each kind apart', () => {
    const anchors = TestBed.inject(LayoutAnchorsService);
    const [head, line] = tupleOf(elements(2), 2);

    anchors.register(head, 'head');
    anchors.register(line, 'line');

    expect(ids(anchors.list('head'))).toEqual(ids([head]));
    expect(ids(anchors.list('line'))).toEqual(ids([line]));
    expect(anchors.list('rule')).toEqual([]);
  });

  it('forgets an element once it signs out, and only that one', () => {
    const anchors = TestBed.inject(LayoutAnchorsService);
    const [kept, left] = tupleOf(elements(2), 2);

    anchors.register(kept, 'line');
    const leave = anchors.register(left, 'line');
    leave();

    expect(ids(anchors.list('line'))).toEqual(ids([kept]));
  });
});
