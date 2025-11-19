import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaSocorrosComponent } from './lista-socorros.component';

describe('ListaSocorrosComponent', () => {
  let component: ListaSocorrosComponent;
  let fixture: ComponentFixture<ListaSocorrosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaSocorrosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaSocorrosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
