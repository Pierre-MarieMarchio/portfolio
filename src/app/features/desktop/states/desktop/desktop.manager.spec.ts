import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideStatewise } from 'ngx-statewise';
import { DesktopEffect } from './desktop.effect';
import { DesktopManager } from './desktop.manager';
import { provideTexts } from '@testing/fixtures/texts.fixture';

describe('StationManager', () => {
  let navigated: string[];
  let manager: DesktopManager;

  beforeEach(() => {
    navigated = [];

    TestBed.configureTestingModule({
      providers: [
        provideTexts(),
        provideStatewise({ effects: [DesktopEffect] }),
        {
          provide: Router,
          useValue: {
            navigateByUrl: (url: string) => {
              navigated.push(url);
              return Promise.resolve(true);
            },
          },
        },
      ],
    });

    manager = TestBed.inject(DesktopManager);
  });

  it('exposes its state read-only', () => {
    expect('set' in manager.view).toBe(false);
    expect('set' in manager.slug).toBe(false);
    expect('set' in manager.pins).toBe(false);
    expect('set' in manager.preview).toBe(false);
    expect('set' in manager.lastPreview).toBe(false);
    expect('set' in manager.selected).toBe(false);
    expect('set' in manager.visited).toBe(false);
    expect('set' in manager.family).toBe(false);
    expect('set' in manager.chapter).toBe(false);
    expect('set' in manager.section).toBe(false);
    expect('set' in manager.hovered).toBe(false);
  });

  describe('showsList', () => {
    it('is true when the index is the current view', () => {
      manager.syncRoute('index');

      expect(manager.showsList()).toBe(true);
    });

    it('is true when the index is pinned over another view', () => {
      manager.syncRoute('home');
      manager.togglePin('index');

      expect(manager.showsList()).toBe(true);
    });

    it('is false otherwise', () => {
      manager.syncRoute('home');

      expect(manager.showsList()).toBe(false);
    });
  });

  describe('showsAbout', () => {
    it('is true when about is the current view', () => {
      manager.syncRoute('about');

      expect(manager.showsAbout()).toBe(true);
    });

    it('is true when about is pinned over another view', () => {
      manager.syncRoute('home');
      manager.togglePin('about');

      expect(manager.showsAbout()).toBe(true);
    });

    it('is false otherwise', () => {
      manager.syncRoute('home');

      expect(manager.showsAbout()).toBe(false);
    });
  });

  describe('showsPreview', () => {
    it('is true on home once a preview is open', () => {
      manager.syncRoute('home');
      manager.togglePreview('skyted');

      expect(manager.showsPreview()).toBe(true);
    });

    it('is true away from home when the preview is pinned', () => {
      manager.syncRoute('index');
      manager.togglePreview('skyted');
      manager.togglePin('preview');

      expect(manager.showsPreview()).toBe(true);
    });

    it('is false away from home when the preview is not pinned', () => {
      manager.syncRoute('index');
      manager.togglePreview('skyted');

      expect(manager.showsPreview()).toBe(false);
    });

    it('is false when nothing is open, even on home', () => {
      manager.syncRoute('home');

      expect(manager.showsPreview()).toBe(false);
    });
  });

  it('navigated dispatches the address change', () => {
    manager.syncRoute('sheet', 'skyted');

    expect(manager.view()).toBe('sheet');
    expect(manager.slug()).toBe('skyted');
  });

  it('togglePin dispatches the pin flip', () => {
    manager.togglePin('about');

    expect(manager.pins().about).toBe(true);
  });

  it('select dispatches the selection', () => {
    manager.select('skyted');

    expect(manager.selected()).toBe('skyted');
  });

  it('filter dispatches the family filter', () => {
    manager.filter('personal');

    expect(manager.family()).toBe('personal');
  });

  it('chooseChapter dispatches the chapter', () => {
    manager.chooseChapter(2);

    expect(manager.chapter()).toBe(2);
  });

  it('chooseSection dispatches the section', () => {
    manager.chooseSection(2);

    expect(manager.section()).toBe(2);
  });

  it('hover dispatches the hovered project', () => {
    manager.hover('skyted');

    expect(manager.hovered()).toBe('skyted');
  });

  /** The void button reads it; the effect reads the same rule. */
  describe('canStepBack', () => {
    it('is true on a sheet, an index with a row open, a home page with a preview', () => {
      manager.syncRoute('sheet', 'skyted');
      expect(manager.canStepBack()).toBe(true);

      manager.syncRoute('index');
      manager.select('skyted');
      expect(manager.canStepBack()).toBe(true);

      manager.syncRoute('home');
      manager.openPreview('skyted');
      expect(manager.canStepBack()).toBe(true);
    });

    it('is false where the void would close nothing', () => {
      manager.syncRoute('home');
      expect(manager.canStepBack()).toBe(false);
      manager.syncRoute('index');
      expect(manager.canStepBack()).toBe(false);
      manager.syncRoute('about');
      expect(manager.canStepBack()).toBe(false);
    });
  });

  describe('togglePreview', () => {
    it('opens the preview on a slug it was closed on', () => {
      manager.togglePreview('skyted');

      expect(manager.preview()).toBe('skyted');
    });

    it('closes the preview when called again with the same slug', () => {
      manager.togglePreview('skyted');

      manager.togglePreview('skyted');

      expect(manager.preview()).toBeNull();
    });

    it('switches to another slug rather than closing', () => {
      manager.togglePreview('skyted');

      manager.togglePreview('other');

      expect(manager.preview()).toBe('other');
    });
  });

  describe('openPreview', () => {
    it('opens the given slug', () => {
      manager.openPreview('skyted');

      expect(manager.preview()).toBe('skyted');
    });

    it('never closes it, even called again with the slug already open', () => {
      manager.openPreview('skyted');

      manager.openPreview('skyted');

      expect(manager.preview()).toBe('skyted');
    });
  });

  describe('close', () => {
    it('resolves once the effect has navigated home from the index', async () => {
      manager.syncRoute('index');

      await manager.close('index');

      expect(navigated).toEqual(['/']);
    });
  });

  describe('escape', () => {
    it('resolves once the effect has navigated back to the list from a sheet', async () => {
      manager.syncRoute('sheet', 'skyted');

      await manager.escape();

      expect(navigated).toEqual(['/projets']);
    });
  });

  describe('stepBack', () => {
    it('resolves once the effect has navigated back to the list from a sheet', async () => {
      manager.syncRoute('sheet', 'skyted');

      await manager.stepBack();

      expect(navigated).toEqual(['/projets']);
    });
  });
});
