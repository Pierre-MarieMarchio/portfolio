import { cycleTarget, isTypingTarget } from './window-cycle.rules';

describe('window cycle rules', () => {
  describe('cycleTarget', () => {
    const A = document.createElement('div');
    const B = document.createElement('div');
    const C = document.createElement('div');

    it('gives nothing when no window is shown', () => {
      expect(cycleTarget([], 1)).toBeNull();
      expect(cycleTarget([], -1)).toBeNull();
    });

    it('gives the front window back when it is the only one shown', () => {
      expect(cycleTarget([A], 1)).toBe(A);
      expect(cycleTarget([A], -1)).toBe(A);
    });

    it('reads the next window below the front of the stack', () => {
      expect(cycleTarget([A, B, C], 1)).toBe(B);
    });

    it('reads the previous window, wrapping to the back of the stack', () => {
      expect(cycleTarget([A, B, C], -1)).toBe(C);
    });

    it('gives the other window either way when only two are shown', () => {
      expect(cycleTarget([A, B], 1)).toBe(B);
      expect(cycleTarget([A, B], -1)).toBe(B);
    });
  });

  describe('isTypingTarget', () => {
    afterEach(() => {
      document.body.replaceChildren();
    });

    it.each(['INPUT', 'TEXTAREA', 'SELECT'])('says yes for a %s', (tag) => {
      expect(isTypingTarget(document.createElement(tag))).toBe(true);
    });

    it('says yes for a contenteditable element', () => {
      const div = document.createElement('div');
      div.contentEditable = 'true';
      document.body.append(div);

      expect(isTypingTarget(div)).toBe(true);
    });

    it('says no for anything else, including nothing at all', () => {
      expect(isTypingTarget(document.createElement('button'))).toBe(false);
      expect(isTypingTarget(null)).toBe(false);
    });
  });
});
