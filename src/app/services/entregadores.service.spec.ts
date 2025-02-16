import { TestBed } from '@angular/core/testing';

import { EntregadoresService } from '../entregadores.service';

describe('EntregadoresService', () => {
  let service: EntregadoresService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EntregadoresService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
