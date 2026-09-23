export interface NavigationItem {
  readonly label: string;
  /** A route of this application, absolute (`/projets`). */
  readonly route: string;
}

/**
 * One language the site exists in, as the page bar offers it: a real link
 * to the same page in that language, so switching is a navigation, and
 * works without a script.
 */
export interface LanguageItem {
  /** What the bar shows: "FR". */
  readonly code: string;
  /** The language named in itself: "Français". */
  readonly name: string;
  /** Its code for `lang` and `hreflang`: "fr". */
  readonly lang: string;
  /** The same page in that language. */
  readonly route: string;
  readonly current: boolean;
}
