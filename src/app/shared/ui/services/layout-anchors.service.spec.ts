import { TestBed } from '@angular/core/testing';
import { LayoutAnchorsService } from './layout-anchors.service';

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
    TestBed.resetTestingModule();
    document.body.replaceChildren();
  });

  it('lists the elements of one kind in document order, whatever order they signed in', () => {
    const anchors = TestBed.inject(LayoutAnchorsService);
    const [first, second, third] = elements(3);
    if (!first || !second || !third) {
      throw new Error('expected three elements');
    }

    anchors.register(third, 'line');
    anchors.register(first, 'line');
    anchors.register(second, 'line');

    expect(ids(anchors.list('line'))).toEqual(ids([first, second, third]));
  });

  it('keeps each kind apart', () => {
    const anchors = TestBed.inject(LayoutAnchorsService);
    const [head, line] = elements(2);
    if (!head || !line) {
      throw new Error('expected two elements');
    }

    anchors.register(head, 'head');
    anchors.register(line, 'line');

    expect(ids(anchors.list('head'))).toEqual(ids([head]));
    expect(ids(anchors.list('line'))).toEqual(ids([line]));
    expect(anchors.list('rule')).toEqual([]);
  });

  it('forgets an element once it signs out, and only that one', () => {
    const anchors = TestBed.inject(LayoutAnchorsService);
    const [kept, left] = elements(2);
    if (!kept || !left) {
      throw new Error('expected two elements');
    }

    anchors.register(kept, 'line');
    const leave = anchors.register(left, 'line');
    leave();

    expect(ids(anchors.list('line'))).toEqual(ids([kept]));
  });
});
