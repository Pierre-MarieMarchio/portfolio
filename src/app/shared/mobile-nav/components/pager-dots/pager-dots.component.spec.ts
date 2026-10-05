import { TestBed } from '@angular/core/testing';
import { provideTexts } from '@testing/fixtures/texts.fixture';
import { recordOutput } from '@testing/fixtures/testbed.fixture';
import { PagerDotsComponent } from './pager-dots.component';

const mount = async (count: number, current: number) => {
  TestBed.configureTestingModule({
    imports: [PagerDotsComponent],
    providers: [provideTexts()],
  });
  const fixture = TestBed.createComponent(PagerDotsComponent);
  fixture.componentRef.setInput('count', count);
  fixture.componentRef.setInput('current', current);
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    chosen: recordOutput(fixture.componentInstance.chosen),
    dots: (): HTMLButtonElement[] => [
      ...host.querySelectorAll<HTMLButtonElement>('.dot'),
    ],
  };
};

describe('PagerDotsComponent', () => {
  it('draws one dot per page, named by its place and out of the tab order', async () => {
    const { dots } = await mount(3, 0);

    expect(dots().map((dot) => dot.getAttribute('aria-label'))).toEqual([
      'Page 1 sur 3',
      'Page 2 sur 3',
      'Page 3 sur 3',
    ]);
    expect(dots().every((dot) => dot.tabIndex === -1)).toBe(true);
  });

  it('marks the current page, and moves the mark with it', async () => {
    const { fixture, dots } = await mount(3, 0);
    expect(dots().map((dot) => dot.hasAttribute('aria-current'))).toEqual([
      true,
      false,
      false,
    ]);

    fixture.componentRef.setInput('current', 2);
    await fixture.whenStable();

    expect(dots().map((dot) => dot.hasAttribute('aria-current'))).toEqual([
      false,
      false,
      true,
    ]);
  });

  it('says which page a touched dot leads to', async () => {
    const { dots, chosen } = await mount(3, 0);

    dots()[1]?.click();
    dots()[2]?.click();

    expect(chosen).toEqual([1, 2]);
  });

  it('draws nothing for no page', async () => {
    const { dots } = await mount(0, 0);

    expect(dots()).toHaveLength(0);
  });
});
