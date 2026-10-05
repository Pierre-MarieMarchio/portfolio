export type SheetDetent = 'folded' | 'half' | 'full';

export interface SheetStop {
  readonly detent: SheetDetent;
  readonly at: number;
}

export interface SheetRoom {
  readonly peek: number;
  readonly half: number;
  readonly end: number;
}

export interface SheetSample {
  readonly top: number;
  readonly at: number;
}

export interface SheetRelease {
  readonly speed: number;
  readonly pull: number;
}
