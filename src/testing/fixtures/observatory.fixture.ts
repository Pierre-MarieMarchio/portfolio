import { Provider } from '@angular/core';
import { Router } from '@angular/router';
import { stubMedia } from '../doubles/browser.double';

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
  document.documentElement.style.setProperty('--arrival-at', '8700ms');
};
