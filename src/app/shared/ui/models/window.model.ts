/**
 * Three named sizes and nothing else: a window takes the height of its
 * content up to its ceiling, so the same window serves a short preview and a
 * seven-row index.
 */
export type WindowSize = 's' | 'm' | 'l';

/**
 * Which edge the window grows from. Anchored at the bottom it grows upwards,
 * and the room it has is measured from its bottom edge.
 */
export type WindowAnchor = 'top' | 'bottom';
