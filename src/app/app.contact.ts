import { PagesTexts } from '@app/i18n';
import { ContactLink } from '@shared/ui/contact-rail';

/** The ways to reach the author, in the rail's order, named in `texts`. */
export function contactLinks(texts: PagesTexts['contact']): ContactLink[] {
  return [
    {
      href: 'mailto:pierremariemarchio.pro@gmail.com',
      icon: 'email',
      label: texts.email,
      title: 'Email',
      external: false,
    },
    {
      href: 'https://www.linkedin.com/in/pierre-marie-marchio-3a5836295/',
      icon: 'linkedin',
      label: texts.linkedin,
      title: 'LinkedIn',
      external: true,
    },
    {
      href: 'https://github.com/Pierre-MarieMarchio',
      icon: 'github',
      label: texts.github,
      title: 'GitHub',
      external: true,
    },
  ];
}
