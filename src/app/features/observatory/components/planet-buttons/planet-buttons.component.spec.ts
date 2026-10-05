import { TestBed } from '@angular/core/testing';
import { stubMedia } from '@testing/doubles/browser.double';
import { recordOutput } from '@testing/fixtures/testbed.fixture';
import { provideTexts } from '@testing/fixtures/texts.fixture';
import { SceneTargetsService } from '@shared/space-scene/services';
import { ObservatoryView, Planet } from '../../models';
import { PlanetButtonsComponent } from './planet-buttons.component';

const BODIES: readonly Planet[] = [
  { slug: 'voice', title: 'Skyted Voice', short: 'Skyted Voice' },
  { slug: 'app', title: 'Skyted App', short: 'Skyted App' },
  {
    slug: 'template',
    title: 'Template Clean Architecture .NET',
    short: 'Template .NET',
  },
];

const mount = async (
  options: {
    view?: ObservatoryView;
    preview?: string;
    hovered?: string;
    canHover?: boolean;
  } = {},
) => {
  const canHover = options.canHover ?? true;
  stubMedia((query) => query === '(hover: none)' && !canHover);
  TestBed.configureTestingModule({
    imports: [PlanetButtonsComponent],
    providers: [provideTexts(), SceneTargetsService],
  });
  const fixture = TestBed.createComponent(PlanetButtonsComponent);
  fixture.componentRef.setInput('bodies', BODIES);
  fixture.componentRef.setInput('view', options.view ?? 'home');
  fixture.componentRef.setInput('preview', options.preview ?? null);
  fixture.componentRef.setInput('hovered', options.hovered ?? null);
  const clicked = recordOutput(fixture.componentInstance.bodyClicked);
  const hovered = recordOutput(fixture.componentInstance.bodyHovered);
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    clicked,
    hovered,
    buttons: () => [
      ...host.querySelectorAll<HTMLButtonElement>('button[data-scene-target]'),
    ],
  };
};

describe('PlanetButtonsComponent', () => {
  afterEach(() => {
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

  it('names them as list selections on the index, with no expanded state', async () => {
    const { buttons } = await mount({ view: 'index' });

    expect(buttons()[2]?.textContent.trim()).toBe(
      'Afficher Template Clean Architecture .NET dans la liste',
    );
    expect(buttons()[0]?.hasAttribute('aria-expanded')).toBe(false);
  });

  it('says which body the preview shows', async () => {
    const { buttons } = await mount({ preview: 'app' });

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
    const { buttons } = await mount();

    expect(TestBed.inject(SceneTargetsService).list()).toEqual(buttons());
  });

  it('emits the slug on a click, and on hover and focus, null on leaving', async () => {
    const { buttons, clicked, hovered } = await mount();
    const second = buttons()[1];
    if (!second) {
      throw new Error('expected a second body');
    }

    second.click();
    second.dispatchEvent(
      new PointerEvent('pointerenter', { pointerType: 'mouse' }),
    );
    second.dispatchEvent(
      new PointerEvent('pointerleave', { pointerType: 'mouse' }),
    );
    second.focus();
    second.blur();

    expect(clicked).toEqual(['app']);
    expect(hovered).toEqual(['app', null, 'app', null]);
  });

  it('reveals a body at the first touch without hover', async () => {
    const first = await mount({ canHover: false });
    first.buttons()[1]?.click();
    expect(first.clicked).toEqual([]);
    expect(first.hovered).toEqual(['app']);
  });

  it('opens a body at the second touch without hover', async () => {
    const second = await mount({ canHover: false, hovered: 'app' });
    second.buttons()[1]?.click();
    expect(second.clicked).toEqual(['app']);
  });

  it('opens at the first touch the body already in the preview', async () => {
    const { buttons, clicked } = await mount({
      canHover: false,
      preview: 'template',
    });

    buttons()[2]?.click();

    expect(clicked).toEqual(['template']);
  });

  it('selects at the first touch on the index', async () => {
    const { buttons, clicked } = await mount({
      view: 'index',
      canHover: false,
    });

    buttons()[0]?.click();

    expect(clicked).toEqual(['voice']);
  });
});
