import type { WindowMenuAction } from '../models/window-menu.model';
import type { WindowTexts } from '../ports/window-texts.port';

export const menuActionsOf = (
  texts: WindowTexts,
  isPinned: boolean,
  isMaximizable: boolean,
  frameMode: 'full' | null,
): readonly WindowMenuAction[] => {
  const actions: WindowMenuAction[] = [
    {
      id: 'pin',
      role: 'menuitemcheckbox',
      label: texts.keepOpen,
      checked: isPinned,
    },
    { id: 'left', role: 'menuitem', label: texts.snapLeft, checked: null },
    { id: 'right', role: 'menuitem', label: texts.snapRight, checked: null },
  ];
  if (isMaximizable) {
    const isMaximized = frameMode === 'full';
    actions.push({
      id: 'maximize',
      role: 'menuitem',
      label: isMaximized ? texts.restore : texts.maximize,
      checked: null,
    });
  }
  return actions;
};
