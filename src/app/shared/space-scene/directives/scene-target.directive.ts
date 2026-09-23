import { DestroyRef, Directive, ElementRef, inject } from '@angular/core';
import { SceneTargetsService } from '../services/scene-targets.service';

@Directive({
  selector: '[appSceneTarget]',
  host: { 'data-scene-target': '' },
})
export class SceneTargetDirective {
  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const leave = inject(SceneTargetsService).add(element);
    inject(DestroyRef).onDestroy(leave);
  }
}
