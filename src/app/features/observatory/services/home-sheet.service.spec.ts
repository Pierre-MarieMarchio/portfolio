import { TestBed } from '@angular/core/testing';
import { provideStatewise } from 'ngx-statewise';
import { resizeTo, stubMedia } from '@testing/doubles/browser.double';
import { ObservatoryManager } from '../states';
import { HomeSheetService } from './home-sheet.service';

const TOUCH = new Set(['(pointer: coarse)', '(hover: none)']);
const SLUGS = ['alpha', 'beta', 'gamma'];

const mount = (isPhone = true) => {
  stubMedia(isPhone ? TOUCH : new Set());
  resizeTo(isPhone ? 412 : 1280, isPhone ? 915 : 800);
  TestBed.configureTestingModule({
    providers: [provideStatewise(), HomeSheetService],
  });
  const observatory = TestBed.inject(ObservatoryManager);
  observatory.syncRoute('home');
  const sheet = TestBed.inject(HomeSheetService);
  sheet.follow({ slugs: () => SLUGS, resting: () => 'alpha' });
  return { observatory, sheet };
};

describe('HomeSheetService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('the detent follows the project posed', () => {
    it('arrives at half height, with no project posed', () => {
      const { observatory, sheet } = mount();

      expect(sheet.detent()).toBe('half');
      expect(observatory.preview()).toBeNull();
    });

    it('rises to full when a project is posed from anywhere, and comes back to half when it is lifted', () => {
      const { observatory, sheet } = mount();

      observatory.openPreview('beta');
      expect(sheet.detent()).toBe('full');

      observatory.closePreview();
      expect(sheet.detent()).toBe('half');
    });

    it('stays at full while the posed project changes', () => {
      const { observatory, sheet } = mount();
      observatory.openPreview('beta');

      observatory.openPreview('gamma');

      expect(sheet.detent()).toBe('full');
      expect(observatory.preview()).toBe('gamma');
    });

    it('leaves a folded sheet folded when the reader has not posed anything', () => {
      const { observatory, sheet } = mount();

      sheet.settle('folded');
      observatory.hover('beta');

      expect(sheet.detent()).toBe('folded');
      expect(observatory.preview()).toBeNull();
    });
  });

  describe('the reader moves the sheet', () => {
    it('poses the hovered card when the sheet reaches full', () => {
      const { observatory, sheet } = mount();
      observatory.hover('gamma');

      sheet.settle('full');

      expect(observatory.preview()).toBe('gamma');
      expect(sheet.detent()).toBe('full');
    });

    it('poses the resting pick when no card is hovered', () => {
      const { observatory, sheet } = mount();

      sheet.settle('full');

      expect(observatory.preview()).toBe('alpha');
    });

    it('ignores a hovered body that is not featured', () => {
      const { observatory, sheet } = mount();
      observatory.hover('omega');

      sheet.settle('full');

      expect(observatory.preview()).toBe('alpha');
    });

    it('does not pose again a project already posed', () => {
      const { observatory, sheet } = mount();
      observatory.openPreview('beta');
      observatory.hover('gamma');

      sheet.settle('full');

      expect(observatory.preview()).toBe('beta');
    });

    it.each(['half', 'folded'] as const)(
      'lifts the project when the sheet comes down to %s, and stays there',
      (detent) => {
        const { observatory, sheet } = mount();
        observatory.openPreview('beta');

        sheet.settle(detent);

        expect(observatory.preview()).toBeNull();
        expect(sheet.detent()).toBe(detent);
      },
    );
  });

  describe('the project posed, page by page', () => {
    it('is the preview first, then the hovered card, then the resting pick', () => {
      const { observatory, sheet } = mount();
      expect(sheet.posed()).toBe('alpha');
      expect(sheet.posedIndex()).toBe(0);

      observatory.hover('gamma');
      expect(sheet.posed()).toBe('gamma');
      expect(sheet.posedIndex()).toBe(2);

      observatory.openPreview('beta');
      observatory.hover('gamma');
      expect(sheet.posed()).toBe('beta');
      expect(sheet.posedIndex()).toBe(1);
    });

    it('poses the neighbour a swipe settled on, only while a project is posed', () => {
      const { observatory, sheet } = mount();

      sheet.turnTo(2);
      expect(observatory.preview()).toBeNull();

      observatory.openPreview('alpha');
      sheet.turnTo(2);
      expect(observatory.preview()).toBe('gamma');
      expect(observatory.lastPreview()).toBe('gamma');
    });

    it('ignores a page that does not exist', () => {
      const { observatory, sheet } = mount();
      observatory.openPreview('alpha');

      sheet.turnTo(7);

      expect(observatory.preview()).toBe('alpha');
    });
  });

  describe('what the page shows of it', () => {
    it('draws the sheet on the phone home view, in place of the title', () => {
      const { observatory, sheet } = mount();

      expect(sheet.isPhone()).toBe(true);
      expect(sheet.isShown()).toBe(true);
      expect(sheet.showsTitle()).toBe(false);

      observatory.syncRoute('about');
      expect(sheet.isShown()).toBe(false);
    });

    it('draws the title, and no sheet, on the desktop home view', () => {
      const { sheet } = mount(false);

      expect(sheet.isPhone()).toBe(false);
      expect(sheet.isShown()).toBe(false);
      expect(sheet.showsTitle()).toBe(true);
    });

    it('anchors the scene on the cards at rest and on the project once posed', () => {
      const { observatory, sheet } = mount();
      expect(sheet.anchor()).toBe('rule');

      observatory.openPreview('beta');
      expect(sheet.anchor()).toBe('preview');
    });
  });
});
