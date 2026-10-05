import { ContactAddress } from '../models/contact.model';

export const CONTACT_EMAIL = 'pierremariemarchio.pro@gmail.com';

export const CONTACT_ADDRESSES: readonly ContactAddress[] = [
  {
    href: `mailto:${CONTACT_EMAIL}`,
    icon: 'email',
    external: false,
  },
  {
    href: 'https://www.linkedin.com/in/pierre-marie-marchio-3a5836295/',
    icon: 'linkedin',
    external: true,
  },
  {
    href: 'https://github.com/Pierre-MarieMarchio',
    icon: 'github',
    external: true,
  },
  {
    href: 'Pierre-Marie-Marchio-CV.pdf',
    icon: 'cv',
    external: true,
  },
];
