import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { twoDigits } from '@app/core/utils/format.utils';
import { SegmentedComponent, SegmentedItem } from '@shared/ui/segmented';
import { WindowComponent } from '@shared/ui/window';

interface Part {
  readonly key: string;
  readonly label: string;
  readonly title: string;
}

/**
 * Four parts, in the order of the questions a recruiter asks: who is it, can
 * he do it, how does he work, where does he come from. The labels name the
 * content, not a metaphor.
 */
const PARTS: readonly Part[] = [
  { key: '00', label: 'Profil', title: 'Profil' },
  {
    key: '01',
    label: 'Compétences',
    title: 'Compétences · ce sur quoi j’ai livré',
  },
  { key: '02', label: 'Méthode', title: 'Méthode de travail' },
  { key: '03', label: 'Parcours', title: 'Parcours' },
];

const DOMAINS: readonly { label: string; value: string }[] = [
  { label: 'Web', value: 'API .NET, front Angular' },
  { label: 'Mobile', value: 'applications publiées, liées à un matériel' },
  { label: 'Matériel', value: 'intégration Bluetooth Low Energy' },
  { label: 'Desktop', value: 'applications Java Swing' },
  { label: 'Métier', value: 'flux bancaires, compensation européenne' },
];

/**
 * The facts are known, the dates are not: the place of each date is shown
 * rather than a date made up. To fill in (handoff §8), never guessed.
 */
const MILESTONES: readonly { year: string; fact: string }[] = [
  { year: '— — — —', fact: 'Archéologie : fouille, relevé, description' },
  { year: '— — — —', fact: 'Reconversion vers le développement' },
  {
    year: '— — — —',
    fact: 'Formation — intitulé et établissement à renseigner',
  },
  { year: '— — — —', fact: 'Numerilis — stage, refonte du back de Bk-ONE' },
  { year: '— — — —', fact: 'Skyted — concepteur développeur d’applications' },
];

/**
 * "About", one part at a time, like the approaches of a sheet: the same
 * selector at the top, the same footer moving the reading on. The reader
 * learns the window once.
 *
 * The lorem ipsum and the "à renseigner" lines are the mockup's own
 * placeholders (handoff §8): kept as they are until the real text exists.
 */
@Component({
  selector: 'app-about-window',
  imports: [RouterLink, SegmentedComponent, WindowComponent],
  templateUrl: './about-window.component.html',
  styleUrl: './about-window.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutWindowComponent {
  public readonly pinned = input(false);
  /** The part on show; the station holds it, the constellations read it. */
  public readonly part = input('00');

  public readonly pinToggled = output();
  public readonly closed = output();
  public readonly partChange = output<string>();

  protected readonly domains = DOMAINS.map((domain, index) => ({
    ...domain,
    number: twoDigits(index + 1),
  }));
  protected readonly milestones = MILESTONES;

  private readonly window = viewChild(WindowComponent);

  private readonly index = computed(() =>
    Math.max(
      0,
      PARTS.findIndex((part) => part.key === this.part()),
    ),
  );
  protected readonly current = computed(() => PARTS[this.index()] ?? PARTS[0]);

  /**
   * A heading mounted whatever the part: without it three views out of four
   * had no level one, and the arriving focus had no target.
   */
  protected readonly heading = computed(
    () => `À propos — ${this.current()?.title ?? ''}`,
  );

  protected readonly parts = computed<readonly SegmentedItem[]>(() =>
    PARTS.map((part) => ({
      value: part.key,
      label: part.label,
      active: part.key === this.current()?.key,
      aria: `Aller à : ${part.title}`,
    })),
  );

  protected readonly next = computed(() => PARTS[this.index() + 1] ?? null);

  constructor() {
    // A new part starts at its top; the first run is the arrival.
    let first = true;
    effect(() => {
      this.part();
      if (first) {
        first = false;
        return;
      }
      untracked(() => this.window()?.scrollBodyTo(0));
    });
  }

  protected advance(): void {
    const next = this.next();
    if (next) {
      this.partChange.emit(next.key);
    }
  }
}
