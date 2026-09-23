import { PanelRole } from '@shared/ui/services';
import { Layout, PanelRect } from '../engine/space-scene.engine';

export interface PanelAnchor {
  readonly rect: Pick<
    DOMRectReadOnly,
    'left' | 'top' | 'right' | 'bottom' | 'width' | 'height'
  >;
  readonly opacity: string;
  readonly role: PanelRole;
}

export function sceneLayout(
  canvas: Layout['canvas'],
  viewport: Layout['viewport'],
  anchors: readonly PanelAnchor[],
): Layout {
  const head = lastShown(anchors, 'head');
  const rule = lastShown(anchors, 'rule');
  const sheet = lastShown(anchors, 'sheet');
  const preview = lastShown(anchors, 'preview');
  return {
    canvas: { left: canvas.left, top: canvas.top },
    viewport,
    panels: anchors.map((anchor) => panelOf(anchor)),
    headHeight: head ? Math.round(head.height) : null,
    ruleHeight: rule ? Math.round(rule.height) : null,
    sheetLeft: sheet ? Math.round(sheet.left) : null,
    previewLeft: preview ? preview.left : null,
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
  role: Exclude<PanelRole, ''>,
): PanelAnchor['rect'] | null {
  const shown = anchors.filter(
    (anchor) =>
      anchor.role === role && anchor.rect.width > 0 && anchor.rect.height > 0,
  );
  return shown.at(-1)?.rect ?? null;
}
