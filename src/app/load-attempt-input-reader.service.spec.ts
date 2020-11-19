import { TestBed } from '@angular/core/testing';

import { LoadAttemptInputReaderService } from './load-attempt-input-reader.service';

describe('LoadAttemptInputReaderService', () => {
  let service: LoadAttemptInputReaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadAttemptInputReaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('test extractAttemptsFromFile', () => {
    
  });

  describe('test parseLoadAttempts', () => {
    
  });

  describe('test readFileContents', () => {
    
  });
});
