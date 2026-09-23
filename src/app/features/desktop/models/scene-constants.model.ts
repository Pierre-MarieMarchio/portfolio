/*
 * The values more than one layer of the object reads. Each is written once:
 * two copies of a reach or an edge drift apart, and the layers stop agreeing
 * on where the cursor is or where the shadow starts.
 */

/**
 * How far the cursor reaches, in CSS pixels: the disk's repulsion and the
 * sky's lens share it. Two radii for one cursor would make two cursors.
 */
export const CURSOR_REACH = 70;

/**
 * The shadow's edge, in object radii: what lies within is hidden by the
 * hole. The photon rim is at 0.958; the cut sits just beyond, so the edge
 * stays sharp without eating the ring.
 */
export const SHADOW_EDGE = 1.02;

/** Every body turns by `phase × its speed ×` this: one clock for all. */
export const ORBIT_RATE = 0.42;

/**
 * The disk's elevation during the journey: a slice, which opens on arrival.
 * The floor keeps it from ever being seen exactly edge-on.
 */
export const JOURNEY_ELEVATION = 0.022;
export const MIN_ELEVATION = 0.018;
