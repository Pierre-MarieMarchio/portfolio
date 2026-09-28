import { SITE_NAME as SITE_NAME_TOKEN } from '@app/core/ports';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy } from '@angular/router';
import { RouteHeadStrategy } from './route-head.strategy';

@Component({ template: '' })
class Blank {}

const go = (url: string) => TestBed.inject(Router).navigateByUrl(url);

const title = () => TestBed.inject(Title).getTitle();

const tag = (selector: string) =>
  TestBed.inject(Meta).getTag(selector)?.content ?? null;

const SITE_NAME = 'Pierre-Marie Marchio';

describe('PageTitleStrategy', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: SITE_NAME_TOKEN, useValue: SITE_NAME },
        provideRouter([
          {
            path: 'described',
            component: Blank,
            title: 'Projets',
            data: { description: 'Les projets.' },
          },
          { path: 'bare', component: Blank, title: 'Sans description' },
          { path: 'untitled', component: Blank },
        ]),
        { provide: TitleStrategy, useClass: RouteHeadStrategy },
      ],
    });
  });

  it('appends the site name to the route title, on the tab and the card', async () => {
    await go('/described');

    expect(title()).toBe(`Projets · ${SITE_NAME}`);
    expect(tag('property="og:title"')).toBe(`Projets · ${SITE_NAME}`);
  });

  it('turns data.description into the meta description', async () => {
    await go('/described');

    expect(tag('name="description"')).toBe('Les projets.');
    expect(tag('property="og:description"')).toBe('Les projets.');
  });

  it('drops the previous description on a page that has none', async () => {
    await go('/described');
    await go('/bare');

    expect(tag('name="description"')).toBeNull();
    expect(tag('property="og:description"')).toBeNull();
  });

  it('falls back to the site name alone on a route without a title', async () => {
    await go('/untitled');

    expect(title()).toBe(SITE_NAME);
  });
});
