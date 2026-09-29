export interface SceneNodeStyle {
  transform: string;
  opacity: string;
  pointerEvents: string;
  zIndex: string;
  cssText: string;
}

export interface SceneNode {
  readonly style: SceneNodeStyle;
  readonly offsetWidth: number;
  readonly offsetHeight: number;
  tabIndex: number;
  setAttribute(name: string, value: string): void;
}
