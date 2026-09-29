import type { WindowTexts } from '../ports/window-texts.port';

export type WindowMenuActionId = 'pin' | 'left' | 'right' | 'maximize';

export interface WindowMenuAction {
  readonly id: WindowMenuActionId;
  readonly role: 'menuitemcheckbox' | 'menuitem';
  readonly label: string;
  readonly checked: boolean | null;
}

export interface WindowMenuHost {
  readonly button: HTMLButtonElement;
  readonly texts: () => WindowTexts;
  readonly pinned: () => boolean;
  readonly maximizable: () => boolean;
  readonly frameMode: () => 'full' | null;
  readonly viewport: () => {
    readonly width: number;
    readonly height: number;
  } | null;
  readonly onWindow: (
    type: 'pointerdown',
    handler: (event: PointerEvent) => void,
  ) => () => void;
  readonly emitPin: () => void;
  readonly snapTo: (zone: 'left' | 'right') => void;
  readonly toggleMaximize: () => void;
}

export interface WindowMenuTracking {
  isOpen(): boolean;
  open(): void;
  close(shouldFocusButton: boolean): void;
  stop(): void;
}

export interface WindowMenuCode {
  readonly create: (host: WindowMenuHost) => WindowMenuTracking;
}
