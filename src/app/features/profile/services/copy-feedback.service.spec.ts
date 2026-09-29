import { TestBed } from '@angular/core/testing';
import { ClipboardService } from '@app/core/services';
import { CopyFeedbackService } from './copy-feedback.service';

const setup = ({ canCopy = true } = {}) => {
  const copy = vi.fn(() => Promise.resolve(canCopy));
  TestBed.configureTestingModule({
    providers: [
      CopyFeedbackService,
      { provide: ClipboardService, useValue: { copy } },
    ],
  });
  const service = TestBed.inject(CopyFeedbackService);
  return { service, copy };
};

describe('CopyFeedbackService', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('says nothing before a copy is asked for', () => {
    const { service } = setup();

    expect(service.isCopied()).toBe(false);
  });

  it('copies the given text and says so once the browser confirms it', async () => {
    const { service, copy } = setup();

    service.copy('someone@example.com');
    await Promise.resolve();
    await Promise.resolve();

    expect(copy).toHaveBeenCalledWith('someone@example.com');
    expect(service.isCopied()).toBe(true);
  });

  it('stops saying it a few seconds later', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { service } = setup();

    service.copy('someone@example.com');
    await vi.advanceTimersByTimeAsync(4000);

    expect(service.isCopied()).toBe(false);
  });

  it('says nothing when the browser would not copy', async () => {
    const { service } = setup({ canCopy: false });

    service.copy('someone@example.com');
    await Promise.resolve();
    await Promise.resolve();

    expect(service.isCopied()).toBe(false);
  });
});
