import {
  Component,
  ElementRef,
  inject,
  input,
  output,
  viewChildren,
} from '@angular/core';
import { SHARED_TEXTS } from '../../ports';
import { Entrance } from '../../models/entrance.model';
import { NavigationItem } from '../../models/navigation-item.model';

@Component({
  selector: 'app-main-nav',
  templateUrl: './main-nav.component.html',
  styleUrl: './main-nav.component.scss',
  host: { '[attr.data-arrival]': 'arrival()' },
})
export class MainNavComponent {
  public readonly items = input.required<readonly NavigationItem[]>();
  public readonly current = input<string | null>(null);
  public readonly openRoutes = input<readonly string[]>([]);
  public readonly arrival = input<Entrance>('timed');
  public readonly chosen = output<string>();

  protected readonly texts = inject(SHARED_TEXTS);
  private readonly entries =
    viewChildren<ElementRef<HTMLAnchorElement>>('entry');

  public focusRoute(route: string): void {
    this.entries()
      .find((entry) => entry.nativeElement.getAttribute('href') === route)
      ?.nativeElement.focus();
  }

  protected onTap(event: MouseEvent, item: NavigationItem): void {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    this.chosen.emit(item.route);
  }

  protected isOpen(item: NavigationItem): boolean {
    return this.openRoutes().includes(item.route);
  }
}
