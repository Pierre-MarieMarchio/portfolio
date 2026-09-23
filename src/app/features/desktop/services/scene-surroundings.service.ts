import { inject, Injectable } from '@angular/core';
import { SceneAnchorKind } from '@app/features/common';
import { ScenePanelRole } from '@shared/space-scene/models';
import { ScenePanel, SceneSurroundings } from '@shared/space-scene/ports';
import { LayoutAnchorsService } from '@shared/ui/services';

const SCENE_ROLE_OF: Readonly<
  Record<Exclude<SceneAnchorKind, 'line'>, ScenePanelRole>
> = {
  panel: '',
  head: 'top-bar',
  rule: 'bottom-bar',
  detail: 'approach-edge',
  preview: 'close-up-edge',
};

const LINE: SceneAnchorKind = 'line';

@Injectable()
export class SceneSurroundingsService implements SceneSurroundings {
  private readonly anchors = inject(LayoutAnchorsService);

  public panels(): readonly ScenePanel[] {
    return Object.entries(SCENE_ROLE_OF).flatMap(([kind, role]) =>
      this.anchors.list(kind).map((element) => ({ element, role })),
    );
  }

  public lines(): readonly HTMLElement[] {
    return this.anchors.list(LINE);
  }
}
