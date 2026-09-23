import { TestBed } from '@angular/core/testing';
import { WINDOW_TEXTS } from './window-texts.port';

describe('WINDOW_TEXTS', () => {
  it('has no default: a composition that forgets it fails loudly', () => {
    expect(() => TestBed.inject(WINDOW_TEXTS)).toThrow(/WINDOW_TEXTS/);
  });
});
