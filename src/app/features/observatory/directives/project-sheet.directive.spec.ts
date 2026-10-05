import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideStatewise } from 'ngx-statewise';
import { BottomSheetComponent } from '@shared/mobile-nav/components';
import { BackLayersService } from '@shared/mobile-nav/services';
import { provideMobileNavLayout } from '@testing/doubles/mobile-nav-layout.double';
import { ObservatoryManager } from '../states';
import { ProjectSheetDirective } from './project-sheet.directive';

@Component({
  imports: [BottomSheetComponent, ProjectSheetDirective],
  template: `<app-bottom-sheet appProjectSheet>Contenu</app-bottom-sheet>`,
})
class ProjectSheetHost {
  public readonly bottomSheet = viewChild.required(BottomSheetComponent);
  public readonly shown = signal(true);
}

const mount = async () => {
  TestBed.configureTestingModule({
    imports: [ProjectSheetHost],
    providers: [
      provideStatewise(),
      provideMobileNavLayout(),
      BackLayersService,
    ],
  });
  const observatory = TestBed.inject(ObservatoryManager);
  const fixture = TestBed.createComponent(ProjectSheetHost);
  await fixture.whenStable();
  const settle = async (...at: Parameters<ObservatoryManager['syncRoute']>) => {
    observatory.syncRoute(...at);
    await fixture.whenStable();
  };
  return { fixture, settle };
};

describe('ProjectSheetDirective', () => {
  it('leaves the bottom sheet where it is while no project is opened', async () => {
    const { fixture } = await mount();

    expect(fixture.componentInstance.bottomSheet().detent()).toBe('half');
  });

  it('raises the bottom sheet to full when a project is opened, whatever the detent it was left at', async () => {
    const { fixture, settle } = await mount();
    const { bottomSheet } = fixture.componentInstance;
    await settle('index');
    await settle('sheet', 'alpha');
    bottomSheet().detent.set('half');
    await settle('index');

    await settle('sheet', 'beta');

    expect(bottomSheet().detent()).toBe('full');
  });

  it('keeps the detent of a project when the reader comes back to it', async () => {
    const { fixture, settle } = await mount();
    const { bottomSheet } = fixture.componentInstance;
    await settle('sheet', 'alpha');
    bottomSheet().detent.set('half');
    await settle('about');

    await settle('sheet', 'alpha');

    expect(bottomSheet().detent()).toBe('half');
  });
});
