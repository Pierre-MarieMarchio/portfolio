import type { DisplayConditions } from '../models/display-format.model';
import { displayFormatOf } from './display-format.rules';

const TOUCH = { hasCoarsePointer: true, cannotHover: true };
const MOUSE = { hasCoarsePointer: false, cannotHover: false };

const at = (
  width: number,
  height: number,
  pointer: Pick<DisplayConditions, 'hasCoarsePointer' | 'cannotHover'>,
): DisplayConditions => ({ width, height, ...pointer });

describe('displayFormatOf', () => {
  it('gives each target size its format', () => {
    expect(displayFormatOf(at(360, 780, TOUCH))).toBe('phone');
    expect(displayFormatOf(at(390, 844, TOUCH))).toBe('phone');
    expect(displayFormatOf(at(844, 390, TOUCH))).toBe('phone');
    expect(displayFormatOf(at(820, 1180, TOUCH))).toBe('tablet');
    expect(displayFormatOf(at(1180, 820, TOUCH))).toBe('tablet');
    expect(displayFormatOf(at(924, 540, MOUSE))).toBe('desktop');
    expect(displayFormatOf(at(1440, 900, MOUSE))).toBe('desktop');
  });

  it('is a phone below 620 px wide, whatever the pointer', () => {
    expect(displayFormatOf(at(619, 900, MOUSE))).toBe('phone');
    expect(displayFormatOf(at(620, 900, MOUSE))).toBe('desktop');
  });

  it('is a phone below 500 px high with a coarse pointer only', () => {
    expect(displayFormatOf(at(900, 499, TOUCH))).toBe('phone');
    expect(displayFormatOf(at(900, 500, TOUCH))).toBe('tablet');
    expect(displayFormatOf(at(900, 499, MOUSE))).toBe('desktop');
  });

  it('is a tablet with a coarse pointer, or with no hover', () => {
    expect(
      displayFormatOf(
        at(900, 700, { hasCoarsePointer: true, cannotHover: false }),
      ),
    ).toBe('tablet');
    expect(
      displayFormatOf(
        at(900, 700, { hasCoarsePointer: false, cannotHover: true }),
      ),
    ).toBe('tablet');
  });
});
