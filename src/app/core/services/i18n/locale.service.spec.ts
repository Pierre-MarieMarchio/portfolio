import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  MOCK_PLATFORM_LOCATION_CONFIG,
  MockPlatformLocation,
} from '@angular/common/testing';
import { PlatformLocation } from '@angular/common';
import { provideRouter, Router } from '@angular/router';
import { LocaleService } from './locale.service';

@Component({ template: '' })
class Blank {}

const locale = (startUrl: string) => {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: '**', component: Blank }]),
      { provide: MOCK_PLATFORM_LOCATION_CONFIG, useValue: { startUrl } },
      { provide: PlatformLocation, useClass: MockPlatformLocation },
    ],
  });
  return TestBed.inject(LocaleService);
};

describe('LocaleService', () => {
  afterEach(() => {
    document.documentElement.setAttribute('lang', 'fr');
    TestBed.resetTestingModule();
  });

  it('reads the language of the loaded address before the first navigation', () => {
    const service = locale('http://localhost/en/projects');

    expect(service.lang()).toBe('en');
    expect(service.path()).toBe('/en/projects');
  });

  it('follows the address of the last navigation', async () => {
    const service = locale('http://localhost/projets');

    await TestBed.inject(Router).navigateByUrl('/en/about');

    expect(service.lang()).toBe('en');
    expect(service.path()).toBe('/en/about');
  });

  it('keeps the language of the address on show while a navigation is pending', async () => {
    const service = locale('http://localhost/projets');
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/a-propos');

    const pending = router.navigateByUrl('/en/about');

    expect(service.lang()).toBe('fr');
    await pending;
    expect(service.lang()).toBe('en');
  });

  it('says the language on the document root', async () => {
    locale('http://localhost/projets');

    await TestBed.inject(Router).navigateByUrl('/en');
    TestBed.tick();

    expect(document.documentElement.getAttribute('lang')).toBe('en');
  });
});
