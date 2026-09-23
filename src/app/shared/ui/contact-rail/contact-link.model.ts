/** The marks the rail can draw, one per kind of address. */
export type ContactIcon = 'email' | 'linkedin' | 'github';

/** One way to reach the author: the rail draws it, the caller owns it. */
export interface ContactLink {
  readonly href: string;
  readonly icon: ContactIcon;
  /** The accessible name: what following the link does, in full. */
  readonly label: string;
  /** The short name shown on hover. */
  readonly title: string;
  /** Opens in a new tab: a profile elsewhere, not a mail client. */
  readonly external: boolean;
}
