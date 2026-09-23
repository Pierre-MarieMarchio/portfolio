import { TestBed } from '@angular/core/testing';
import { provideStatewise } from 'ngx-statewise';
import { provideTexts } from '@testing/fixtures/texts.fixture';
import { AnimationManager } from '../../states';
import { AnimationToggleComponent } from './animation-toggle.component';

const mount = async () => {
  TestBed.configureTestingModule({
    imports: [AnimationToggleComponent],
    providers: [provideStatewise({ effects: [] }), provideTexts()],
  });
  const fixture = TestBed.createComponent(AnimationToggleComponent);
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    animation: TestBed.inject(AnimationManager),
    pause: () => host.querySelector('button'),
    rule: () => host.querySelector('.rule'),
  };
};

describe('AnimationToggleComponent', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('offers to pause the animation while it runs, after a hidden rule', async () => {
    const { pause, rule } = await mount();

    expect(rule()?.getAttribute('aria-hidden')).toBe('true');
    expect(pause()?.getAttribute('aria-label')).toBe(
      'Mettre l’animation de l’objet en pause',
    );
    expect(pause()?.getAttribute('title')).toBe(
      'Mettre l’animation de l’objet en pause',
    );
    expect(pause()?.textContent?.trim()).toBe('❚❚');
  });

  it('pauses the desktop animation on click, and resumes it on the next', async () => {
    const { fixture, animation, pause } = await mount();

    pause()?.click();
    await fixture.whenStable();

    expect(animation.paused()).toBe(true);

    pause()?.click();
    await fixture.whenStable();

    expect(animation.paused()).toBe(false);
  });

  it('names the pause after what it will do', async () => {
    const { fixture, animation, pause } = await mount();

    animation.togglePause();
    await fixture.whenStable();

    expect(pause()?.getAttribute('aria-label')).toBe(
      'Reprendre l’animation de l’objet',
    );
    expect(pause()?.textContent?.trim()).toBe('▶');
  });
});
