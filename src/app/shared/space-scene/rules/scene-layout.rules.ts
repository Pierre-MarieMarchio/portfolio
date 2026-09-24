import type {
  PanelRect,
  SceneLayout,
  ScenePanelRole,
} from '../models/scene-layout.model';

export interface PanelAnchor {
  readonly rect: Pick<
    DOMRectReadOnly,
    'left' | 'top' | 'right' | 'bottom' | 'width' | 'height'
  >;
  readonly opacity: string;
  readonly role: ScenePanelRole;
}

type PanelBox = PanelAnchor['rect'];

const BOTTOM_BAND = { widthShare: 0.9, topShare: 0.5 } as const;

export const isBottomBand = (
  rect: PanelBox,
  viewport: SceneLayout['viewport'],
): boolean =>
  rect.width >= viewport.width * BOTTOM_BAND.widthShare &&
  rect.top >= viewport.height * BOTTOM_BAND.topShare;

const bandTop = (
  rect: PanelBox | null,
  viewport: SceneLayout['viewport'],
): number | null => (rect && isBottomBand(rect, viewport) ? rect.top : null);

export function sceneLayout(
  canvas: SceneLayout['canvas'],
  viewport: SceneLayout['viewport'],
  anchors: readonly PanelAnchor[],
): SceneLayout {
  const topBar = lastShown(anchors, 'top-bar');
  const bottomBar = lastShown(anchors, 'bottom-bar');
  const approach = lastShown(anchors, 'approach-edge');
  const closeUp = lastShown(anchors, 'close-up-edge');
  return {
    canvas: { left: canvas.left, top: canvas.top },
    viewport,
    panels: anchors.map((anchor) => panelOf(anchor)),
    topBarHeight: topBar ? Math.round(topBar.height) : null,
    bottomBarHeight: bottomBar ? Math.round(bottomBar.height) : null,
    approachEdge: approach ? Math.round(approach.left) : null,
    closeUpEdge: closeUp ? closeUp.left : null,
    approachBandTop: bandTop(approach, viewport),
    closeUpBandTop: bandTop(closeUp, viewport),
  };
}

function panelOf({ rect, opacity }: PanelAnchor): PanelRect {
  const parsed = Number.parseFloat(opacity);
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    opacity: Number.isFinite(parsed) ? parsed : 1,
  };
}

function lastShown(
  anchors: readonly PanelAnchor[],
  role: Exclude<ScenePanelRole, ''>,
): PanelBox | null {
  const shown = anchors.filter(
    (anchor) =>
      anchor.role === role && anchor.rect.width > 0 && anchor.rect.height > 0,
  );
  return shown.at(-1)?.rect ?? null;
}
