import type { WindowTexts } from '../ports/window-texts.port';
import type { WindowAnchor, WindowControl } from './window.model';

export interface FrameRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface FrameArea {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

export interface FrameViewport {
  readonly width: number;
  readonly height: number;
}

export interface FrameDelta {
  readonly dx: number;
  readonly dy: number;
}

export interface FramePlace extends FrameDelta {
  readonly width: number | null;
  readonly height: number | null;
}

export interface FrameClearance {
  readonly top: number;
  readonly bottom: number;
}

export type FrameZone = 'left' | 'right' | 'full';

export type FrameMode = 'free' | FrameZone;

export type FrameEdge = 'e' | 'w' | 's' | 'se' | 'sw';

export const FRAME_EDGES: readonly FrameEdge[] = ['e', 'w', 's', 'se', 'sw'];

export type FrameGrip = 'bar' | FrameEdge;

export type FrameKeyControl = 'move' | 'resize';

export interface WindowParts {
  readonly section: HTMLElement;
  readonly bar: HTMLElement;
  readonly anchor: () => WindowAnchor;
  readonly ceiling: () => number;
  readonly stable: () => boolean;
}

export interface WindowControlView {
  readonly name: WindowControl;
  readonly label: string;
  readonly icon: string;
  readonly pressed: boolean | null;
  readonly expanded: boolean | null;
  readonly keys: string | null;
}

type Unlisten = () => void;

export interface FramedWindow {
  readonly element: HTMLElement;
  readonly parts: WindowParts;
  readonly viewport: () => FrameViewport | null;
  readonly token: (name: string, element: Element) => string;
  readonly onResize: (element: Element, handler: () => void) => Unlisten;
  readonly reducedMotion: () => boolean;
  readonly place: () => FramePlace | null;
  readonly mode: () => FrameMode | null;
  readonly holding: () => FrameKeyControl | null;
  readonly hold: (control: FrameKeyControl | null) => void;
  readonly paint: (place: FramePlace | null) => void;
  readonly commit: (place: FramePlace | null, mode: FrameMode | null) => void;
  readonly onWindow: <K extends keyof WindowEventMap>(
    type: K,
    handler: (event: WindowEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ) => Unlisten;
}

export interface FrameTracking {
  press(control: FrameKeyControl | 'maximize', event: Event): void;
  toggleMaximize(): void;
  fit(): void;
  fitHeight(): void;
  stop(): void;
}

export interface DraggedFrame {
  rect(): FrameRect;
  area(rect: FrameRect): FrameArea;
  clearance(): FrameClearance;
  moveTo(rect: FrameRect): FramePlace;
  placeAt(rect: FrameRect): FramePlace;
  unsnap(grabX: number): FrameRect | null;
  land(isMoved: boolean, zone: FrameZone | null): void;
}

export interface FrameGrab {
  readonly grip: FrameGrip;
  readonly handle: HTMLElement;
  readonly x: number;
  readonly y: number;
}

export interface FrameCode {
  readonly track: (framed: FramedWindow) => FrameTracking;
  readonly controlsOf: (
    texts: WindowTexts,
    mode: FrameMode | null,
    holding: FrameKeyControl | null,
  ) => readonly WindowControlView[];
}
