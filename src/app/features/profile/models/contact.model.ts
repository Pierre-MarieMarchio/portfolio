import { SocialLink } from '@shared/ui/models';

export type ContactAddress = Omit<SocialLink, 'label'>;
