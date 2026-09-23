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
import {
  EngineInputs,
  Layout,
  ObjectEngine,
  PanelRect,
} from './engine/object-engine';
import { ObjectBody, ObjectView } from './object.model';

/** The mockup's resting density; the reserve and the screen scale it. */
const DENSITY = 3800;

/**
 * The most device pixels a canvas may hold. The crossing's cost follows the
 * pixels drawn and the stars, whose number follows them too: past about
 * five million pixels a canvas, a 4K screen at 200% fell to under ten frames
 * a second during the run. 4.2 million keeps a 1080p screen at 150% and a
 * 13-inch retina screen at full sharpness; beyond, the ratio gives way, and
 * dust drawn in 2.5 px squares loses nothing to it.
 */
const PIXEL_BUDGET = 4_200_000;

/**
 * The object: a black hole in two `<canvas>` layers (the sky behind, the
 * matter in front) with the projects in orbit, and a `<button>` per planet
 * so that no information lives in the canvas only.
 *
 * Everything arrives by inputs, in ranks: the object knows no feature. The
 * frame loop lives in `ObjectEngine` and writes no signal; the planets'
 * positions are written into the DOM by `transform`. An output only leaves
 * on a gesture.
 *
 * The text comes before the matter: every `[data-panel]` element of the
 * document is a panel the object dims its matter behind and keeps its
 * labels off. Its value may name a role the framing reads: `head` (the top
 * bar: it bounds the free band), `rule`, `sheet` and `preview` (their left
 * edge bounds the approach). Every `[data-object-line]` element is a line
 * of the home rule, in rank order: it rises with its planet, on the same
 * clock. Panels are measured when something changed
 * (a render, a resize, the end of a gesture or an animation), never in the
 * loop.
 */
@Component({
  selector: 'app-object',
  templateUrl: './object.component.html',
  styleUrl: './object.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ObjectComponent {
  private readonly browser = inject(BrowserEnvironment);

  /** The projects in rank order: the rank is the distance to the centre. */
  public readonly bodies = input<readonly ObjectBody[]>([]);
  /** How many of the first bodies are featured on the home page. */
  public readonly featured = input(4);
  public readonly view = input<ObjectView>('home');
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

  protected readonly entries = computed(() => {
    const index = this.view() === 'index';
    const preview = this.preview();
    return this.bodies().map((body, rank) => {
      const number = String(rank + 1).padStart(2, '0');
      return {
        label: index ? number : body.short,
        name: index
          ? `Sélectionner ${number} — ${body.title} dans le relevé`
          : `Aperçu du projet ${body.title}`,
        expanded: index ? null : preview === rank,
      };
    });
  });

  private readonly sky =
    viewChild.required<ElementRef<HTMLCanvasElement>>('sky');
  private readonly matter =
    viewChild.required<ElementRef<HTMLCanvasElement>>('matter');
  private readonly nodes = viewChildren<ElementRef<HTMLElement>>('node');
  private readonly labels = viewChildren<ElementRef<HTMLElement>>('label');

  private engine: ObjectEngine | null = null;
  private readonly stops: (() => void)[] = [];
  private readonly gesture: (() => void)[] = [];

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Inputs go to the engine as a plain snapshot: it reads no signal, so
    // the frame loop cannot make a template dirty.
    effect(() => {
      const snapshot = this.snapshot();
      untracked(() => {
        this.engine?.setInputs(snapshot);
      });
    });

    effect(() => {
      const buttons = this.nodes().map((ref) => ref.nativeElement);
      const labels = this.labels().map((ref) => ref.nativeElement);
      untracked(() => {
        this.engine?.setNodes(buttons, labels);
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
      this.endGesture();
      for (const stop of this.stops) {
        stop();
      }
      this.engine?.stop();
      this.engine = null;
    });
  }

  protected onClick(rank: number): void {
    // Without hover (touch), a planet takes two touches: the first reveals
    // the project's name, the second opens it.
    if (
      this.view() !== 'index' &&
      this.browser.cannotHover() &&
      this.hovered() !== rank &&
      this.preview() !== rank
    ) {
      this.bodyHovered.emit(rank);
      return;
    }
    this.bodyClicked.emit(rank);
  }

  protected onEnter(rank: number): void {
    this.bodyHovered.emit(rank);
  }

  protected onLeave(): void {
    this.bodyHovered.emit(-1);
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
    const root = this.browser.document.documentElement;
    const viewport = this.browser.viewport() ?? { width: 1280, height: 800 };
    const engine = new ObjectEngine(
      {
        frame: (callback) => this.browser.nextFrame(callback),
        now: () => this.browser.now(),
        hidden: () => this.browser.isHidden(),
      },
      ctx,
      skyCtx,
      {
        rnd: Math.random,
        density: DENSITY,
        aboutBodies: 'constellations',
        ink: this.browser.computedStyle(root, '--ink') || '#2b2f3a',
        accent: this.browser.computedStyle(root, '--accent') || '#3b62c4',
      },
      viewport.width * viewport.height,
    );
    this.engine = engine;
    engine.setInputs(untracked(() => this.snapshot()));
    engine.setNodes(
      this.nodes().map((ref) => ref.nativeElement),
      this.labels().map((ref) => ref.nativeElement),
    );
    this.resize();
    this.measure();

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
      this.browser.listen('pointerdown', (event) => this.onGrab(event), {
        capture: true,
      }),
    );
    this.browser.whenFontsReady(() => this.measure());
    this.running.set(true);
  }

  /** Canvas size in device pixels, the ratio capped at 2 and by the budget. */
  private resize(): void {
    const engine = this.engine;
    if (!engine) {
      return;
    }
    const matter = this.matter().nativeElement;
    const sky = this.sky().nativeElement;
    const rect = matter.getBoundingClientRect();
    const area = Math.max(1, rect.width * rect.height);
    const dpr = Math.min(
      2,
      this.browser.devicePixelRatio(),
      Math.sqrt(PIXEL_BUDGET / area),
    );
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    for (const canvas of [matter, sky]) {
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    }
    engine.resize(width, height, dpr);
  }

  /**
   * Every read of the layout the object needs, at once: all the rects
   * before any write, or each read forces a layout of its own.
   */
  private measure(): void {
    const engine = this.engine;
    if (!engine) {
      return;
    }
    const canvas = this.matter().nativeElement.getBoundingClientRect();
    const panels: PanelRect[] = [];
    let headHeight: number | null = null;
    let ruleHeight: number | null = null;
    let sheetLeft: number | null = null;
    let previewLeft: number | null = null;
    const elements =
      this.browser.document.querySelectorAll<HTMLElement>('[data-panel]');
    for (const element of Array.from(elements)) {
      // A panel held out of sight (the home page's rest, during the
      // crossing) is not there yet: the mockup mounts it later. Measured,
      // the run was framed for a rule that did not show.
      if (this.browser.computedStyle(element, 'visibility') === 'hidden') {
        continue;
      }
      const rect = element.getBoundingClientRect();
      const opacity = Number.parseFloat(
        this.browser.computedStyle(element, 'opacity'),
      );
      panels.push({
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        opacity: Number.isFinite(opacity) ? opacity : 1,
      });
      const shown = rect.width > 0 && rect.height > 0;
      switch (shown ? element.dataset['panel'] : undefined) {
        case 'head':
          headHeight = Math.round(rect.height);
          break;
        case 'rule':
          ruleHeight = Math.round(rect.height);
          break;
        case 'sheet':
          sheetLeft = Math.round(rect.left);
          break;
        case 'preview':
          previewLeft = rect.left;
          break;
      }
    }
    engine.setLines(
      Array.from(
        this.browser.document.querySelectorAll<HTMLElement>(
          '[data-object-line]',
        ),
      ),
    );
    engine.measureLabels();
    const viewport = this.browser.viewport() ?? { width: 1200, height: 800 };
    const layout: Layout = {
      canvas: { left: canvas.left, top: canvas.top },
      viewport,
      panels,
      headHeight,
      ruleHeight,
      sheetLeft,
      previewLeft,
    };
    engine.setLayout(layout);
  }

  /**
   * Turning the object by hand. Everything that already has a gesture keeps
   * it: the panels, links, fields and the planets themselves.
   */
  private onGrab(event: PointerEvent): void {
    const engine = this.engine;
    const target = event.target instanceof Element ? event.target : null;
    if (!engine || event.button !== 0 || !target) {
      return;
    }
    if (
      target.closest(
        '[data-panel], [data-object-body], a, input, textarea, select',
      )
    ) {
      return;
    }
    if (!engine.grab(event.clientX, event.clientY)) {
      return;
    }
    this.endGesture();
    this.browser.document.body.style.cursor = 'grabbing';
    this.gesture.push(
      this.browser.listen(
        'pointermove',
        (move) => {
          engine.turn(move.clientX, move.clientY);
        },
        { passive: true },
      ),
      this.browser.listen('pointerup', () => this.release()),
      this.browser.listen('pointercancel', () => this.release()),
    );
  }

  private release(): void {
    const spun = this.engine?.release() ?? false;
    this.endGesture();
    // A drag is not a click: without this, turning the object closed the
    // preview on release.
    if (spun) {
      this.spun.emit();
    }
  }

  private endGesture(): void {
    for (const stop of this.gesture.splice(0)) {
      stop();
      this.browser.document.body.style.cursor = '';
    }
  }
}
