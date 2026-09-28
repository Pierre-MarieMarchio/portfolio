import { canMoveLayout } from './layout-change.rules';

const ended = (propertyName: string) =>
  new TransitionEvent('transitionend', { propertyName });

describe('canMoveLayout', () => {
  it.each([
    'transform',
    'translate',
    'opacity',
    'visibility',
    'height',
    'inset',
  ])('measures the panels again after a %s transition', (property) => {
    expect(canMoveLayout(ended(property))).toBe(true);
  });

  it.each([
    'color',
    'background-color',
    'border-color',
    'box-shadow',
    'fill',
    'backdrop-filter',
  ])(
    'leaves the panels alone after a %s transition, which only repaints',
    (property) => {
      expect(canMoveLayout(ended(property))).toBe(false);
    },
  );

  it('measures again after a resize or the end of an animation', () => {
    expect(canMoveLayout(new Event('resize'))).toBe(true);
    expect(canMoveLayout(new Event('animationend'))).toBe(true);
  });
});
