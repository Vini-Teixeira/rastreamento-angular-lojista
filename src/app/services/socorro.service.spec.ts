import { TestBed } from '@angular/core/testing';

import { SocorroService } from './socorro.service';

describe('SocorroService', () => {
  let service: SocorroService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SocorroService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
