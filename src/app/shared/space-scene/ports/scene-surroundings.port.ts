import { InjectionToken } from '@angular/core';
import type { ScenePanelRole } from '../models/scene-layout.model';

export interface ScenePanel {
  readonly element: HTMLElement;
  readonly role: ScenePanelRole;
}

export interface SceneSurroundings {
  panels(): readonly ScenePanel[];
  lines(): readonly HTMLElement[];
}

export const SCENE_SURROUNDINGS = new InjectionToken<SceneSurroundings>(
  'SceneSurroundings',
);
