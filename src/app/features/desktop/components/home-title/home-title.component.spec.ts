import { TestBed } from '@angular/core/testing';
import { provideTexts } from '@testing/fixtures/texts.fixture';
import { HomeTitleComponent } from './home-title.component';

const mount = async () => {
  TestBed.configureTestingModule({
    imports: [HomeTitleComponent],
    providers: [provideTexts()],
  });
  const fixture = TestBed.createComponent(HomeTitleComponent);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
};

describe('HomeTitleComponent', () => {
  it('says where the search stands, in a paragraph right under the h1', async () => {
    const host = await mount();
    const status = host.querySelector('h1 + p.status');

    expect(status?.textContent?.trim()).toBe(
      'Je cherche une alternance à Toulouse ou en télétravail, disponible dès maintenant.',
    );
    expect(host.querySelectorAll('h1, h2, h3')).toHaveLength(1);
  });
});
