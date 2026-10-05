import { inject, Service } from '@angular/core';
import { DisplayFormatService } from '@app/core/services';
import { MobileNavLayout } from '@shared/mobile-nav/ports';

@Service({ autoProvided: false })
export class MobileNavLayoutService implements MobileNavLayout {
  private readonly display = inject(DisplayFormatService);

  public isCompact(): boolean {
    return this.display.format() === 'phone';
  }
}
