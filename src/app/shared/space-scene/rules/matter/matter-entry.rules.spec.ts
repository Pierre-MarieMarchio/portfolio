import { hastenedEntrySpan, MATTER_ENTRY_SPAN } from './matter-entry.rules';

describe('hastenedEntrySpan', () => {
  it('lights the matter left within the time it is given', () => {
    expect(hastenedEntrySpan(0, 0.6)).toBeCloseTo(0.6, 9);
    expect((1 - 0.25) * hastenedEntrySpan(0.25, 0.9)).toBeCloseTo(0.9, 9);
  });

  it('never lights the matter slower than its own entry', () => {
    expect(hastenedEntrySpan(0.99, 0.9)).toBe(MATTER_ENTRY_SPAN);
    expect(hastenedEntrySpan(1, 0.9)).toBe(MATTER_ENTRY_SPAN);
  });
});
