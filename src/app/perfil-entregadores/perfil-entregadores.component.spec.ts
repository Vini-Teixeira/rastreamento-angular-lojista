import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerfilEntregadoresComponent } from './perfil-entregadores.component';

describe('PerfilEntregadoresComponent', () => {
  let component: PerfilEntregadoresComponent;
  let fixture: ComponentFixture<PerfilEntregadoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilEntregadoresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PerfilEntregadoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
