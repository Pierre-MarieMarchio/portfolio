import { inject, Service } from '@angular/core';
import { BrowserWindowService } from '@app/core/services';

@Service()
export class ClickAbsorberService {
  private readonly browserWindow = inject(BrowserWindowService);

  private stopAbsorbing: () => void = () => {};

  public absorbNext(): void {
    this.stop();
    const stop = this.browserWindow.on(
      'click',
      (click) => {
        click.stopPropagation();
        click.preventDefault();
        this.stop();
      },
      { capture: true },
    );
    this.stopAbsorbing = () => {
      stop();
      this.stopAbsorbing = () => {};
    };
  }

  public stop(): void {
    this.stopAbsorbing();
  }
}
