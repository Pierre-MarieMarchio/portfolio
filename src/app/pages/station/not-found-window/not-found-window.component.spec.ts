import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotFoundWindowComponent } from './not-found-window.component';
import { provideTexts } from '@testing/texts';

const mount = async (total: number) => {
  TestBed.configureTestingModule({
    imports: [NotFoundWindowComponent],
    providers: [provideTexts(), provideRouter([])],
  });
  const fixture = TestBed.createComponent(NotFoundWindowComponent);
  fixture.componentRef.setInput('total', total);
  await fixture.whenStable();
  return { fixture, host: fixture.nativeElement as HTMLElement };
};

describe('NotFoundWindowComponent', () => {
  it('says the address names no sheet, and heads back to the index', async () => {
    const { host } = await mount(7);

    expect(host.querySelector('h1')?.textContent?.trim()).toBe(
      'Cette réalisation n’existe pas.',
    );
    expect(host.querySelector('a')?.getAttribute('href')).toBe('/projets');
  });

  /** Counted, not written: a project added changes the sentence by itself. */
  it('counts the sheets of the index, on two digits', async () => {
    const { fixture, host } = await mount(7);
    const sentence = (): string =>
      host
        .querySelector('h1 + p')
        ?.textContent?.replaceAll(/\s+/g, ' ')
        .trim() ?? '';

    expect(sentence()).toBe(
      'L’adresse demandée ne correspond à aucune des 07 fiches du relevé.',
    );

    fixture.componentRef.setInput('total', 12);
    await fixture.whenStable();
    expect(sentence()).toContain('aucune des 12 fiches');
  });
});
