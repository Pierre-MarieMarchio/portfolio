import { TestBed } from '@angular/core/testing';
import { ScrollMemory } from './scroll-memory.service';

describe('ScrollMemory', () => {
  it('answers 0 for a surface never scrolled, and what was written otherwise', () => {
    const memory = TestBed.inject(ScrollMemory);

    expect(memory.read('index')).toBe(0);
    memory.write('index', 240);
    memory.write('sheet:a', 12);
    expect(memory.read('index')).toBe(240);
    expect(memory.read('sheet:a')).toBe(12);
  });
});
