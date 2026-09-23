export interface Figure {
  /** Where the figure sits in the sky, as fractions of the frame. */
  readonly x: number;
  readonly y: number;
  /** Its size, as a fraction of the frame's smaller side. */
  readonly t: number;
  /** Points in a unit square; the third number is the star's real brightness. */
  readonly pts: readonly (readonly [number, number, number])[];
  readonly lines: readonly (readonly [number, number])[];
}

/**
 * CONSTELLATIONS, one per part of "about". A constellation is not a body:
 * it is a figure TRACED between stars that have nothing to do with each
 * other, which is exactly what each part is. It sits at the back of the sky,
 * out of the disk's plane, and does not turn with it: it drifts with the
 * fixed stars.
 *
 * Four REAL figures, at the real positions of their stars, each chosen for
 * its silhouette: a person, an arc, a polygon, a winding line. The third
 * number is the star's brightness: a constellation reads by its hierarchy,
 * not by points all alike.
 */
export const CONSTELLATIONS: readonly Figure[] = [
  // 00 Profile, ORION: the most recognised figure of the sky, and the only
  // one here that draws someone: two shoulders, a belt, two feet.
  {
    x: 0.32,
    y: 0.2,
    t: 0.25,
    pts: [
      [0.72, 0.15, 1],
      [0.28, 0.19, 0.7],
      [0.62, 0.51, 0.75],
      [0.5, 0.49, 0.8],
      [0.38, 0.47, 0.75],
      [0.71, 0.88, 0.6],
      [0.23, 0.91, 1],
    ],
    lines: [
      [0, 1],
      [1, 4],
      [0, 2],
      [4, 3],
      [3, 2],
      [2, 5],
      [4, 6],
      [6, 5],
    ],
  },
  // 01 Skills, CORONA BOREALIS: a clean arc of seven stars, not one line
  // too many: a whole that holds together.
  {
    x: 0.09,
    y: 0.15,
    t: 0.18,
    pts: [
      [0.05, 0.28, 0.55],
      [0.16, 0.52, 0.7],
      [0.34, 0.68, 1],
      [0.55, 0.73, 0.6],
      [0.72, 0.63, 0.55],
      [0.87, 0.45, 0.6],
      [0.97, 0.21, 0.5],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
    ],
  },
  // 02 Method, AURIGA: the only CLOSED figure of this sky, a pentagon that
  // stands on its own. A method is a closed frame.
  {
    x: 0.08,
    y: 0.79,
    t: 0.22,
    pts: [
      [0.42, 0.05, 1],
      [0.73, 0.2, 0.8],
      [0.81, 0.53, 0.6],
      [0.5, 0.97, 0.85],
      [0.09, 0.61, 0.7],
      [0.33, 0.29, 0.45],
      [0.26, 0.38, 0.4],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
      [0, 5],
      [5, 6],
    ],
  },
  // 03 Path, DRACO: a long winding chain across the sky, head to tail. No
  // other figure says "a long way" as well.
  {
    x: 0.36,
    y: 0.78,
    t: 0.31,
    pts: [
      [0.92, 0.84, 1],
      [0.83, 0.97, 0.8],
      [0.99, 0.95, 0.5],
      [0.73, 0.77, 0.7],
      [0.61, 0.6, 0.7],
      [0.46, 0.65, 0.6],
      [0.33, 0.5, 0.6],
      [0.2, 0.28, 0.75],
      [0.06, 0.14, 0.6],
    ],
    lines: [
      [0, 2],
      [2, 1],
      [1, 0],
      [1, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
    ],
  },
];
