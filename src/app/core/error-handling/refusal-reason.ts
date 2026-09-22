import { HttpErrorResponse } from '@angular/common/http';

/** What a server puts in the body of a refusal, when it says anything. */
interface RefusalBody {
  readonly message?: unknown;
}

/**
 * The sentence a refused request came back with.
 *
 * A form that cannot repeat the reason cannot help: "something went wrong"
 * leaves the reader to guess. So the server's own words travel, and the
 * fallback is only for a failure that carried none, such as a network that
 * never answered.
 */
export function refusalReason(
  error: unknown,
  fallback = 'La requête a été refusée.',
): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  const { message } = (error.error ?? {}) as RefusalBody;

  return typeof message === 'string' && message.length > 0 ? message : fallback;
}
