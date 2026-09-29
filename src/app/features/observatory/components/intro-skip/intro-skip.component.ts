import { Component, inject } from '@angular/core';
import { HomeRevealService } from '../../services';
import { OBSERVATORY_TEXTS } from '../../ports';

@Component({
  selector: 'app-intro-skip',
  templateUrl: './intro-skip.component.html',
  styleUrl: './intro-skip.component.scss',
})
export class IntroSkipComponent {
  protected readonly texts = inject(OBSERVATORY_TEXTS);
  protected readonly reveal = inject(HomeRevealService);
}
