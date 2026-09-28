import type {
  FrameKeyControl,
  FrameMode,
  WindowControlView,
} from '../models/window-frame.model';
import type { WindowTexts } from '../ports/window-texts.port';

const ICONS = {
  move: 'M13,11H18L16.5,9.5L17.92,8.08L21.84,12L17.92,15.92L16.5,14.5L18,13H13V18L14.5,16.5L15.92,17.92L12,21.84L8.08,17.92L9.5,16.5L11,18V13H6L7.5,14.5L6.08,15.92L2.16,12L6.08,8.08L7.5,9.5L6,11H11V6L9.5,7.5L8.08,6.08L12,2.16L15.92,6.08L14.5,7.5L13,6V11Z',
  resize: 'M21,15H19V17.59L6.41,5H9V3H3V9H5V6.41L17.59,19H15V21H21V15Z',
  maximize: 'M4,4H20V20H4V4M6,8V18H18V8H6Z',
  restore: 'M4,8H8V4H20V16H16V20H4V8M16,8V14H18V6H10V8H16M6,12V18H14V12H6Z',
} as const;

export const frameControlsOf = (
  texts: WindowTexts,
  mode: FrameMode | null,
  holding: FrameKeyControl | null,
): readonly WindowControlView[] => {
  const isMaximized = mode === 'full';
  return [
    {
      name: 'move',
      label: texts.move,
      icon: ICONS.move,
      pressed: holding === 'move',
      expanded: null,
      keys: texts.moveKeys,
    },
    {
      name: 'resize',
      label: texts.resize,
      icon: ICONS.resize,
      pressed: holding === 'resize',
      expanded: null,
      keys: texts.resizeKeys,
    },
    {
      name: 'maximize',
      label: isMaximized ? texts.restore : texts.maximize,
      icon: isMaximized ? ICONS.restore : ICONS.maximize,
      pressed: null,
      expanded: null,
      keys: null,
    },
  ];
};
