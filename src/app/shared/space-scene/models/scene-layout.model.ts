export interface PanelRect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly opacity: number;
}

export interface SceneLayout {
  readonly canvas: { readonly left: number; readonly top: number };
  readonly viewport: { readonly width: number; readonly height: number };
  readonly panels: readonly PanelRect[];
  readonly topBarHeight: number | null;
  readonly bottomBarHeight: number | null;
  readonly approachEdge: number | null;
  readonly closeUpEdge: number | null;
  readonly approachBandTop?: number | null;
  readonly closeUpBandTop?: number | null;
  readonly panelBandTop?: number | null;
  readonly sidePanelLeft?: number | null;
  readonly chrome?: readonly PanelRect[];
}

export type ScenePanelRole =
  '' | 'top-bar' | 'bottom-bar' | 'approach-edge' | 'close-up-edge' | 'chrome';
