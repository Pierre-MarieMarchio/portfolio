import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Entrance } from '../models';
import { WithheldInertDirective } from './withheld-inert.directive';

@Component({
  imports: [WithheldInertDirective],
  template: `<button [appWithheldInert]="arrival()" id="panel">panel</button>`,
})
class Page {
  public readonly arrival = signal<Entrance>('timed');
}

const mount = async () => {
  TestBed.configureTestingModule({ imports: [Page] });
  const fixture = TestBed.createComponent(Page);
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    panel: host.querySelector('#panel') as HTMLButtonElement,
  };
};

describe('WithheldInertDirective', () => {
  it('is inert while the intro retains it', async () => {
    const { fixture, panel } = await mount();

    fixture.componentInstance.arrival.set('withheld');
    await fixture.whenStable();

    expect(panel.inert).toBe(true);
  });

  it('is reachable once shown', async () => {
    const { fixture, panel } = await mount();
    fixture.componentInstance.arrival.set('withheld');
    await fixture.whenStable();

    fixture.componentInstance.arrival.set('shown');
    await fixture.whenStable();

    expect(panel.inert).toBe(false);
  });

  it('is reachable before the intro ever holds it', async () => {
    const { panel } = await mount();

    expect(panel.inert).toBe(false);
  });
});
