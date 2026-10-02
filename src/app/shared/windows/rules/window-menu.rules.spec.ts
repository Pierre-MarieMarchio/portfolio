import type { WindowTexts } from '../ports/window-texts.port';
import { menuActionsOf } from './window-menu.rules';

const TEXTS: WindowTexts = {
  menu: 'Menu de la fenêtre',
  keepOpen: 'Garder ouverte en changeant de page',
  keptOpen: 'gardée ouverte',
  snapLeft: 'Moitié gauche',
  snapRight: 'Moitié droite',
  maximize: 'Agrandir la fenêtre',
  restore: 'Remettre la fenêtre à sa taille',
  close: 'Fermer la fenêtre',
  phone: {
    fold: 'Baisser la fenêtre',
    unfold: 'Remonter la fenêtre',
  },
};

describe('menuActionsOf', () => {
  it('always offers to keep the window open, and to snap it to a half', () => {
    expect(menuActionsOf(TEXTS, false, false, null)).toEqual([
      {
        id: 'pin',
        role: 'menuitemcheckbox',
        label: TEXTS.keepOpen,
        checked: false,
      },
      { id: 'left', role: 'menuitem', label: TEXTS.snapLeft, checked: null },
      { id: 'right', role: 'menuitem', label: TEXTS.snapRight, checked: null },
    ]);
  });

  it('checks the pin item on the current pinned state', () => {
    const [pin] = menuActionsOf(TEXTS, true, false, null);
    expect(pin?.checked).toBe(true);
  });

  it('adds a maximize item, named by the current frame mode, when maximizable', () => {
    expect(menuActionsOf(TEXTS, false, true, null).at(-1)).toEqual({
      id: 'maximize',
      role: 'menuitem',
      label: TEXTS.maximize,
      checked: null,
    });
    expect(menuActionsOf(TEXTS, false, true, 'full').at(-1)).toEqual({
      id: 'maximize',
      role: 'menuitem',
      label: TEXTS.restore,
      checked: null,
    });
  });

  it('offers no maximize item for the preview', () => {
    expect(
      menuActionsOf(TEXTS, false, false, null).map((action) => action.id),
    ).not.toContain('maximize');
  });
});
