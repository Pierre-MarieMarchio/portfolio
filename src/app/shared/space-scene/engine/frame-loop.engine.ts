import { clamp } from '@app/core/helpers';

export interface EngineHost {
  frame(callback: (time: number) => void): () => void;
  now(): number;
  hidden(): boolean;
  travel?(isTravelling: boolean): void;
}

const TOUCH_FRAME_GAP = 10.5;

export type FrameStep = (dt: number, isVisible: boolean) => boolean;

export class FrameLoopEngine {
  private isVisible = true;
  private cancelFrame: (() => void) | null = null;
  private last = 0;
  private gap = 0;
  private nextAt = 0;

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

  public setTouch(isTouch: boolean): void {
    this.gap = isTouch ? TOUCH_FRAME_GAP : 0;
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
    if (now < this.nextAt || this.isMovingAt(now)) {
      this.cancelFrame = this.host.frame(this.tick);
    }
  };

  private isMovingAt(now: number): boolean {
    this.nextAt = now + this.gap;
    const dt = clamp(now - this.last, 0, 60) / 1000;
    this.last = now;
    return this.isMovingAfter(dt, this.isVisible) && this.isVisible;
  }
}
