import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { appConfig } from '@app/app.config';
import { AppErrorHandler } from '@app/core/error-handling';

describe('The composition root', () => {
  it('provides the application error handler', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });

    expect(TestBed.inject(ErrorHandler)).toBeInstanceOf(AppErrorHandler);
  });
});
