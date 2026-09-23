/**
 * The ids the station's markup is addressed by: the skip link's target, the
 * landing heading, the panel the rule's markers control. Written once, so a
 * reference and its target cannot drift apart.
 */
export const DESKTOP_IDS = {
  main: 'main',
  home: 'home',
  homeTitle: 'home-title',
  previewPanel: 'preview-panel',
} as const;
