import { InjectionToken } from '@angular/core';
import type { LayoutBox } from '../models/scene-layout.model';

export interface SceneWindowDrag {
  onDragging(handler: (rect: LayoutBox | null) => void): () => void;
}

export const SCENE_WINDOW_DRAG = new InjectionToken<SceneWindowDrag>(
  'SceneWindowDrag',
);
