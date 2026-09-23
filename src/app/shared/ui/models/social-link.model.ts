export type SocialIcon = 'email' | 'linkedin' | 'github' | 'cv';

export interface SocialLink {
  readonly href: string;
  readonly icon: SocialIcon;
  readonly label: string;
  readonly title: string;
  readonly external: boolean;
}
