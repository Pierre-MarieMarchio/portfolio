import { clamp } from '@app/core/helpers';

export interface EngineHost {
  frame(callback: (time: number) => void): () => void;
  now(): number;
  hidden(): boolean;
}

export type FrameStep = (dt: number, isVisible: boolean) => boolean;

export class FrameLoopEngine {
  private isVisible = true;
  private cancelFrame: (() => void) | null = null;
  private last = 0;

  constructor(
    private readonly host: EngineHost,
    private readonly isMovingAfter: FrameStep,
  ) {}

  public setVisible(isVisible: boolean): void {
    this.isVisible = isVisible;
    if (isVisible) {
      this.start();
    } else {
      this.stop();
    }
  }

  public wake(): void {
    if (!this.cancelFrame) {
      this.start();
    }
  }

  public stop(): void {
    this.cancelFrame?.();
    this.cancelFrame = null;
  }

  private start(): void {
    this.stop();
    if (this.host.hidden() || !this.isVisible) {
      return;
    }
    this.last = this.host.now();
    this.cancelFrame = this.host.frame(this.tick);
  }

  private readonly tick = (now: number): void => {
    this.cancelFrame = null;
    const dt = clamp(now - this.last, 0, 60) / 1000;
    this.last = now;
    if (this.isMovingAfter(dt, this.isVisible) && this.isVisible) {
      this.cancelFrame = this.host.frame(this.tick);
    }
  };
}
