import { TestBed } from '@angular/core/testing';
import { provideTexts } from '@testing/texts';
import { SceneBody, SceneView } from '../../models/scene.model';
import { PlanetButtonsComponent } from './planet-buttons.component';

const BODIES: readonly SceneBody[] = [
  { title: 'Skyted Voice', short: 'Skyted Voice' },
  { title: 'Skyted App', short: 'Skyted App' },
  { title: 'Template Clean Architecture .NET', short: 'Template .NET' },
];

const stubHover = (canHover: boolean): void => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(hover: none)' && !canHover,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
};

const mount = async (
  options: {
    view?: SceneView;
    preview?: number;
    hovered?: number;
    canHover?: boolean;
  } = {},
) => {
  stubHover(options.canHover ?? true);
  TestBed.configureTestingModule({
    imports: [PlanetButtonsComponent],
    providers: [provideTexts()],
  });
  const fixture = TestBed.createComponent(PlanetButtonsComponent);
  fixture.componentRef.setInput('bodies', BODIES);
  fixture.componentRef.setInput('view', options.view ?? 'home');
  fixture.componentRef.setInput('preview', options.preview ?? -1);
  fixture.componentRef.setInput('hovered', options.hovered ?? -1);
  const clicked: number[] = [];
  const hovered: number[] = [];
  fixture.componentInstance.bodyClicked.subscribe((rank) => clicked.push(rank));
  fixture.componentInstance.bodyHovered.subscribe((rank) => hovered.push(rank));
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    clicked,
    hovered,
    buttons: () => [
      ...host.querySelectorAll<HTMLButtonElement>('button[data-object-body]'),
    ],
  };
};

describe('PlanetButtonsComponent', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it('names a button per body as a preview', async () => {
    const { buttons } = await mount();

    expect(buttons().map((button) => button.textContent.trim())).toEqual([
      'Aperçu du projet Skyted Voice',
      'Aperçu du projet Skyted App',
      'Aperçu du projet Template Clean Architecture .NET',
    ]);
  });

  it('names them as index selections on the index, with no expanded state', async () => {
    const { buttons } = await mount({ view: 'index' });

    expect(buttons()[2]?.textContent.trim()).toBe(
      'Sélectionner 03 — Template Clean Architecture .NET dans le relevé',
    );
    expect(buttons()[0]?.hasAttribute('aria-expanded')).toBe(false);
  });

  it('says which body the preview shows', async () => {
    const { buttons } = await mount({ preview: 1 });

    expect(
      buttons().map((button) => button.getAttribute('aria-expanded')),
    ).toEqual(['false', 'true', 'false']);
  });

  it('keeps every button out of reach until the scene places it', async () => {
    const { buttons } = await mount();

    for (const button of buttons()) {
      expect(button.getAttribute('aria-hidden')).toBe('true');
      expect(button.tabIndex).toBe(-1);
    }
  });

  it('hands the scene its buttons, in rank order', async () => {
    const { fixture, buttons } = await mount();

    expect(
      fixture.componentInstance.buttons().map((ref) => ref.nativeElement),
    ).toEqual(buttons());
  });

  it('emits the rank on a click, and on hover and focus, -1 on leaving', async () => {
    const { buttons, clicked, hovered } = await mount();
    const second = buttons()[1];
    if (!second) {
      throw new Error('expected a second body');
    }

    second.click();
    second.dispatchEvent(new MouseEvent('mouseenter'));
    second.dispatchEvent(new MouseEvent('mouseleave'));
    second.dispatchEvent(new FocusEvent('focus'));
    second.dispatchEvent(new FocusEvent('blur'));

    expect(clicked).toEqual([1]);
    expect(hovered).toEqual([1, -1, 1, -1]);
  });

  it('takes two touches without hover: the first reveals, the second opens', async () => {
    const first = await mount({ canHover: false });
    first.buttons()[1]?.click();
    expect(first.clicked).toEqual([]);
    expect(first.hovered).toEqual([1]);
    TestBed.resetTestingModule();

    const second = await mount({ canHover: false, hovered: 1 });
    second.buttons()[1]?.click();
    expect(second.clicked).toEqual([1]);
  });

  it('opens at the first touch the body already in the preview', async () => {
    const { buttons, clicked } = await mount({ canHover: false, preview: 2 });

    buttons()[2]?.click();

    expect(clicked).toEqual([2]);
  });

  it('selects at the first touch on the index', async () => {
    const { buttons, clicked } = await mount({
      view: 'index',
      canHover: false,
    });

    buttons()[0]?.click();

    expect(clicked).toEqual([0]);
  });
});
