import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotFoundWindowComponent } from './not-found-window.component';
import { provideTexts } from '@testing/fixtures/texts.fixture';

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
      'Rien en orbite à cette adresse.',
    );
    expect(host.querySelector('a')?.getAttribute('href')).toBe('/projets');
  });

  it('counts the projects of the index, on two digits', async () => {
    const { fixture, host } = await mount(7);
    const sentence = (): string =>
      host
        .querySelector('h1 + p')
        ?.textContent?.replaceAll(/\s+/g, ' ')
        .trim() ?? '';

    expect(sentence()).toBe('Aucun des 07 projets ne correspond à ce lien.');

    fixture.componentRef.setInput('total', 12);
    await fixture.whenStable();
    expect(sentence()).toContain('Aucun des 12 projets');
  });
});
