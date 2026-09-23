import {
  afterEveryRender,
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { BrowserEnvironment } from '@app/core/services';
import { twoDigits } from '@app/core/utils/format.utils';
import { ObjectRegistry } from '@shared/ui/object-marks';
import { TurnGestureDirective } from '../../directives/turn-gesture.directive';
import { DESKTOP_TEXTS } from '../../ports';
import { canvasResolution } from '../../rules/canvas-resolution.rules';
import { PanelAnchor, sceneLayout } from '../../rules/scene-layout.rules';
import { PlanetButtonsComponent } from '../planet-buttons/planet-buttons.component';
import {
  EngineInputs,
  SpaceSceneEngine,
} from '../../engine/space-scene.engine';
import { SceneBody, SceneView } from '../../models/scene.model';

/** The mockup's resting density; the reserve and the screen scale it. */
const DENSITY = 3800;

/**
 * The object: a black hole in two `<canvas>` layers (the sky behind, the
 * matter in front) with the projects in orbit, and a `<button>` per planet
 * so that no information lives in the canvas only.
 *
 * Everything arrives by inputs, in ranks: the object knows no feature. The
 * frame loop lives in `SpaceSceneEngine` and writes no signal; the planets'
 * positions are written into the DOM by `transform`. An output only leaves
 * on a gesture.
 *
 * The text comes before the matter: every element declared `appObjectPanel`
 * is a panel the object dims its matter behind and keeps its labels off.
 * Its role, when it has one, is read by the framing: `head` (the top bar:
 * it bounds the free band), `rule`, `sheet` and `preview` (their left edge
 * bounds the approach). Every element declared `appObjectLine` is a line of
 * the home rule, in rank order: it rises with its planet, on the same
 * clock. Both sign in to `ObjectRegistry`. Panels are measured when something changed
 * (a render, a resize, the end of a gesture or an animation), never in the
 * loop.
 */
@Component({
  selector: 'app-space-scene',
  imports: [PlanetButtonsComponent, TurnGestureDirective],
  templateUrl: './space-scene.component.html',
  styleUrl: './space-scene.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpaceSceneComponent {
  private readonly browser = inject(BrowserEnvironment);
  private readonly registry = inject(ObjectRegistry);
  private readonly texts = inject(DESKTOP_TEXTS);

  /** The projects in rank order: the rank is the distance to the centre. */
  public readonly bodies = input<readonly SceneBody[]>([]);
  /** How many of the first bodies are featured on the home page. */
  public readonly featured = input(4);
  public readonly view = input<SceneView>('home');
  /** Rank of the sheet's project, -1 elsewhere. */
  public readonly focus = input(-1);
  public readonly chapter = input(0);
  /** Part of "about" on show, 0 to 3. */
  public readonly part = input(0);
  /** Rank of the project in the preview, -1 when it is closed. */
  public readonly preview = input(-1);
  /** Rank under the pointer, -1 for none. */
  public readonly hovered = input(-1);
  /** Rank of the open index row, -1 for none: its planet wears the lock. */
  public readonly selected = input(-1);
  public readonly paused = input(false);
  /**
   * The home page's rest has arrived: its planets and orbits rise with it.
   * The composition decides when; reduced motion shows them at once.
   */
  public readonly revealed = input(false);

  /** A planet was clicked: the composition decides what it means. */
  public readonly bodyClicked = output<number>();
  /** A planet was pointed at or focused; -1 when it is left. */
  public readonly bodyHovered = output<number>();
  /** A drag of more than 6 px just ended: the click that follows is not one. */
  public readonly spun = output();

  /** No 2D context: the static disc stands in and the planets go. */
  protected readonly failed = signal(false);
  protected readonly running = signal(false);
  /** `true` until the browser says otherwise, like the prerender. */
  private readonly reduced = signal(true);

  /**
   * Whether the object is drawn and moving: only then does a pause mean
   * something. `false` while prerendering.
   */
  public readonly animated = computed(() => this.running() && !this.reduced());

  /** The planets are targets on the home page and the index only. */
  protected readonly targets = computed(() => {
    const view = this.view();
    return view === 'home' || view === 'index';
  });
  protected readonly labelled = computed(() => {
    const view = this.view();
    return view === 'home' || view === 'index' || view === 'sheet';
  });

  protected readonly labels = computed(() => {
    const isIndex = this.view() === 'index';
    return this.bodies().map((body, rank) =>
      isIndex ? twoDigits(rank + 1) : body.short,
    );
  });

  private readonly sky =
    viewChild.required<ElementRef<HTMLCanvasElement>>('sky');
  private readonly matter =
    viewChild.required<ElementRef<HTMLCanvasElement>>('matter');
  private readonly planetButtons = viewChild(PlanetButtonsComponent);
  private readonly labelNodes = viewChildren<ElementRef<HTMLElement>>('label');

  protected readonly engine = signal<SpaceSceneEngine | null>(null);
  private readonly stops: (() => void)[] = [];

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Inputs go to the engine as a plain snapshot: it reads no signal, so
    // the frame loop cannot make a template dirty.
    effect(() => {
      const snapshot = this.snapshot();
      untracked(() => {
        this.engine()?.setInputs(snapshot);
      });
    });

    effect(() => {
      const buttons = this.buttonElements();
      const labels = this.labelElements();
      untracked(() => {
        this.engine()?.setNodes(buttons, labels);
      });
    });

    // After any render the panels may have moved, a window opened, a label
    // changed its text: measured in the read phase, after every write.
    afterEveryRender({
      read: () => {
        this.measure();
      },
    });

    afterNextRender(() => {
      this.boot();
    });

    destroyRef.onDestroy(() => {
      for (const stop of this.stops) {
        stop();
      }
      this.engine()?.stop();
      this.engine.set(null);
    });
  }

  private buttonElements(): HTMLElement[] {
    const buttons = this.planetButtons()?.buttons() ?? [];
    return buttons.map((ref) => ref.nativeElement);
  }

  private labelElements(): HTMLElement[] {
    return this.labelNodes().map((ref) => ref.nativeElement);
  }

  private snapshot(): EngineInputs {
    return {
      count: this.bodies().length,
      featured: this.featured(),
      view: this.view(),
      focus: this.focus(),
      chapter: this.chapter(),
      part: this.part(),
      preview: this.preview(),
      hovered: this.hovered(),
      selected: this.selected(),
      paused: this.paused(),
      reduced: this.reduced(),
      revealed: this.revealed() || this.reduced(),
      partLabels: this.texts().object.parts,
    };
  }

  private boot(): void {
    const matter = this.matter().nativeElement;
    const ctx = this.browser.context2d(matter);
    if (!ctx) {
      this.failed.set(true);
      return;
    }
    const skyCtx = this.browser.context2d(this.sky().nativeElement);
    this.reduced.set(this.browser.prefersReducedMotion());
    const engine = this.createEngine(ctx, skyCtx);
    this.engine.set(engine);
    engine.setInputs(untracked(() => this.snapshot()));
    engine.setNodes(this.buttonElements(), this.labelElements());
    this.resize();
    this.measure();
    this.watch(engine, matter);
    this.browser.whenFontsReady(() => this.measure());
    this.running.set(true);
  }

  private createEngine(
    ctx: CanvasRenderingContext2D,
    skyCtx: CanvasRenderingContext2D | null,
  ): SpaceSceneEngine {
    const viewport = this.browser.viewport() ?? { width: 1280, height: 800 };
    return new SpaceSceneEngine(
      {
        frame: (callback) => this.browser.nextFrame(callback),
        now: () => this.browser.now(),
        hidden: () => this.browser.isHidden(),
      },
      { matter: ctx, sky: skyCtx },
      {
        rnd: Math.random,
        density: DENSITY,
        aboutBodies: 'constellations',
        ink: this.browser.rootStyle('--ink') || '#2b2f3a',
        accent: this.browser.rootStyle('--accent') || '#3b62c4',
      },
      viewport.width * viewport.height,
    );
  }

  private watch(engine: SpaceSceneEngine, matter: HTMLCanvasElement): void {
    this.stops.push(
      this.browser.observeResize(matter, () => {
        this.resize();
        this.measure();
      }),
      this.browser.observeIntersection(matter, 0.01, (visible) => {
        engine.setVisible(visible);
      }),
      this.browser.watchVisibility((hidden) => {
        if (hidden) {
          engine.stop();
        } else {
          engine.request();
        }
      }),
      this.browser.watchMedia('(prefers-reduced-motion: reduce)', (reduce) => {
        this.reduced.set(reduce);
      }),
      this.browser.listen('resize', () => this.measure(), { passive: true }),
      // A window dragged, a panel that finished rising: measured once, at
      // the end, never during.
      this.browser.listen('pointerup', () => this.measure(), { passive: true }),
      this.browser.listen('animationend', () => this.measure(), {
        capture: true,
      }),
      this.browser.listen('transitionend', () => this.measure(), {
        capture: true,
      }),
      this.browser.listen(
        'pointermove',
        (event) => {
          if (event.pointerType !== 'touch') {
            engine.setPointer(event.clientX, event.clientY);
          }
        },
        { passive: true },
      ),
    );
  }

  /** Canvas size in device pixels, the ratio capped at 2 and by the budget. */
  private resize(): void {
    const engine = this.engine();
    if (!engine) {
      return;
    }
    const matter = this.matter().nativeElement;
    const sky = this.sky().nativeElement;
    const { width, height, pixelRatio } = canvasResolution(
      matter.getBoundingClientRect(),
      this.browser.devicePixelRatio(),
    );
    for (const canvas of [matter, sky]) {
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    }
    engine.resize(width, height, pixelRatio);
  }

  /**
   * Every read of the layout the object needs, at once: all the rects
   * before any write, or each read forces a layout of its own.
   */
  private measure(): void {
    const engine = this.engine();
    if (!engine) {
      return;
    }
    const canvas = this.matter().nativeElement.getBoundingClientRect();
    const anchors: PanelAnchor[] = [];
    for (const { element, role } of this.registry.panels()) {
      // A panel held out of sight (the home page's rest, during the
      // crossing) is not there yet: the mockup mounts it later. Measured,
      // the run was framed for a rule that did not show.
      if (this.browser.computedStyle(element, 'visibility') === 'hidden') {
        continue;
      }
      anchors.push({
        rect: element.getBoundingClientRect(),
        opacity: this.browser.computedStyle(element, 'opacity'),
        role: role(),
      });
    }
    engine.setLines(this.registry.lines());
    engine.measureLabels();
    const viewport = this.browser.viewport() ?? { width: 1200, height: 800 };
    engine.setLayout(sceneLayout(canvas, viewport, anchors));
  }
}
