import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Provider } from '@angular/core';
import { Router } from '@angular/router';
import { stubMedia } from '../doubles/browser.double';

const TOKENS_SCSS = resolve(process.cwd(), 'src/assets/styles/_tokens.scss');

export interface TokenDuration {
  readonly css: string;
  readonly ms: number;
}

const durationToken = (name: string): TokenDuration => {
  const declaration = new RegExp(String.raw`^\s*--${name}:\s*(\d+)ms;`, 'm');
  const match = declaration.exec(readFileSync(TOKENS_SCSS, 'utf8'));
  if (match === null) {
    throw new Error(`--${name} is not a millisecond token of _tokens.scss`);
  }
  const ms = Number(match[1]);
  return { css: `${ms}ms`, ms };
};

export const ARRIVAL_AT = durationToken('arrival-at');
export const INTRO_DURATION = durationToken('intro-duration');

export const provideRecordingRouter = (navigated: string[]): Provider => ({
  provide: Router,
  useValue: {
    navigateByUrl: (url: string) => {
      navigated.push(url);
      return Promise.resolve(true);
    },
  },
});

export const stillObservatory = (
  isMatching: (query: string) => boolean = () => true,
): void => {
  stubMedia(isMatching);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  document.documentElement.style.setProperty('--arrival-at', ARRIVAL_AT.css);
};
