import type {
  LookableScene,
  WindowEvents,
} from '@shared/space-scene/models/scene-look.model';

export class LookableSceneDouble implements LookableScene {
  public readonly holds: [number, number][] = [];
  public readonly stretches: [number, number, number][] = [];
  public releases = 0;
  public requests = 0;
  public looks = 0;

  public holdZoom(clientX: number, clientY: number): boolean {
    this.holds.push([clientX, clientY]);
    return true;
  }

  public stretchZoom(clientX: number, clientY: number, ratio: number): void {
    this.stretches.push([clientX, clientY, ratio]);
  }

  public releaseZoom(): void {
    this.releases += 1;
  }

  public lookCloser(): boolean {
    this.looks += 1;
    return true;
  }

  public request(): void {
    this.requests += 1;
  }
}

export const windowEvents: WindowEvents = {
  onWindow: (type, handler, options) => {
    window.addEventListener(type, handler, options);
    return () => {
      window.removeEventListener(type, handler, options);
    };
  },
};
