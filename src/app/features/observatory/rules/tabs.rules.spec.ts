import { tabOf, tabOfWindow, windowsOfTab } from './tabs.rules';

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

  describe('tabOfWindow', () => {
    it('puts the list and the sheet under the projects tab, about under its own', () => {
      expect(tabOfWindow('index')).toBe('index');
      expect(tabOfWindow('sheet')).toBe('index');
      expect(tabOfWindow('about')).toBe('about');
    });
  });

  describe('windowsOfTab', () => {
    it('gives the projects tab its list and its sheet, about its own window, home none', () => {
      expect(windowsOfTab('index')).toEqual(['index', 'sheet']);
      expect(windowsOfTab('about')).toEqual(['about']);
      expect(windowsOfTab('home')).toEqual([]);
    });
  });
});
