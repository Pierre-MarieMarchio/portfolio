import { TestBed } from '@angular/core/testing';
import { provideStatewise } from 'ngx-statewise';
import { ObservatoryManager } from '../states';
import { ProjectSheetService } from './project-sheet.service';

const mount = () => {
  TestBed.configureTestingModule({
    providers: [provideStatewise(), ProjectSheetService],
  });
  const manager = TestBed.inject(ObservatoryManager);
  const sheet = TestBed.inject(ProjectSheetService);
  const route = (
    ...at: Parameters<ObservatoryManager['syncRoute']>
  ): number => {
    const before = sheet.openings();
    manager.syncRoute(...at);
    return sheet.openings() - before;
  };
  return { route };
};

describe('ProjectSheetService', () => {
  describe('a project is opened', () => {
    it('when the page is loaded on a project', () => {
      const { route } = mount();

      expect(route('sheet', 'alpha')).toBe(1);
    });

    it('from the list, even the project that was read just before', () => {
      const { route } = mount();
      route('index');
      route('sheet', 'alpha');
      route('index');

      expect(route('sheet', 'alpha')).toBe(1);
    });

    it('from the list, for another project', () => {
      const { route } = mount();
      route('index');
      route('sheet', 'alpha');
      route('index');

      expect(route('sheet', 'beta')).toBe(1);
    });

    it('from the home, for a project other than the one held', () => {
      const { route } = mount();
      route('sheet', 'alpha');
      route('home');

      expect(route('sheet', 'beta')).toBe(1);
    });

    it('from a project, for the next one', () => {
      const { route } = mount();
      route('sheet', 'alpha');

      expect(route('sheet', 'beta')).toBe(1);
    });
  });

  describe('a project is not opened again', () => {
    it.each(['home', 'about'] as const)(
      'when it comes back through %s, the project held being the same',
      (view) => {
        const { route } = mount();
        route('sheet', 'alpha');
        route(view);

        expect(route('sheet', 'alpha')).toBe(0);
      },
    );

    it('when the reader leaves the project', () => {
      const { route } = mount();
      route('sheet', 'alpha');

      expect(route('about')).toBe(0);
    });
  });
});
