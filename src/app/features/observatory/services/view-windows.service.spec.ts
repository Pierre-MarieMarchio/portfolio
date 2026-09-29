import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideStatewise } from 'ngx-statewise';
import { ViewHeadingDirective } from '@shared/ui/directives';
import { WindowStackService } from '@shared/windows/services';
import { ObservatoryManager } from '../states';
import { ViewSlotDirective } from '../directives';
import { ViewWindowsService } from './view-windows.service';

@Component({
  imports: [ViewHeadingDirective, ViewSlotDirective],
  template: `
    <div appViewSlot="home">
      <h1 tabindex="-1" appViewHeading>Home</h1>
    </div>
    <div appViewSlot="preview">
      <h1 tabindex="-1" appViewHeading>Preview</h1>
    </div>
  `,
})
class Views {}

const mount = async () => {
  TestBed.configureTestingModule({
    imports: [Views],
    providers: [provideStatewise(), WindowStackService, ViewWindowsService],
  });
  const observatory = TestBed.inject(ObservatoryManager);
  observatory.syncRoute('home');
  TestBed.inject(ViewWindowsService);
  const fixture = TestBed.createComponent(Views);
  document.body.append(fixture.nativeElement as HTMLElement);
  const settle = async (): Promise<void> => {
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  };
  await settle();
  observatory.syncRoute('index');
  await settle();
  observatory.syncRoute('home');
  await settle();
  return {
    fixture,
    observatory,
    settle,
    focused: () => document.activeElement?.textContent,
  };
};

describe('ViewWindowsService', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('focuses the preview title once it is opened from home, like a page window', async () => {
    const { observatory, settle, focused } = await mount();
    expect(focused()).toBe('Home');

    observatory.openPreview('skyted');
    await settle();

    expect(focused()).toBe('Preview');
  });

  it('gives the focus back to the home title once the preview closes', async () => {
    const { observatory, settle, focused } = await mount();
    observatory.openPreview('skyted');
    await settle();

    observatory.togglePreview('skyted');
    await settle();

    expect(focused()).toBe('Home');
  });

  it('does not move the focus for a preview pinned open away from home', async () => {
    const { observatory, settle, focused } = await mount();
    observatory.syncRoute('index');
    await settle();

    observatory.openPreview('skyted');
    observatory.togglePin('preview');
    await settle();

    expect(focused()).not.toBe('Preview');
  });
});
