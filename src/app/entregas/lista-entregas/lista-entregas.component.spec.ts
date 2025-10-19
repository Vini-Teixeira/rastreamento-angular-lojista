import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaEntregasComponent } from './lista-entregas.component';

describe('ListaEntregasComponent', () => {
  let component: ListaEntregasComponent;
  let fixture: ComponentFixture<ListaEntregasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaEntregasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaEntregasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
