import { TestBed } from '@angular/core/testing';

import { PainelEstadoService } from './painel-estado.service';

describe('PainelEstadoService', () => {
  let service: PainelEstadoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PainelEstadoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
