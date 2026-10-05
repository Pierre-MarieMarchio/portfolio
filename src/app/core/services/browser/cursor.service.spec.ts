import { CursorService } from './cursor.service';
import { injectOn } from '@testing/fixtures/testbed.fixture';

describe('CursorService', () => {
  afterEach(() => {
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.getSelection()?.removeAllRanges();
    document.body.replaceChildren();
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

  it('is inert on the server: leaves the selection alone', () => {
    injectOn(CursorService, 'server').blockSelection(true);

    expect(document.body.style.userSelect).toBe('');
  });

  it('blocks the page selection, and gives it back, in the browser', () => {
    const cursor = injectOn(CursorService, 'browser');

    cursor.blockSelection(true);
    expect(document.body.style.userSelect).toBe('none');
    cursor.blockSelection(false);

    expect(document.body.style.userSelect).toBe('');
  });

  it('clears a selection already under way once it blocks', () => {
    const cursor = injectOn(CursorService, 'browser');
    const mark = document.createElement('p');
    mark.textContent = 'LE';
    document.body.append(mark);
    const range = document.createRange();
    range.selectNodeContents(mark);
    document.getSelection()?.addRange(range);

    cursor.blockSelection(true);

    expect(document.getSelection()?.toString()).toBe('');
  });
});
