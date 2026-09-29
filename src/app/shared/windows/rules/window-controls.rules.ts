import type {
  FrameMode,
  WindowControlView,
} from '../models/window-frame.model';
import type { WindowTexts } from '../ports/window-texts.port';

const ICONS = {
  maximize: 'M4,4H20V20H4V4M6,8V18H18V8H6Z',
  restore: 'M4,8H8V4H20V16H16V20H4V8M16,8V14H18V6H10V8H16M6,12V18H14V12H6Z',
} as const;

export const frameControlsOf = (
  texts: WindowTexts,
  mode: FrameMode | null,
  isMaximizable: boolean,
): readonly WindowControlView[] => {
  if (!isMaximizable) {
    return [];
  }
  const isMaximized = mode === 'full';
  return [
    {
      name: 'maximize',
      label: isMaximized ? texts.restore : texts.maximize,
      icon: isMaximized ? ICONS.restore : ICONS.maximize,
      pressed: null,
      expanded: null,
    },
  ];
};
