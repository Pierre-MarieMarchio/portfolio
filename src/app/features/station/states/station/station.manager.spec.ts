import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideStatewise } from 'ngx-statewise';
import { StationEffect } from './station.effect';
import { StationManager } from './station.manager';

describe('StationManager', () => {
  let navigated: string[];
  let manager: StationManager;

  beforeEach(() => {
    navigated = [];

    TestBed.configureTestingModule({
      providers: [
        provideStatewise({ effects: [StationEffect] }),
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

    manager = TestBed.inject(StationManager);
  });

  it('exposes its state read-only', () => {
    expect('set' in manager.view).toBe(false);
    expect('set' in manager.slug).toBe(false);
    expect('set' in manager.pins).toBe(false);
    expect('set' in manager.preview).toBe(false);
    expect('set' in manager.selection).toBe(false);
    expect('set' in manager.visited).toBe(false);
    expect('set' in manager.family).toBe(false);
    expect('set' in manager.chapter).toBe(false);
    expect('set' in manager.part).toBe(false);
    expect('set' in manager.hovered).toBe(false);
    expect('set' in manager.englishAsked).toBe(false);
    expect('set' in manager.paused).toBe(false);
  });

  describe('showsIndex', () => {
    it('is true when the index is the current view', () => {
      manager.navigated('index');

      expect(manager.showsIndex()).toBe(true);
    });

    it('is true when the index is pinned over another view', () => {
      manager.navigated('home');
      manager.togglePin('index');

      expect(manager.showsIndex()).toBe(true);
    });

    it('is false otherwise', () => {
      manager.navigated('home');

      expect(manager.showsIndex()).toBe(false);
    });
  });

  describe('showsAbout', () => {
    it('is true when about is the current view', () => {
      manager.navigated('about');

      expect(manager.showsAbout()).toBe(true);
    });

    it('is true when about is pinned over another view', () => {
      manager.navigated('home');
      manager.togglePin('about');

      expect(manager.showsAbout()).toBe(true);
    });

    it('is false otherwise', () => {
      manager.navigated('home');

      expect(manager.showsAbout()).toBe(false);
    });
  });

  describe('showsPreview', () => {
    it('is true on home once a preview is open', () => {
      manager.navigated('home');
      manager.togglePreview('skyted');

      expect(manager.showsPreview()).toBe(true);
    });

    it('is true away from home when the preview is pinned', () => {
      manager.navigated('index');
      manager.togglePreview('skyted');
      manager.togglePin('preview');

      expect(manager.showsPreview()).toBe(true);
    });

    it('is false away from home when the preview is not pinned', () => {
      manager.navigated('index');
      manager.togglePreview('skyted');

      expect(manager.showsPreview()).toBe(false);
    });

    it('is false when nothing is open, even on home', () => {
      manager.navigated('home');

      expect(manager.showsPreview()).toBe(false);
    });
  });

  it('navigated dispatches the address change', () => {
    manager.navigated('sheet', 'skyted');

    expect(manager.view()).toBe('sheet');
    expect(manager.slug()).toBe('skyted');
  });

  it('togglePin dispatches the pin flip', () => {
    manager.togglePin('about');

    expect(manager.pins().about).toBe(true);
  });

  it('select dispatches the selection', () => {
    manager.select('skyted');

    expect(manager.selection()).toBe('skyted');
  });

  it('filter dispatches the family filter', () => {
    manager.filter('personal');

    expect(manager.family()).toBe('personal');
  });

  it('chooseChapter dispatches the chapter', () => {
    manager.chooseChapter(2);

    expect(manager.chapter()).toBe(2);
  });

  it('choosePart dispatches the part', () => {
    manager.choosePart('02');

    expect(manager.part()).toBe('02');
  });

  it('hover dispatches the hovered project', () => {
    manager.hover('skyted');

    expect(manager.hovered()).toBe('skyted');
  });

  it('askEnglish dispatches the flag', () => {
    manager.askEnglish();

    expect(manager.englishAsked()).toBe(true);
  });

  it('togglePause dispatches the pause flip', () => {
    manager.togglePause();

    expect(manager.paused()).toBe(true);
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

  describe('showPreview', () => {
    it('opens the given slug', () => {
      manager.showPreview('skyted');

      expect(manager.preview()).toBe('skyted');
    });

    it('never closes it, even called again with the slug already open', () => {
      manager.showPreview('skyted');

      manager.showPreview('skyted');

      expect(manager.preview()).toBe('skyted');
    });
  });

  describe('close', () => {
    it('resolves once the effect has navigated home from the index', async () => {
      manager.navigated('index');

      await manager.close('index');

      expect(navigated).toEqual(['/']);
    });
  });

  describe('escape', () => {
    it('resolves once the effect has navigated back to the list from a sheet', async () => {
      manager.navigated('sheet', 'skyted');

      await manager.escape();

      expect(navigated).toEqual(['/projets']);
    });
  });

  describe('clickVoid', () => {
    it('resolves once the effect has navigated back to the list from a sheet', async () => {
      manager.navigated('sheet', 'skyted');

      await manager.clickVoid();

      expect(navigated).toEqual(['/projets']);
    });
  });
});
