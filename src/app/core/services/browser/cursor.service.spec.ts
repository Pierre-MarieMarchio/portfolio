import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CursorService } from './cursor.service';

const inject = (platform: 'browser' | 'server') => {
  TestBed.configureTestingModule({
    providers: [{ provide: PLATFORM_ID, useValue: platform }],
  });
  return TestBed.inject(CursorService);
};

describe('CursorService', () => {
  afterEach(() => {
    document.body.style.cursor = '';
    TestBed.resetTestingModule();
  });

  it('is inert on the server: leaves the cursor alone', () => {
    inject('server').set('grabbing');

    expect(document.body.style.cursor).toBe('');
  });

  it('sets the page cursor, and gives it back, in the browser', () => {
    const cursor = inject('browser');

    cursor.set('grabbing');
    expect(document.body.style.cursor).toBe('grabbing');
    cursor.set('');

    expect(document.body.style.cursor).toBe('');
  });
});
