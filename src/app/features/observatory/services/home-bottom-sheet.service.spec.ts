import { TestBed } from '@angular/core/testing';
import { provideStatewise } from 'ngx-statewise';
import { resizeTo, stubMedia } from '@testing/doubles/browser.double';
import { ObservatoryManager } from '../states';
import { HomeBottomSheetService } from './home-bottom-sheet.service';

const TOUCH = new Set(['(pointer: coarse)', '(hover: none)']);
const SLUGS = ['alpha', 'beta', 'gamma'];

const mount = (isPhone = true) => {
  stubMedia(isPhone ? TOUCH : new Set());
  resizeTo(isPhone ? 412 : 1280, isPhone ? 915 : 800);
  TestBed.configureTestingModule({
    providers: [provideStatewise(), HomeBottomSheetService],
  });
  const observatory = TestBed.inject(ObservatoryManager);
  observatory.syncRoute('home');
  const homeBottomSheet = TestBed.inject(HomeBottomSheetService);
  homeBottomSheet.follow(
    () => SLUGS,
    () => 'alpha',
  );
  return { observatory, homeBottomSheet };
};

describe('HomeBottomSheetService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('the detent follows the project posed', () => {
    it('arrives at half height, with no project posed', () => {
      const { observatory, homeBottomSheet } = mount();

      expect(homeBottomSheet.detent()).toBe('half');
      expect(observatory.preview()).toBeNull();
    });

    it('rises to full when a project is posed from anywhere, and comes back to half when it is lifted', () => {
      const { observatory, homeBottomSheet } = mount();

      observatory.openPreview('beta');
      expect(homeBottomSheet.detent()).toBe('full');

      observatory.closePreview();
      expect(homeBottomSheet.detent()).toBe('half');
    });

    it('stays at full while the posed project changes', () => {
      const { observatory, homeBottomSheet } = mount();
      observatory.openPreview('beta');

      observatory.openPreview('gamma');

      expect(homeBottomSheet.detent()).toBe('full');
      expect(observatory.preview()).toBe('gamma');
    });

    it('leaves a folded home bottom sheet folded when the reader has not posed anything', () => {
      const { observatory, homeBottomSheet } = mount();

      homeBottomSheet.settle('folded');
      observatory.hover('beta');

      expect(homeBottomSheet.detent()).toBe('folded');
      expect(observatory.preview()).toBeNull();
    });
  });

  describe('the reader moves the home bottom sheet', () => {
    it('poses the hovered card when the home bottom sheet reaches full', () => {
      const { observatory, homeBottomSheet } = mount();
      observatory.hover('gamma');

      homeBottomSheet.settle('full');

      expect(observatory.preview()).toBe('gamma');
      expect(homeBottomSheet.detent()).toBe('full');
    });

    it('poses the resting pick when no card is hovered', () => {
      const { observatory, homeBottomSheet } = mount();

      homeBottomSheet.settle('full');

      expect(observatory.preview()).toBe('alpha');
    });

    it('ignores a hovered body that is not featured', () => {
      const { observatory, homeBottomSheet } = mount();
      observatory.hover('omega');

      homeBottomSheet.settle('full');

      expect(observatory.preview()).toBe('alpha');
    });

    it('does not pose again a project already posed', () => {
      const { observatory, homeBottomSheet } = mount();
      observatory.openPreview('beta');
      observatory.hover('gamma');

      homeBottomSheet.settle('full');

      expect(observatory.preview()).toBe('beta');
    });

    it.each(['half', 'folded'] as const)(
      'lifts the project when the home bottom sheet comes down to %s, and stays there',
      (detent) => {
        const { observatory, homeBottomSheet } = mount();
        observatory.openPreview('beta');

        homeBottomSheet.settle(detent);

        expect(observatory.preview()).toBeNull();
        expect(homeBottomSheet.detent()).toBe(detent);
      },
    );
  });

  describe('the project posed, page by page', () => {
    it('is the preview first, then the hovered card, then the resting pick', () => {
      const { observatory, homeBottomSheet } = mount();
      expect(homeBottomSheet.posed()).toBe('alpha');
      expect(homeBottomSheet.posedIndex()).toBe(0);

      observatory.hover('gamma');
      expect(homeBottomSheet.posed()).toBe('gamma');
      expect(homeBottomSheet.posedIndex()).toBe(2);

      observatory.openPreview('beta');
      observatory.hover('gamma');
      expect(homeBottomSheet.posed()).toBe('beta');
      expect(homeBottomSheet.posedIndex()).toBe(1);
    });

    it('poses the neighbour a swipe settled on, only while a project is posed', () => {
      const { observatory, homeBottomSheet } = mount();

      homeBottomSheet.turnTo(2);
      expect(observatory.preview()).toBeNull();

      observatory.openPreview('alpha');
      homeBottomSheet.turnTo(2);
      expect(observatory.preview()).toBe('gamma');
      expect(observatory.lastPreview()).toBe('gamma');
    });

    it('ignores a page that does not exist', () => {
      const { observatory, homeBottomSheet } = mount();
      observatory.openPreview('alpha');

      homeBottomSheet.turnTo(7);

      expect(observatory.preview()).toBe('alpha');
    });
  });

  describe('what the page shows of it', () => {
    it('draws the home bottom sheet on the phone home view, in place of the title', () => {
      const { observatory, homeBottomSheet } = mount();

      expect(homeBottomSheet.isPhone()).toBe(true);
      expect(homeBottomSheet.isShown()).toBe(true);
      expect(homeBottomSheet.showsTitle()).toBe(false);

      observatory.syncRoute('about');
      expect(homeBottomSheet.isShown()).toBe(false);
    });

    it('draws the title, and no home bottom sheet, on the desktop home view', () => {
      const { homeBottomSheet } = mount(false);

      expect(homeBottomSheet.isPhone()).toBe(false);
      expect(homeBottomSheet.isShown()).toBe(false);
      expect(homeBottomSheet.showsTitle()).toBe(true);
    });

    it('anchors the scene on the cards at rest and on the project once posed', () => {
      const { observatory, homeBottomSheet } = mount();
      expect(homeBottomSheet.anchor()).toBe('rule');

      observatory.openPreview('beta');
      expect(homeBottomSheet.anchor()).toBe('preview');
    });
  });
});
