import { ContactLink } from '@shared/ui/contact-rail';

/** The ways to reach the author, in the rail's order. */
export const contactLinks: readonly ContactLink[] = [
  {
    href: 'mailto:pierremariemarchio.pro@gmail.com',
    icon: 'email',
    label: 'M’écrire à pierremariemarchio.pro@gmail.com',
    title: 'Email',
    external: false,
  },
  {
    href: 'https://www.linkedin.com/in/pierre-marie-marchio-3a5836295/',
    icon: 'linkedin',
    label: 'Profil LinkedIn de Pierre-Marie Marchio',
    title: 'LinkedIn',
    external: true,
  },
  {
    href: 'https://github.com/Pierre-MarieMarchio',
    icon: 'github',
    label: 'Dépôts GitHub de Pierre-Marie Marchio',
    title: 'GitHub',
    external: true,
  },
];
