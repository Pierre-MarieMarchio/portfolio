import { InjectionToken } from '@angular/core';
import { ILinks } from './links.port';

/** No default: a composition that forgets it fails loudly. */
export const LINKS = new InjectionToken<ILinks>('LINKS');
