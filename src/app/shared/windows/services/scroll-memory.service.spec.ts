import { TestBed } from '@angular/core/testing';
import { ScrollMemoryService } from './scroll-memory.service';

describe('ScrollMemoryService', () => {
  it('answers 0 for a surface never scrolled, and what was written otherwise', () => {
    const memory = TestBed.inject(ScrollMemoryService);

    expect(memory.read('index')).toBe(0);
    memory.save('index', 240);
    memory.save('sheet:a', 12);
    expect(memory.read('index')).toBe(240);
    expect(memory.read('sheet:a')).toBe(12);
  });
});
