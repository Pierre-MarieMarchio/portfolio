import { HttpErrorResponse } from '@angular/common/http';
import { refusalReason } from './refusal-reason';

describe('refusalReason', () => {
  it('repeats the sentence the server refused with', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: 'adresse invalide' },
    });

    expect(refusalReason(error)).toBe('adresse invalide');
  });

  it('falls back when the refusal carried no sentence', () => {
    const error = new HttpErrorResponse({ status: 0 });

    expect(refusalReason(error, 'hors ligne')).toBe('hors ligne');
  });

  it('does not pretend a thrown Error was a refusal', () => {
    expect(refusalReason(new Error('boom'), 'refus')).toBe('refus');
  });
});
