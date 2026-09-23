import { inject, Injectable } from '@angular/core';
import { ScenePanelRole } from '@shared/space-scene/models';
import { ScenePanel, SceneSurroundings } from '@shared/space-scene/ports';
import { LayoutAnchorsService, PanelRole } from '@shared/ui/services';

const SCENE_ROLE_OF: Readonly<Record<PanelRole, ScenePanelRole>> = {
  '': '',
  head: 'top-bar',
  rule: 'bottom-bar',
  sheet: 'approach-edge',
  preview: 'close-up-edge',
};

@Injectable()
export class SceneSurroundingsService implements SceneSurroundings {
  private readonly anchors = inject(LayoutAnchorsService);

  public panels(): readonly ScenePanel[] {
    return this.anchors.panels().map(({ element, role }) => ({
      element,
      role: SCENE_ROLE_OF[role()],
    }));
  }

  public lines(): readonly HTMLElement[] {
    return this.anchors.lines();
  }
}
