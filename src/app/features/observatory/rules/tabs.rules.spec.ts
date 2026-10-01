import { tabOf } from './tabs.rules';

describe('tabs rules', () => {
  describe('tabOf', () => {
    it('puts the list, a sheet and a missing sheet under the same tab', () => {
      expect(tabOf('index')).toBe('index');
      expect(tabOf('sheet')).toBe('index');
      expect(tabOf('not-found')).toBe('index');
    });

    it('gives home and about their own tab', () => {
      expect(tabOf('home')).toBe('home');
      expect(tabOf('about')).toBe('about');
    });
  });
});
