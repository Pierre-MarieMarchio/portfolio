import { ContactLink } from '@shared/ui/contact-rail';

export type ContactAddress = Omit<ContactLink, 'label'>;
