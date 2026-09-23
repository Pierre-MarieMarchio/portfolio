import { InjectionToken } from '@angular/core';

export interface ILinks {
  home(): string;
  index(): string;
  about(): string;
  sheet(slug: string): string;
}

export const LINKS = new InjectionToken<ILinks>('LINKS');
