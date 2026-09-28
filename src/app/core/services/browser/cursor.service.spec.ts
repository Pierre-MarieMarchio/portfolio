import { CursorService } from './cursor.service';
import { injectOn } from '@testing/fixtures/testbed.fixture';

describe('CursorService', () => {
  afterEach(() => {
    document.body.style.cursor = '';
  });

  it('is inert on the server: leaves the cursor alone', () => {
    injectOn(CursorService, 'server').set('grabbing');

    expect(document.body.style.cursor).toBe('');
  });

  it('sets the page cursor, and gives it back, in the browser', () => {
    const cursor = injectOn(CursorService, 'browser');

    cursor.set('grabbing');
    expect(document.body.style.cursor).toBe('grabbing');
    cursor.set('');

    expect(document.body.style.cursor).toBe('');
  });
});
