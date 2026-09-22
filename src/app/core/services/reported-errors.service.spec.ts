import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ReportedErrors } from './reported-errors.service';

describe('ReportedErrors', () => {
  let reported: ReportedErrors;

  beforeEach(() => {
    reported = TestBed.inject(ReportedErrors);
  });

  const messages = (): readonly string[] =>
    reported.all().map((entry) => entry.message);

  it('reads the message off an Error', () => {
    reported.record(new Error('the handle owns no updater'));

    expect(messages()).toEqual(['the handle owns no updater']);
  });

  /** The regression the ordering in `messageOf` exists for. */
  it('prefers the server sentence on a refused request', () => {
    reported.record(
      new HttpErrorResponse({ status: 400, error: { message: 'refusé' } }),
    );

    expect(messages()).toEqual(['refusé']);
  });

  it('reads a plain object that carries a message', () => {
    reported.record({ message: 'answered nothing' });

    expect(messages()).toEqual(['answered nothing']);
  });

  it('puts the newest first and keeps twenty at most', () => {
    for (let index = 0; index < 25; index += 1) {
      reported.record(new Error(`failure ${String(index)}`));
    }

    expect(reported.all()).toHaveLength(20);
    expect(messages()[0]).toBe('failure 24');
  });

  it('clears them', () => {
    reported.record(new Error('gone'));
    reported.clear();

    expect(reported.all()).toEqual([]);
  });
});
